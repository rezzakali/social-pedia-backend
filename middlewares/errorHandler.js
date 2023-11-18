import ErrorResponse from '../utility/error.js';

const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Eerver Error';

  // Check if it's an instance of ErrorResponse
  if (err instanceof ErrorResponse) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Duplicate key value error (MongoDB)
  if (err.code === 11000) {
    message = 'Duplicate value not allowed!';
    statusCode = 400; // Bad Request
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const errorMessages = Object.values(err.errors).map((val) => val.message);
    message = errorMessages.join(', ');
    statusCode = 400; // Bad Request
  }
  // Sending the error response
  res.status(statusCode).json({ success: false, error: message });
};

export default errorHandler;
