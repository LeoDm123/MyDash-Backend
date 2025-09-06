// middlewares/auth-middleware.js
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ msg: "Falta header Authorization" });
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ msg: "Formato inválido de Authorization" });
  }

  // ⚠️ En un caso real deberías validar este token contra DB o JWT
  // Para simplificar: lo comparamos con un token fijo de config/env
  if (token !== process.env.API_BEARER_TOKEN) {
    return res.status(403).json({ msg: "Token inválido" });
  }

  next(); // sigue al controller
}

module.exports = authMiddleware;
