const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Dependency-free env file parser
function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  content.split('\n').forEach(line => {
    // Matches key=value
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove comments if present
      if (value.includes('#')) {
        value = value.split('#')[0].trim();
      }
      // Remove wrapping quotes if present
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.trim();
    }
  });
}

// Load configurations
parseEnv(path.join(__dirname, '../.env.local'));
parseEnv(path.join(__dirname, '../.env'));

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const USERS_TO_CREATE = [
  {
    email: 'retail_customer@eshwarhomeneeds.com',
    pass: 'user123',
    name: 'Retail Customer (B2C)',
    role: 'customer'
  },
  {
    email: 'wholesale_buyer@eshwarhomeneeds.com',
    pass: 'user123',
    name: 'Sri Venkateshwara Traders (B2B)',
    role: 'wholesale',
    wholesaleDetails: {
      companyName: 'Sri Venkateshwara Traders',
      gstin: '36AAFCS1234F1ZA',
      creditLimit: 50000,
      creditUsed: 0
    }
  },
  {
    email: 'scrap_seller@eshwarhomeneeds.com',
    pass: 'user123',
    name: 'Ramu Scrap Seller',
    role: 'customer'
  },
  {
    email: 'staff_member@eshwarhomeneeds.com',
    pass: 'user123',
    name: 'Kalyan (Sales Representative)',
    role: 'staff'
  }
];

async function createUsers() {
  console.log('Starting test user creation in Firebase...');
  
  // Load local JSON DB backup file
  const localDbPath = path.join(__dirname, '../data-local.json');
  let localDb = { users: [] };
  if (fs.existsSync(localDbPath)) {
    try {
      localDb = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
    } catch(err) {}
  }
  if (!localDb.users) localDb.users = [];

  for (const user of USERS_TO_CREATE) {
    try {
      console.log(`Registering Auth account for: ${user.email}`);
      const cred = await createUserWithEmailAndPassword(auth, user.email, user.pass);
      const uid = cred.user.uid;
      
      const newProfile = {
        uid,
        email: user.email,
        displayName: user.name,
        role: user.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(user.wholesaleDetails || {})
      };

      // Write online to Firestore
      try {
        await setDoc(doc(db, 'users', uid), newProfile);
        console.log(`  - Wrote Firestore profile document for: ${user.email}`);
      } catch (dbErr) {
        console.warn(`  - [Firestore Skip] Could not write user profile to database (permissions): ${dbErr.message}`);
      }

      // Write locally to JSON database
      const index = localDb.users.findIndex(u => u.email === user.email);
      if (index > -1) {
        localDb.users[index] = { ...localDb.users[index], ...newProfile };
      } else {
        localDb.users.push(newProfile);
      }
      console.log(`  - Saved local profile backup to data-local.json`);

    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`  - Account already exists for: ${user.email}`);
        
        // If it already exists, let's sync its entry in data-local.json for offline testing
        const index = localDb.users.findIndex(u => u.email === user.email);
        if (index === -1) {
          const dummyUid = `user_mock_${Math.random().toString(36).substring(2, 7)}`;
          localDb.users.push({
            uid: dummyUid,
            email: user.email,
            displayName: user.name,
            role: user.role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...(user.wholesaleDetails || {})
          });
          console.log(`  - Synced existing email to data-local.json with mock UID`);
        }
      } else {
        console.error(`  - Failed for ${user.email}:`, err.message);
      }
    }
  }

  // Save local db updates
  fs.writeFileSync(localDbPath, JSON.stringify(localDb, null, 2), 'utf-8');
  console.log('Test user creation completed successfully!');
}

createUsers();
