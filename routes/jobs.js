const express = require("express");
const router = express.Router();
const Job = require("../models/job");
const jobsNewSchema = require("../schemas/jobsNew.json");
const jsonschema = require("jsonschema");
const { ExpressError } = require("../expressError");
const { ensureLoggedInIsAdmin } = require("../middleware/auth");

router.get("/", async (req, res, next) => {
  try {
    if (req.query.keyword) {
      const key = await Job.search(req.query.keyword);
      console.log("$$$$$$$$$$$$$");
      console.log(key);
      console.log("$$$$$$$$$$$$$");
      return res.json({ jobs: key });
    }
    if (req.query.min_salary && req.query.max_salary) {
      if (req.query.min_salary > req.query.max_salary) {
        const e = new ExpressError("Min cannot be larger that Max", 400);
        return next(e);
      }
      const salary = await Job.searchSalary(
        "minMax",
        req.query.min_salary,
        req.query.max_salary
      );
      return res.json(salary);
    }
    if (req.query.min_salary) {
      const salary = await Job.searchSalary(
        "min",
        req.query.min_salary,
        undefined,
        req.query.hasEquity
      );
      return res.json(salary);
    }
    if (req.query.max_salary) {
      const salary = await Job.searchSalary("max", req.query.max_salary);
      return res.json(salary);
    }
    if (req.query.hasEquity) {
      const equity = await Job.hasEquity();
      if ((req.query.hasEquity = "true")) {
        return res.json(equity);
      }
    }

    const result = await Job.get();
    const header = req.headers;
    console.log(header);
    console.log(res.locals.user);
    return res.json({ jobs: result });
  } catch (e) {
    return next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const result = await Job.getByJob(req.params.id);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
});
router.post("/", ensureLoggedInIsAdmin, async (req, res, next) => {
  if (Object.keys(req.body).length > 4) {
    const e = new ExpressError(
      "There is additional information that is not needed OR Invalid data entered",
      400
    );
    return next(e);
  }
  const validateData = jsonschema.validate(req.body, jobsNewSchema);
  console.log(validateData.valid);
  if (!validateData.valid) {
    const validStack = validateData.errors.map((e) => e.stack);
    const e = new ExpressError(validStack, 400);
    return next(e);
  }
  const job = await Job.create(req.body);
  return res.json(job);
});

router.patch("/:id", ensureLoggedInIsAdmin, async (req, res, next) => {
  try {
    const result = await Job.update(req.params.id, req.body);
    console.log(result);
    return res.json(result);
  } catch (e) {
    next(e);
  }
});
router.delete("/:id", ensureLoggedInIsAdmin, async (req, res, next) => {
  try {
    const result = await Job.delete(req.params.id);
    return res.json({ DELETED: result });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
