const { json } = require("body-parser");
const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("test sql helper", function () {
  test("testing sqlForPartialUpdate", async function () {
    const jsonData = {
      name: "test",
      description: "test",
      numEmployees: 200,
    };
    const jsToSql = { numEmployees: "num_employees" };
    console.log(jsonData, jsToSql);
    expect(sqlForPartialUpdate(jsonData, jsToSql)).toEqual({
      setCols: `"name"=$1, "description"=$2, "num_employees"=$3`,
      values: [`test`, `test`, 200],
    });
  });
});
