const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { extractFeaturesFromUrl } = require('../utils/featureExtractor');
const History = require('../models/History');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('name email');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }
    // Check if email is taken by another user
    const existing = await User.findOne({ email, _id: { $ne: req.user.userId } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email },
      { new: true, runValidators: true, select: 'name email' }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.checkUrl = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: 'No URL provided.' });
    }
    // Extract features in Node.js
    const features = await extractFeaturesFromUrl(url);
    // Check if features is an array of all 1s (whitelisted domain)
    const isWhitelisted = Array.isArray(features) && features.length === 30 && features.every(f => f === 1);
    if (isWhitelisted) {
      // Store in history as Legitimate
      if (req.user && req.user.userId) {
        await History.create({
          user: req.user.userId,
          url,
          result: 'Legitimate',
          features
        });
      }
      return res.status(200).json({ label: 'Legitimate', confidence: 1 });
    }
    // Call the Flask ML API with features
    const flaskRes = await axios.post('http://localhost:5000/predict', { features });
    const result = flaskRes.data.result || flaskRes.data.label || 'Unknown';
    // Store in history
    if (req.user && req.user.userId) {
      await History.create({
        user: req.user.userId,
        url,
        result,
        features
      });
    }
    res.status(200).json(flaskRes.data);
  } catch (err) {
    res.status(500).json({ message: 'Error checking URL.', error: err.message });
  }
};

// Fetch user history
exports.getHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const history = await History.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching history.', error: err.message });
  }
}; 