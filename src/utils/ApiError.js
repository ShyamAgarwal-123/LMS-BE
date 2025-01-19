export default class ApiError extends Error {
  constructor({
    message = "Something Went Wrong",
    statusCode,
    stack,
    errors = [],
    path = "",
  }) {
    super(message);
    this.name = "ApiError";
    this.message = message;
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
    if (path) {
      this.path = path;
    }
  }
}
