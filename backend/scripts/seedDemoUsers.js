require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const FishermenProfile = require('../src/models/FishermenProfile');
const FisheriesOfficer = require('../src/models/FisheriesOfficer');
const { mongoUri } = require('../src/config/env');

const demoUsers = [
  {
    name: 'KadalThunai Admin',
    email: 'admin@kadalthunai.gov.in',
    password: 'Admin@1234',
    phone: '9999999999',
    role: 'admin',
  },
  {
    name: 'Demo Fisheries Officer',
    email: 'officer@kadalthunai.gov.in',
    password: 'Officer@1234',
    phone: '9888888888',
    role: 'officer',
  },
  {
    name: 'Demo Fisherman',
    email: 'fisherman@kadalthunai.gov.in',
    password: 'Fisherman@1234',
    phone: '9777777777',
    role: 'fisherman',
  },
];

const seed = async () => {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB...');

  for (const details of demoUsers) {
    let user = await User.findOne({ email: details.email }).select('+passwordHash');
    if (!user) {
      user = new User({
        name: details.name,
        email: details.email,
        passwordHash: details.password,
        phone: details.phone,
        role: details.role,
        isActive: true,
        isVerified: true,
      });
    } else {
      user.name = details.name;
      user.passwordHash = details.password;
      user.phone = details.phone;
      user.role = details.role;
      user.isActive = true;
      user.isVerified = true;
    }
    await user.save();

    if (details.role === 'fisherman') {
      await FishermenProfile.updateOne(
        { userId: user._id },
        { $setOnInsert: { userId: user._id } },
        { upsert: true }
      );
    }
    if (details.role === 'officer') {
      await FisheriesOfficer.updateOne(
        { userId: user._id },
        { $setOnInsert: { userId: user._id, designation: 'Fisheries Inspector', district: 'Thoothukudi' } },
        { upsert: true }
      );
    }

    console.log(`Ready: ${details.role} (${details.email})`);
  }

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error('Demo seed error:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
