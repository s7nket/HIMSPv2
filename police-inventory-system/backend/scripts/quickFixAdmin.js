/**
 * Quick Fix Script v2 - Enhanced Connection Handling
 * Updated for new validation format:
 * - Officer ID: STATERANKYEARSERIAL (e.g., INDGP20250001)
 * - Email: Must start with capital letter (e.g., Admin@police.gov.in)
 * - Password: 8 characters, capital start, alphanumeric (e.g., Admin123)
 * 
 * Usage: node scripts/quickFixAdmin.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Try to load .env from different possible locations
const envPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '..', '.env'),
  path.join(process.cwd(), '.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`📄 Loaded .env from: ${envPath}\n`);
    break;
  }
}

// Connection string options (tried in order)
const connectionOptions = [
  process.env.MONGODB_URI,
  process.env.MONGO_URI,
  process.env.DATABASE_URL,
  'mongodb://127.0.0.1:27017/police-inventory',
  'mongodb://localhost:27017/police-inventory',
];

// Connect to MongoDB with multiple fallback options
const connectDB = async () => {
  console.log('🔌 Attempting to connect to MongoDB...\n');

  for (const uri of connectionOptions) {
    if (!uri) continue;

    try {
      console.log(`   Trying: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
      
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
      });
      
      console.log('   ✅ Connected successfully!\n');
      return uri;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  // If all connection attempts failed
  console.error('\n❌ Could not connect to MongoDB with any method.');
  console.error('\n📋 Troubleshooting steps:');
  console.error('   1. Check if MongoDB is running:');
  console.error('      Windows: services.msc → Look for "MongoDB Server"');
  console.error('      Command: tasklist | findstr mongod');
  console.error('');
  console.error('   2. Start MongoDB:');
  console.error('      Windows: net start MongoDB');
  console.error('');
  console.error('   3. Check your .env file has MONGODB_URI');
  console.error('      Example: MONGODB_URI=mongodb://localhost:27017/police-inventory');
  console.error('');
  console.error('   4. Try MongoDB Atlas (free cloud database):');
  console.error('      https://www.mongodb.com/cloud/atlas/register');
  console.error('');
  
  process.exit(1);
};

const quickFixAdmin = async () => {
  try {
    console.log('🔧 Starting Quick Fix for Admin Users...\n');

    // Get the User collection directly (bypassing schema validation)
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find all admin users
    const admins = await usersCollection.find({ role: 'admin' }).toArray();

    if (admins.length === 0) {
      console.log('❌ No admin users found in database');
      console.log('\n💡 Creating a default admin user...\n');
      
      // Create default admin with NEW validation format
      const User = require('../models/User');
      const defaultAdmin = new User({
        officerId: 'INDGP20250001',               // STATE + RANK + YEAR + SERIAL (no separators)
        fullName: 'System Administrator',
        email: 'Admin@police.gov.in',            // Must start with capital letter
        password: 'Admin123',                     // 8 chars, capital start, alphanumeric
        role: 'admin',
        rank: 'Senior Command (DGP, SP, DCP)',
        designation: 'Director General of Police (DGP)',
        dateOfJoining: new Date(),
        isActive: true
      });

      await defaultAdmin.save();

      console.log('✅ Default admin created successfully!');
      console.log('\n📧 Login Credentials:');
      console.log('━'.repeat(50));
      console.log('Email:    Admin@police.gov.in');
      console.log('Password: Admin123');
      console.log('━'.repeat(50));
      console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');
      return;
    }

    console.log(`Found ${admins.length} admin user(s). Updating...\n`);

    let updatedCount = 0;

    for (const admin of admins) {
      const updates = {};
      let needsUpdate = false;

      console.log(`Processing: ${admin.email || 'No email'}`);

      // Check and set officerId with NEW format
      if (!admin.officerId || !/^[A-Z]{2}[A-Z]{2,4}\d{8,10}$/.test(admin.officerId)) {
        updates.officerId = `INDGP2025${String(updatedCount + 1).padStart(4, '0')}`;
        needsUpdate = true;
        console.log(`  ✓ Setting Officer ID: ${updates.officerId}`);
      }

      // Check and set fullName
      if (!admin.fullName) {
        updates.fullName = admin.email ? admin.email.split('@')[0] : 'Administrator';
        needsUpdate = true;
        console.log(`  ✓ Setting Full Name: ${updates.fullName}`);
      }

      // Check and fix email (must start with capital)
      if (admin.email && !/^[A-Z]/.test(admin.email)) {
        updates.email = admin.email.charAt(0).toUpperCase() + admin.email.slice(1);
        needsUpdate = true;
        console.log(`  ✓ Fixing Email: ${updates.email}`);
      }

      // Check and set rank
      if (!admin.rank) {
        updates.rank = 'Senior Command (DGP, SP, DCP)';
        needsUpdate = true;
        console.log(`  ✓ Setting Rank: ${updates.rank}`);
      }

      // Check and set designation
      if (!admin.designation) {
        updates.designation = 'Director General of Police (DGP)';
        needsUpdate = true;
        console.log(`  ✓ Setting Designation: ${updates.designation}`);
      }

      // Convert dateOfBirth to dateOfJoining
      if (admin.dateOfBirth && !admin.dateOfJoining) {
        updates.dateOfJoining = new Date();
        updates.$unset = { dateOfBirth: '' };
        needsUpdate = true;
        console.log(`  ✓ Converting dateOfBirth to dateOfJoining`);
      } else if (!admin.dateOfJoining) {
        updates.dateOfJoining = new Date();
        needsUpdate = true;
        console.log(`  ✓ Setting Date of Joining: ${new Date().toISOString().split('T')[0]}`);
      }

      // Ensure isActive is set
      if (admin.isActive === undefined) {
        updates.isActive = true;
        needsUpdate = true;
      }

      // Update the document
      if (needsUpdate) {
        const updateOperation = updates.$unset 
          ? { $set: { ...updates, $unset: undefined }, $unset: updates.$unset }
          : { $set: updates };

        await usersCollection.updateOne(
          { _id: admin._id },
          updateOperation
        );
        updatedCount++;
        console.log(`  ✅ Updated successfully\n`);
      } else {
        console.log(`  ℹ️  No updates needed\n`);
      }
    }

    console.log('━'.repeat(50));
    console.log(`✅ Quick fix completed! Updated ${updatedCount} admin user(s)`);
    console.log('━'.repeat(50));

    // Display all admin credentials
    console.log('\n📋 Current Admin Users:\n');
    const updatedAdmins = await usersCollection.find({ role: 'admin' }).toArray();
    
    updatedAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.fullName || 'No Name'}`);
      console.log(`   Email: ${admin.email || 'No email'}`);
      console.log(`   Officer ID: ${admin.officerId || 'Not set'}`);
      console.log(`   Rank: ${admin.rank || 'Not set'}`);
      console.log(`   Designation: ${admin.designation || 'Not set'}`);
      console.log('');
    });

    console.log('\n✅ You can now login with the above admin accounts!');
    console.log('\n⚠️  Note: If password was changed, use your updated password.');
    console.log('   Default password for new admins: Admin123\n');

  } catch (error) {
    console.error('\n❌ Error during quick fix:', error.message);
    
    if (error.stack) {
      console.error('\n📋 Full error details:');
      console.error(error.stack);
    }
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await quickFixAdmin();
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
};

main();