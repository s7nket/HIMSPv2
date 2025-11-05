/**
 * EMERGENCY ADMIN CREATOR
 * This bypasses all validation and directly inserts admin into MongoDB
 * Use this if quickFixAdmin.js keeps failing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Load .env
const envPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '..', '.env'),
  path.join(process.cwd(), '.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    break;
  }
}

const connectionOptions = [
  process.env.MONGODB_URI,
  'mongodb://127.0.0.1:27017/police-inventory',
  'mongodb://localhost:27017/police-inventory',
];

const connectDB = async () => {
  console.log('🔌 Connecting to MongoDB...\n');

  for (const uri of connectionOptions) {
    if (!uri) continue;

    try {
      console.log(`   Trying: ${uri}`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('   ✅ Connected!\n');
      return;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  console.error('\n❌ MongoDB not running!');
  console.error('Start MongoDB: net start MongoDB\n');
  process.exit(1);
};

const createEmergencyAdmin = async () => {
  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Delete existing admin with this email
    await usersCollection.deleteMany({ email: 'Admin@police.gov.in' });
    console.log('🗑️  Cleared old admin accounts\n');

    // Hash password BEFORE inserting
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin123', salt);

    // Create admin document directly
    const adminDoc = {
      officerId: 'INDGP20250001',
      fullName: 'System Administrator',
      email: 'Admin@police.gov.in',
      password: hashedPassword,  // PRE-HASHED password
      role: 'admin',
      rank: 'Senior Command (DGP, SP, DCP)',
      designation: 'Director General of Police (DGP)',
      dateOfJoining: new Date('2025-01-01'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert directly into MongoDB (bypasses Mongoose validation)
    const result = await usersCollection.insertOne(adminDoc);

    console.log('✅ EMERGENCY ADMIN CREATED!\n');
    console.log('━'.repeat(60));
    console.log('📧 LOGIN CREDENTIALS:');
    console.log('━'.repeat(60));
    console.log('Email:    Admin@police.gov.in');
    console.log('Password: Admin123');
    console.log('━'.repeat(60));
    console.log('\n✅ Password is already hashed and ready to use!');
    console.log('✅ Try logging in now!\n');

    return result;

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await createEmergencyAdmin();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Done!\n');
    process.exit(0);
  }
};

main();