const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Admin schema (simplified for seeding)
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'chat_admin', 'support_admin'], 
    default: 'chat_admin' 
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  isOnline: { type: Boolean, default: false },
  activeChatSessions: { type: Number, default: 0 },
  maxConcurrentChats: { type: Number, default: 5 },
  specialties: { type: [String], default: [] },
  stats: {
    totalChatsHandled: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    customerSatisfactionRating: { type: Number, default: 0 },
    totalHoursWorked: { type: Number, default: 0 }
  }
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

// Admin accounts to create
const adminAccounts = [
  {
    email: 'admin@newgirl.com',
    password: 'admin123!',
    name: 'Super Admin',
    role: 'super_admin',
    specialties: ['management', 'support', 'technical']
  },
  {
    email: 'chat1@newgirl.com',
    password: 'chat123!',
    name: 'Emma Chat Admin',
    role: 'chat_admin',
    specialties: ['music', 'travel', 'lifestyle']
  },
  {
    email: 'chat2@newgirl.com',
    password: 'chat123!',
    name: 'Sophia Chat Admin',
    role: 'chat_admin',
    specialties: ['art', 'books', 'nature']
  },
  {
    email: 'support@newgirl.com',
    password: 'support123!',
    name: 'Support Admin',
    role: 'support_admin',
    specialties: ['customer_service', 'billing', 'technical_support']
  }
];

async function seedAdmins() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/newgirl';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing admins (optional - comment out if you want to keep existing)
    await Admin.deleteMany({});
    console.log('🗑️ Cleared existing admin accounts');

    // Create admin accounts
    for (const adminData of adminAccounts) {
      try {
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

        // Create admin
        const admin = new Admin({
          ...adminData,
          password: hashedPassword
        });

        await admin.save();
        console.log(`✅ Created admin: ${adminData.name} (${adminData.email})`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️ Admin already exists: ${adminData.email}`);
        } else {
          console.error(`❌ Error creating admin ${adminData.email}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Admin seeding completed!');
    console.log('\n📋 Admin Login Credentials:');
    console.log('================================');
    adminAccounts.forEach(admin => {
      console.log(`👤 ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${admin.password}`);
      console.log(`   Role: ${admin.role}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error seeding admins:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeding
seedAdmins();
