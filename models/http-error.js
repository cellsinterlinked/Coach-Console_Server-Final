class HttpError extends Error {  // based on error but we tweak the class
  constructor(message, errorCode) {
    super(message); //Add a message property
    this.code = errorCode; // adds a code property
  }
}

module.exports = HttpError;