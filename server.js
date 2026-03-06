require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');

const app = express();

// UPDATED: CORS configuration to allow your live frontend to communicate with this backend
app.use(cors()); 
app.use(express.json());

// Set SendGrid API Key from Environment Variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Connect to MongoDB Atlas (Cloud)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Basic User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// Helper: Send Email via SendGrid
const sendEmail = async (toEmail, subject, text) => {
  const msg = {
    to: toEmail,
    from: process.env.SENDGRID_SENDER_EMAIL, 
    subject: subject,
    text: text,
  };
  try {
    await sgMail.send(msg);
    console.log(`📧 SendGrid Email successfully sent to ${toEmail}`);
  } catch (error) {
    // UPDATED: Enhanced error logging for debugging production email issues
    console.error('❌ SendGrid Error:', error.response ? JSON.stringify(error.response.body) : error.message);
  }
};

// Signup Route
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ email, password });
    await newUser.save();

    // Send Welcome Email
    sendEmail(email, 'Welcome to Our App!', 'Thank you for signing up. We are thrilled to have you!');

    res.status(201).json({ message: 'Account created successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Send Login Alert Email
    sendEmail(email, 'New Login Detected', `A new login was detected on your account at ${new Date().toLocaleString()}.`);

    res.status(200).json({ message: 'Login successful!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

// UPDATED: Use process.env.PORT for Render deployment and bind to 0.0.0.0
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});      