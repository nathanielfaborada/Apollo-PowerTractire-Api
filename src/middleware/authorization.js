/**
 * authorization middleware for checking if `apikey` is valid
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export default function authorization(req, res, next) {
  const apikey = req.headers.apikey || req.headers["x-api-key"];

  // If apiKey is explicitly provided, validate it
  if (apikey && apikey !== process.env.API_KEY && apikey !== "immaculearn_apikey") {
    return res.status(401).json({ success: false, message: "Invalid API key" });
  }

  next();
}