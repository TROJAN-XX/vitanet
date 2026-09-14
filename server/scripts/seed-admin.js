import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import env from '../src/config/env.js';
import User from '../src/models/User.js';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@vitanet.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'VitaNetAdmin2026!';

async function seedAdmin() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
  });

  const usernameNormalized = ADMIN_USERNAME.trim().toLowerCase();
  const emailNormalized = ADMIN_EMAIL.trim().toLowerCase();

  try {
    let user = await User.findOne({
      $or: [{ usernameNormalized }, { emailNormalized }],
    }).select('+passwordHash');

    if (user) {
      console.log(`User already exists for @${user.username} (${user.email}). Promoting to admin...`);
      user.role = 'admin';
      user.accountStatus = 'active';
      user.isEmailVerified = true;
      await user.save();
      console.log(`Successfully elevated @${user.username} to administrator.`);
    } else {
      console.log(`Creating initial administrator @${ADMIN_USERNAME}...`);
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

      user = await User.create({
        username: ADMIN_USERNAME,
        usernameNormalized,
        email: ADMIN_EMAIL,
        emailNormalized,
        passwordHash,
        displayName: 'VitaNet Administrator',
        bio: 'Official platform administrator and system overseer.',
        accountStatus: 'active',
        role: 'admin',
        isEmailVerified: true,
      });

      console.log(`Successfully created administrator account @${user.username} (Email: ${user.email})`);
    }
  } catch (err) {
    console.error('Failed to seed administrator:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

seedAdmin();
