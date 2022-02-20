"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, ExpressError } = require("../expressError");
const { ensureLoggedIn, ensureLoggedInIsAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const { max } = require("pg/lib/defaults");
const e = require("express");
const { type } = require("express/lib/response");
const db = require("../db");
const User = require("../models/user");

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedInIsAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    if (req.query.min && req.query.max) {
      // if Min and Max are not type integer whether its a string or not throws an Express Error
      if (isNaN(Number(req.query.min)) || isNaN(Number(req.query.max))) {
        console.log(typeof req.query.min);
        const e = new ExpressError("Min and Max must be Integer", 400);
        return next(e);
      }

      // Query through companies between Min and Max includes Min and Max
      return res.json({
        companies: await Company.searchBetweenNumEmployees(
          req.query.min,
          req.query.max
        ),
      });
    }

    // Query through companies and specify a min amount of employees
    if (req.query.min) {
      if (isNaN(Number(req.query.min))) {
        const e = new ExpressError("Min must be Integer", 400);
        return next(e);
      }
      return res.json({
        companies: await Company.searchByMinEmployees(req.query.min),
      });
    }

    // Query through companies and specify a max amount of employees
    if (req.query.max) {
      if (isNaN(Number(req.query.max))) {
        const e = new ExpressError("Max must be Integer", 400);
        return next(e);
      }
      return res.json({
        companies: await Company.searchByMaxEmployees(req.query.max),
      });
    }

    //Query through companies with a keyword in the 'name' query
    if (req.query.name) {
      //If user searches with integer it will search for companies that include the integer as a string.
      if (isNaN(Number(req.query.name)) === false) {
        const e = new ExpressError(
          `If company name includes ${req.query.name}: Cannot find company with keyword ${req.query.name}. If you are trying to set an integer: This query only accepts type strings`,
          404
        );
        return next(e);
      }
      return res.json({
        companies: await Company.search(req.query.name),
      });
    }

    const companies = await Company.findAll();
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    const jobs = await db.query(
      "SELECT j.id,j.title,j.salary,j.equity FROM jobs AS j LEFT JOIN companies AS c ON j.company_handle = c.handle WHERE j.company_handle = $1",
      [company.handle]
    );
    console.log(jobs.rows);
    return res.json({
      company: {
        handle: company.handle,
        name: company.name,
        description: company.description,
        numEmployees: company.numEmployees,
        logoUrl: company.logoUrl,
        jobs: jobs.rows,
      },
    });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch(
  "/:handle",
  ensureLoggedInIsAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, companyUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const company = await Company.update(req.params.handle, req.body);
      return res.json({ company });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete(
  "/:handle",
  ensureLoggedInIsAdmin,
  async function (req, res, next) {
    try {
      await Company.remove(req.params.handle);
      return res.json({ deleted: req.params.handle });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
