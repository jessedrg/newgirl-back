const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import the PaymentPlan schema
const { PaymentPlan, PaymentPlanSchema } = require('../dist/schemas/payment-plan.schema');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/newgirl';

async function seedPaymentPlans() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create the model
    const PaymentPlanModel = mongoose.model('PaymentPlan', PaymentPlanSchema);

    // Read the example data
    const exampleData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../payment-plans-examples.json'), 'utf8')
    );

    // Clear existing payment plans (optional)
    await PaymentPlanModel.deleteMany({});
    console.log('🗑️  Cleared existing payment plans');

    // Insert new payment plans
    const insertedPlans = await PaymentPlanModel.insertMany(exampleData);
    console.log(`✅ Successfully inserted ${insertedPlans.length} payment plans:`);
    
    insertedPlans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name} - $${(plan.pricing.amount / 100).toFixed(2)} (${plan.pricing.type})`);
    });

    console.log('\n🎉 Payment plans seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding payment plans:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeder
seedPaymentPlans();
