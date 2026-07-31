const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const config = require('../config/config');

const seedAdmin = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB.');

    // Check if admin already exists
    const adminExists = await Admin.findOne({ username: 'admin' });

    if (adminExists) {
      console.log("Admin account with username 'admin' already exists. Skipping seed.");
      process.exit(0);
    }

    const defaultAdmin = new Admin({
      username: 'admin',
      password: 'adminPassword123', // Will be hashed automatically by Schema
      name: 'System Administrator'
    });

    await defaultAdmin.save();

    console.log('----------------------------------------');
    console.log('Admin account seeded successfully!');
    console.log('Username: admin');
    console.log('Password: adminPassword123');
    console.log('Please change the password in production.');
    console.log('----------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
