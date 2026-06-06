export function sendResponse(res, { statusCode = 200, message = 'Success', data = null, meta = null }) {
  const body = { success: statusCode < 400, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
}
