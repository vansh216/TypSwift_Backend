import jwt from "jsonwebtoken"
import User from "../model/User.model.js";

async function OptionalProtect  (req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next(); // guest — continue without blocking
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');

    req.user = user || null;
    next();
  } catch (error) {
    // Token invalid or expired — treat as guest
    req.user = null;
    next();
  }
};

 export default OptionalProtect