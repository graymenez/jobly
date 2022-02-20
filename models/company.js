"use strict";
const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  ExpressError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`
    );
    return companiesRes.rows;
  }
  static async search(keyword) {
    const companyNameRes = await db.query(
      `SELECT handle,name,description,num_employees AS "numEmployees",logo_url AS "logoUrl" FROM companies WHERE lower(name) LIKE '%${keyword}%'`
    );
    if (companyNameRes.rows.length === 0) {
      throw new ExpressError(
        `Cannot find company with keyword ${keyword}`,
        404
      );
    }
    return companyNameRes.rows;
  }
  static async searchByMinEmployees(number) {
    // returns a object of companies with minimum 'number' of employees. The number is specified by 'number' param

    const companiesRes = await db.query(
      'SELECT handle,name,description,num_employees AS "numEmployees",logo_url AS "logoUrl" FROM companies WHERE num_employees >=$1 ORDER BY num_employees',
      [number]
    );

    //if no data respond with 404 error
    if (companiesRes.rows.length === 0) {
      const e = new ExpressError(
        `Cannot find company with min of ${number}`,
        404
      );
      return e;
    }
    return companiesRes.rows;
  }
  static async searchByMaxEmployees(number) {
    // returns a object of companies with maximum 'number' of employees. The number is specified by 'number' param
    const companiesRes = await db.query(
      'SELECT handle,name,description,num_employees AS "numEmployees",logo_url AS "logoUrl" FROM companies WHERE num_employees <=$1 ORDER BY num_employees',
      [number]
    );

    //if no data respond with 404 error
    if (companiesRes.rows.length === 0) {
      const e = new ExpressError(
        `Cannot find company with max of ${number}`,
        404
      );
      return e;
    }
    return companiesRes.rows;
  }
  static async searchBetweenNumEmployees(min, max) {
    // returns a object of companies that have employees employees between min and max. The numbers is specified by 'min' and 'max' param
    if (Number(min) > Number(max)) {
      throw new ExpressError("Min cannot be greater than Max", 400);
    }
    const companiesRes = await db.query(
      `SELECT handle,name,description,num_employees AS "numEmployees",logo_url AS "logoUrl" FROM companies WHERE num_employees >=$1 AND num_employees <=$2 ORDER BY num_employees`,
      [min, max]
    );
    if (companiesRes.rows.length === 0) {
      throw new ExpressError("No Data", 404);
    }
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT c.handle,
                  c.name,
                  c.description,
                  c.num_employees AS "numEmployees",
                  c.logo_url AS "logoUrl",
                  j.*
           FROM companies AS c
           LEFT JOIN jobs AS j
           ON c.handle = j.company_handle
           WHERE c.handle = $1`,
      [handle]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;
