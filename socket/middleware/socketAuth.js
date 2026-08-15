import jwt from 'jsonwebtoken';
import User from '../../src/model/User.model.js';

// Verify JWT token for Socket.io connections
// Token sent in socket handshake auth
export const verifySocketToken = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required — please login'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user to socket — available in all handlers
    socket.user = {
      id      : user._id.toString(),
      username: user.username,
      avatar  : user.username.charAt(0).toUpperCase(),
    };

    next();

  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
};