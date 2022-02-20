const { request } = require("express");
const { RowDescriptionMessage } = require("pg-protocol/dist/messages");
const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  ExpressError,
} = require("../expressError");
const Company = require("./company.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

const Job = require("../models/job");
const res = require("express/lib/response");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("Create job", function () {
  const newJob = {
    title: "newj2",
    salary: 110000,
    equity: "0.12",
    companyHandle: "c2",
  };

  test("Working", async function () {
    const job = await Job.create(newJob);

    const result = await db.query(
      `SELECT title,salary,equity,company_handle as "companyHandle" FROM jobs WHERE title = $1`,
      [job.title]
    );
    expect(result.rows).toEqual([
      {
        title: "newj2",
        salary: 110000,
        equity: "0.12",
        companyHandle: "c2",
      },
    ]);
  });
});
describe("Get all jobs", function () {
  test("PASS gets all jobs", async function () {
    const result = await Job.get();
    expect(result).toEqual([
      {
        company_handle: "c1",
        equity: "0.1",
        salary: 110000,
        title: "j1",
      },
      {
        company_handle: "c2",
        equity: "0.12",
        salary: 110000,
        title: "j2",
      },
      {
        company_handle: "c3",
        equity: "0.13",
        salary: 110000,
        title: "j3",
      },
    ]);
  });
  test("get by id", async function () {
    const createJob = await Job.create({
      title: "newj2",
      salary: 110000,
      equity: "0.12",
      companyHandle: "c2",
    });
    const usingGet = await Job.getByJob(createJob.id);
    expect(usingGet).toEqual({
      id: usingGet.id,
      title: "newj2",
      salary: 110000,
      equity: "0.12",
      company_handle: "c2",
    });
  });
});

describe("GET search by keyword", function () {
  test("PASS search title j", async function () {
    const result = await Job.search("j");

    // maping over result to get id of each result
    expect(result).toEqual([
      {
        id: result.map((r) => r.id)[0],
        company_handle: "c1",
        equity: "0.1",
        salary: 110000,
        title: "j1",
      },
      {
        id: result.map((r) => r.id)[1],
        company_handle: "c2",
        equity: "0.12",
        salary: 110000,
        title: "j2",
      },
      {
        id: result.map((r) => r.id)[2],
        company_handle: "c3",
        equity: "0.13",
        salary: 110000,
        title: "j3",
      },
    ]);
  });
});
