const res = require("express/lib/response");
const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  ExpressError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
  // Creates a class for Job

  static async create({ title, salary, equity, companyHandle }) {
    const newUser = await db.query(
      `INSERT INTO jobs (title,salary,equity,company_handle) VALUES ($1,$2,$3,$4) RETURNING id,title,salary,equity,company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    console.log(newUser.rows[0]);
    return newUser.rows[0];
  }

  static async get() {
    const jobs = await db.query(
      "SELECT title,salary,equity,company_handle FROM jobs"
    );
    if (jobs.rows.length === 0) {
      throw new ExpressError("No Jobs Found", 404);
    }
    return jobs.rows;
  }

  static async getByJob(id) {
    const jobs = await db.query("SELECT * FROM jobs WHERE id=$1", [id]);
    if (jobs.rows.length === 0) {
      throw new ExpressError(`No Job Found By Id ${id}`);
    }
    return jobs.rows[0];
  }
  static async search(keyword) {
    const result = await db.query(
      `SELECT * FROM jobs WHERE lower(title) LIKE '%${keyword}%'`
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Jobs not found with: ${keyword}`, 404);
    }
    return result.rows;
  }
  static async searchSalary(
    operator,
    salary,
    otherSalary = undefined,
    hasEquity = undefined
  ) {
    if (operator === "min") {
      const result = await db.query(
        "SELECT * FROM jobs WHERE salary >= $1 ORDER BY salary",
        [salary]
      );
      if (result.rows.length === 0) {
        throw new ExpressError("Salary not found", 404);
      }
      if (hasEquity === "true") {
        const result = await db.query(
          "SELECT * FROM jobs WHERE equity IS NOT NULL AND equity > 0 AND salary >= $1 ORDER BY equity",
          [salary]
        );
        if (result.rows.length === 0) {
          throw new ExpressError("Salary not found", 404);
        }
        return result.rows;
      }
      return result.rows;
    }
    if (operator === "max") {
      const result = await db.query(
        "SELECT * FROM jobs WHERE salary <= $1 ORDER BY salary",
        [salary]
      );
      if (result.rows.length === 0) {
        throw new ExpressError("Salary not found", 404);
      }
      return result.rows;
    }

    if (operator === "minMax") {
      const result = await db.query(
        "SELECT * FROM jobs WHERE salary >= $1 AND salary <= $2 ORDER BY salary",
        [salary, otherSalary]
      );

      if (result.rows.length === 0) {
        throw new ExpressError("Salary not found", 404);
      }
      return result.rows;
    }
  }
  static async hasEquity() {
    const result = await db.query(
      "SELECT * FROM jobs WHERE equity IS NOT NULL"
    );
    if (result.rows.length === 0) {
      throw new ExpressError("No Data", 404);
    }
    return result.rows;
  }
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle",
    });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary,
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }
  static async delete(id) {
    const findJob = await db.query("SELECT id FROM jobs WHERE id =$1", [id]);
    if (findJob.rows.length === 0) {
      throw new ExpressError(`Job not found with id ${id}`, 404);
    }
    const results = await db.query(
      "DELETE FROM jobs WHERE id = $1 RETURNING title",
      [id]
    );
    return results.rows[0];
  }
}

module.exports = Job;
