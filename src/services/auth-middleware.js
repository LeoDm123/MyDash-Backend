// middlewares/auth-middleware.js
function authMiddleware(req, res, next) {
  const authHeader = req.get("authorization"); // case-insensitive
  if (!authHeader) {
    console.warn("Auth faltante. Headers:", req.headers); // temporal
    return res.status(401).json({ msg: "Falta header Authorization" });
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ msg: "Formato inválido de Authorization" });
  }

  if (token !== process.env.API_BEARER_TOKEN) {
    return res.status(403).json({ msg: "Token inválido" });
  }

  next();
}
module.exports = authMiddleware;
