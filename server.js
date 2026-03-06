require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');

const app = express();
app.use(express.json());
app.use(cors());

// Set SendGrid API Key securely
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Connect to MongoDB
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
    console.log(`✅ SendGrid Email successfully sent to ${toEmail}`);
  } catch (error) {
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
    res.status(500).json({ message: 'Server error' });
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
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));