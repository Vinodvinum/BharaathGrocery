const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const OTP_EXP_MINUTES = Number(process.env.OTP_EXPIRE_MINUTES || 10);

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRE
});

const safeUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isBlocked: user.isBlocked,
  isEmailVerified: user.isEmailVerified,
  avatar: user.avatar
});

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const hashValue = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
};

const sendOtpEmail = async ({ to, purpose, otp }) => {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@bharatbasket.com';

  const subject = purpose === 'signup'
    ? 'Bharat Basket - Verify your email'
    : 'Bharat Basket - Password reset OTP';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
      <h2>Bharat Basket</h2>
      <p>Your OTP is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${otp}</p>
      <p>This OTP is valid for ${OTP_EXP_MINUTES} minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  if (!transporter) {
    return { delivered: false };
  }

  await transporter.sendMail({ from, to, subject, html });
  return { delivered: true };
};

const sendOtpResponse = (res, { message, otp, delivered }) => {
  const response = {
    success: true,
    message: delivered ? message : `${message} (email not configured; using dev OTP)`
  };

  if (!delivered || process.env.NODE_ENV !== 'production') {
    response.devOtp = otp;
  }

  return res.json(response);
};

exports.register = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const phone = String(req.body.phone || '').trim();

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    if (phone && !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number' });
    }

    const existing = await User.findOne({ email }).select('+password');
    if (existing && existing.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const otp = createOtp();
    const otpHash = hashValue(otp);
    const otpExpire = Date.now() + (OTP_EXP_MINUTES * 60 * 1000);

    let user = existing;
    if (!user) {
      user = await User.create({
        name,
        email,
        password,
        phone,
        isEmailVerified: false,
        emailVerificationOtp: otpHash,
        emailVerificationOtpExpire: otpExpire
      });
    } else {
      user.name = name;
      user.phone = phone;
      user.password = password;
      user.isEmailVerified = false;
      user.emailVerificationOtp = otpHash;
      user.emailVerificationOtpExpire = otpExpire;
      await user.save();
    }

    const { delivered } = await sendOtpEmail({ to: email, purpose: 'signup', otp });
    return sendOtpResponse(res, {
      message: 'Verification OTP sent to your email',
      otp,
      delivered
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.verifyEmailOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      const token = generateToken(user._id);
      return res.json({
        success: true,
        message: 'Email already verified',
        token,
        user: safeUserPayload(user)
      });
    }

    const otpHash = hashValue(otp);
    if (!user.emailVerificationOtp || user.emailVerificationOtp !== otpHash || !user.emailVerificationOtpExpire || user.emailVerificationOtpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isEmailVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpire = undefined;
    await user.save();

    const token = generateToken(user._id);
    return res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: safeUserPayload(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.resendEmailOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    const otp = createOtp();
    user.emailVerificationOtp = hashValue(otp);
    user.emailVerificationOtpExpire = Date.now() + (OTP_EXP_MINUTES * 60 * 1000);
    await user.save();

    const { delivered } = await sendOtpEmail({ to: email, purpose: 'signup', otp });
    return sendOtpResponse(res, {
      message: 'Verification OTP resent successfully',
      otp,
      delivered
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email with OTP before login'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account is blocked. Contact support.'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUserPayload(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    return res.json({
      success: true,
      user: {
        ...safeUserPayload(user),
        addresses: user.addresses
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: safeUserPayload(user)
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const address = {
      ...req.body,
      fullName: String(req.body.fullName || '').trim(),
      phone: String(req.body.phone || '').trim(),
      addressLine1: String(req.body.addressLine1 || '').trim(),
      addressLine2: String(req.body.addressLine2 || '').trim(),
      city: String(req.body.city || '').trim(),
      state: String(req.body.state || '').trim(),
      pincode: String(req.body.pincode || '').trim()
    };

    if (!/^[0-9]{10}$/.test(address.phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number' });
    }

    if (!/^[0-9]{6}$/.test(address.pincode)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 6-digit pincode' });
    }

    const user = await User.findById(req.user.id);

    if (address.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push(address);
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      addresses: user.addresses
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: true,
        message: 'If your email is registered, OTP has been generated.'
      });
    }

    const otp = createOtp();
    user.forgotPasswordOtp = hashValue(otp);
    user.forgotPasswordOtpExpire = Date.now() + (OTP_EXP_MINUTES * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const { delivered } = await sendOtpEmail({ to: email, purpose: 'forgot', otp });
    return sendOtpResponse(res, {
      message: 'Password reset OTP sent to your email',
      otp,
      delivered
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPasswordWithOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();
    const password = String(req.body.password || '');

    if (!email || !otp || !password) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or OTP' });
    }

    const otpHash = hashValue(otp);
    if (!user.forgotPasswordOtp || user.forgotPasswordOtp !== otpHash || !user.forgotPasswordOtpExpire || user.forgotPasswordOtpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.password = password;
    user.forgotPasswordOtp = undefined;
    user.forgotPasswordOtpExpire = undefined;
    await user.save();

    const authToken = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Password reset successful',
      token: authToken,
      user: safeUserPayload(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
