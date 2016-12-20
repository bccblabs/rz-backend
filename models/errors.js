var util = require('util');

function ValidationError(msg) {
    Error.call(this);
    this.name = 'ValidationError';
    this.message = msg;
    Error.captureStackTrace(this, this.constructor);
}

function UserNotFoundError (msg) {
  Error.call (this);
  this.name = 'UserNotFoundError',
  this.message = msg;
  Error.captureStackTrace (this, this.constructor)
}

util.inherits(ValidationError, Error);
util.inherits(UserNotFoundError, Error);

exports.ValidationError = ValidationError;
exports.UserNotFoundError = UserNotFoundError;
