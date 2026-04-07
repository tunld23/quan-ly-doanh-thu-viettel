import jwt from "jsonwebtoken";

// Middleware to verify JWT token
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Bearer <token>

    jwt.verify(token, process.env.JWT_SECRET || "supersecretjwtkey_placeholder_123", (err, user) => {
      if (err) {
        // Token is invalid or expired
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
      }
      
      // Store user payload in request object
      req.user = user;
      next();
    });
  } else {
    // No token provided
    res.status(401).json({ message: "Unauthorized: Missing token" });
  }
};

// Middleware to authorize specific roles
export const authorize = (roles = []) => {
  // roles param can be a single role string (e.g. 'admin') or an array of roles (e.g. ['admin', 'user'])
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    // Check if req.user exists and its role is in the allowed roles
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      return res.status(403).json({ message: "Forbidden: Insufficient privileges" });
    }
    next();
  };
};
