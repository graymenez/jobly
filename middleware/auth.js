"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, ExpressError } = require("../expressError");

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();

      res.locals.user = jwt.verify(token, SECRET_KEY);
    }

    console.log("AUTHORIZED");
    console.log(res.locals.user);
    console.log("AUTHORIZED");

    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}
function ensureLoggedInIsAdmin(req, res, next) {
  try {
    if (!res.locals.user) throw new ExpressError("User is not an admin", 401);
    if (res.locals.user.isAdmin === false)
      throw new ExpressError("User is not an admin", 401);
    return next();
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureLoggedInIsAdmin,
};
