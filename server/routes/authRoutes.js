const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/profile', authMiddleware, authController.getProfile);
router.patch('/profile', authMiddleware, authController.updateProfile);
router.delete('/profile', authMiddleware, authController.deleteAccount);
router.post('/check-url', authMiddleware, authController.checkUrl);
router.get('/history', authMiddleware, authController.getHistory);
router.delete('/history/:id', authMiddleware, authController.deleteHistory);

module.exports = router; 