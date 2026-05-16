import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../model/User.model.js';


const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};


async function  HandleUserRegister (req, res)  {
  console.log(req.body)
  try {
    const { username, email, password } = req.body;

    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email and password are required',
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email
          ? 'Email already in use'
          : 'Username already taken',
      });
    }

  
    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

  
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

  
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id      : user._id,
        username: user.username,
        email   : user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


async function HandleUserLogin  (req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id      : user._id,
        username: user.username,
        email   : user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function HandleUserGetme  (req, res) {
  try {
    res.status(200).json({
      success: true,
      user: {
        id      : req.user._id,
        username: req.user.username,
        email   : req.user.email,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  HandleUserRegister,
  HandleUserLogin,
  HandleUserGetme
}