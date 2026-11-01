const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param } = require('express-validator');
const authController = require('../controllers/auth.controller');
const asyncHandler = require('../utils/async-handler');
const { requireAuth } = require('../middlewares/auth.middleware');
const { verifyCsrf } = require('../middlewares/csrf.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Bạn đã thử quá nhiều lần, vui lòng thử lại sau.'
});

const loginValidation = [
  body('username').trim().isLength({ min: 1, max: 50 }).withMessage('Vui lòng nhập tên đăng nhập'),
  body('password').isLength({ min: 1 }).withMessage('Vui lòng nhập mật khẩu')
];

const forgotValidation = [
  body('email').trim().isEmail().withMessage('Email không hợp lệ').normalizeEmail()
];

const resetValidation = [
  param('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Liên kết không hợp lệ'),
  body('password').isLength({ min: 8, max: 72 }).withMessage('Mật khẩu phải có ít nhất 8 ký tự'),
  body('passwordConfirmation').custom((value, { req }) => value === req.body.password)
    .withMessage('Mật khẩu xác nhận không khớp')
];

router.get('/login', asyncHandler(authController.showLogin));
router.post('/login', authLimiter, verifyCsrf, loginValidation, validateRequest, asyncHandler(authController.login));
router.post('/logout', requireAuth, verifyCsrf, asyncHandler(authController.logout));
router.get('/forgot-password', asyncHandler(authController.showForgotPassword));
router.post('/forgot-password', authLimiter, verifyCsrf, forgotValidation, validateRequest, asyncHandler(authController.forgotPassword));
router.get('/reset-password/:token', resetValidation.slice(0, 1), validateRequest, asyncHandler(authController.showResetPassword));
router.post('/reset-password/:token', verifyCsrf, resetValidation, validateRequest, asyncHandler(authController.resetPassword));

module.exports = router;
