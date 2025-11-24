// Error handling middleware

// Handle validation errors
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(val => val.message);
  const message = `Invalid input data: ${errors.join(', ')}`;
  return {
    success: false,
    message,
    statusCode: 400
  };
};

// Handle duplicate key errors
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
  return {
    success: false,
    message,
    statusCode: 400
  };
};

// Handle cast errors (invalid ObjectId)
const handleCastError = (err) => {
  const message = `Resource not found with id: ${err.value}`;
  return {
    success: false,
    message,
    statusCode: 404
  };
};

// Handle JWT errors
const handleJWTError = () => {
  return {
    success: false,
    message: 'Invalid token. Please log in again',
    statusCode: 401
  };
};

// Handle JWT expired error
const handleJWTExpiredError = () => {
  return {
    success: false,
    message: 'Your token has expired. Please log in again',
    statusCode: 401
  };
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('🔴 Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = handleCastError(err);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Handle 404 errors
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};
