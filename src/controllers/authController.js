const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Checks password strength and returns a list of problems (empty list = strong enough)
function getPasswordIssues(password) {
  const issues = [];
  if (!password || password.length < 8) issues.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) issues.push('one uppercase letter');
  if (!/[a-z]/.test(password)) issues.push('one lowercase letter');
  if (!/[0-9]/.test(password)) issues.push('one number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) issues.push('one special character (e.g. ! @ # $ %)');
  return issues;
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are all required.' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const passwordIssues = getPasswordIssues(password);
    if (passwordIssues.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Password must include ${passwordIssues.join(', ')}.`,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please sign in instead, or use a different email.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    const token = generateToken(newUser._id, newUser.role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email address.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();

    if (password) {
      const issues = getPasswordIssues(password);
      if (issues.length > 0) {
        return res.status(400).json({ success: false, message: `Password must include ${issues.join(', ')}.` });
      }
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });

    res.status(200).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Returns a simple list of staff accounts, for assigning vets/keepers to animals
exports.getStaffList = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('name role').sort({ name: 1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};