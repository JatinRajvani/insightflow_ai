const { MongoClient } = require('mongodb');

let db = null;
let client = null;

async function connectDB() {
  if (db) return db;

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.DB_NAME || 'insightflow';

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);

    // Create indexes to optimize queries and ensure uniqueness
    db.collection('feedbacks').createIndex({ theme: 1, productName: 1, createdAt: -1 }).catch(err => console.error('Index creation error:', err));
    db.collection('products').createIndex({ name: 1 }, { unique: true }).catch(err => console.error('Index creation error:', err));
    
    // Safely drop old global theme index if it exists and create new compound index
    db.collection('theme_memory').dropIndex('theme_1')
      .catch(() => {}) // Ignore error if index does not exist
      .finally(() => {
        db.collection('theme_memory').createIndex({ theme: 1, productName: 1 }, { unique: true })
          .catch(err => console.error('Theme memory compound index creation error:', err));
      });

    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

module.exports = { connectDB, getDB };
