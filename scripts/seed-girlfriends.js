const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection URL - update this to match your database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/newgirl';

async function seedGirlfriends() {
  let client;
  
  try {
    // Read the girlfriend examples
    const girlfriendsPath = path.join(__dirname, '..', 'girlfriend-examples.json');
    const girlfriendsData = JSON.parse(fs.readFileSync(girlfriendsPath, 'utf8'));
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('girlfriends');
    
    // Add timestamps to girlfriend data (no userId needed - girlfriends are general entities)
    const girlfriendsToInsert = girlfriendsData.map(girlfriend => ({
      ...girlfriend,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Clear existing girlfriends (optional - remove this line if you want to keep existing data)
    console.log('Clearing existing girlfriends...');
    await collection.deleteMany({});
    
    // Insert the girlfriend examples
    console.log('Inserting girlfriend examples...');
    const result = await collection.insertMany(girlfriendsToInsert);
    
    console.log(`Successfully inserted ${result.insertedCount} girlfriends:`);
    girlfriendsToInsert.forEach((girlfriend, index) => {
      console.log(`${index + 1}. ${girlfriend.name}`);
      console.log(`   ${girlfriend.presentationText.substring(0, 80)}...`);
      console.log(`   Tags: ${girlfriend.tags.join(', ')}`);
      console.log(`   Gallery: ${girlfriend.gallery.length} images`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error seeding girlfriends:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the seeding script
if (require.main === module) {
  seedGirlfriends()
    .then(() => {
      console.log('Girlfriend seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Girlfriend seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedGirlfriends };
