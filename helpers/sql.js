const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // stores an array of the object keys from dataToUpdate
  const keys = Object.keys(dataToUpdate);

  // throws error if there is no data in variable 'keys'
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    //colName: turns javascript camalCasing into sql snake_casing
    //idx: changes variable keys format from ['name','descripton'] to ['"name"=$1', '"description"=$2'] increments by keys index
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    // returns {setCols: cols as one full string out of the array, values: [values of dataToUpdate in an array] }
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
