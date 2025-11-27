import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Fail fast during startup to avoid accidental use of a weak default secret.
  throw new Error('Missing required environment variable: JWT_SECRET');
}

// Authorization middleware. Pass roles array (e.g., ['ADMIN']) to restrict access.
export const auth = (roles = []) => {
  // Normalize roles to array
  const requiredRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    const token = req.header('x-auth-token') || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null);

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded.user || decoded; // support both shapes

      // Role check (if roles were provided)
      if (requiredRoles.length > 0) {
        const userRole = req.user?.role;
        if (!userRole || !requiredRoles.includes(userRole)) {
          return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
        }
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
  };
};

export default auth;
