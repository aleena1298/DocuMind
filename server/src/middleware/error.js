export function notFound(req, res) {
  res.status(404).json({ message: 'Route not found.' });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err?.name === 'ZodError') {
    const message = err.issues?.[0]?.message || 'Invalid request data.';
    return res.status(400).json({ message });
  }
  if (err?.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: 'That record already exists.' });
  }
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? 'Something went wrong on the server.' : err.message
  });
}
