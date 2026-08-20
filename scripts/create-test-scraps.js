const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Dependency-free env file parser
function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.includes('#')) {
        value = value.split('#')[0].trim();
      }
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.trim();
    }
  });
}

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
const db = getFirestore(app);

const TEST_SCRAPS = [
  {
    id: 'scrp_test_brass',
    userId: 'IvhopGxnCcPRwOtWuB0t1njzCw72', // Ramu Scrap Seller
    customerDetails: {
      name: 'Ramu Scrap Seller',
      phone: '9900011223',
      email: 'scrap_seller@eshwarhomeneeds.com',
      address: {
        name: 'Ramu Scrap Seller',
        street: 'Flat 302, Green Glen Layout',
        city: 'Hanumakonda',
        state: 'Telangana',
        pincode: '506001',
        phone: '9900011223'
      }
    },
    material: 'brass',
    estimatedWeight: 12,
    condition: 'good',
    status: 'REQUESTED',
    preferredDate: '2026-08-22',
    preferredTime: '10:00 - 13:00',
    notes: 'Old brass plates and puja items.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'scrp_test_copper',
    userId: 'IvhopGxnCcPRwOtWuB0t1njzCw72', // Ramu Scrap Seller
    customerDetails: {
      name: 'Ramu Scrap Seller',
      phone: '9900011223',
      email: 'scrap_seller@eshwarhomeneeds.com',
      address: {
        name: 'Ramu Scrap Seller',
        street: 'Flat 302, Green Glen Layout',
        city: 'Hanumakonda',
        state: 'Telangana',
        pincode: '506001',
        phone: '9900011223'
      }
    },
    material: 'copper',
    estimatedWeight: 8,
    condition: 'clean',
    status: 'SCHEDULED',
    preferredDate: '2026-08-23',
    preferredTime: '14:00 - 17:00',
    notes: 'Stripped electrical cables from renovation.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'scrp_test_aluminium',
    userId: 'cMJGh9CG2vWfYl9Q6h2u486tHL43', // Retail Customer
    customerDetails: {
      name: 'Retail Customer (B2C)',
      phone: '9888877777',
      email: 'retail_customer@eshwarhomeneeds.com',
      address: {
        name: 'Retail Customer (B2C)',
        street: 'HNO 4-2-192, Subedari',
        city: 'Hanumakonda',
        state: 'Telangana',
        pincode: '506001',
        phone: '9888877777'
      }
    },
    material: 'aluminium',
    estimatedWeight: 15,
    condition: 'damaged',
    status: 'REQUESTED',
    preferredDate: '2026-08-24',
    preferredTime: '10:00 - 13:00',
    notes: 'Old aluminium pressure cookers and partition frames.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

async function createScraps() {
  console.log('Populating test scrap requests...');
  
  const localDbPath = path.join(__dirname, '../data-local.json');
  let localDb = { scrapRequests: [] };
  if (fs.existsSync(localDbPath)) {
    try {
      localDb = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
    } catch(err) {}
  }
  if (!localDb.scrapRequests) localDb.scrapRequests = [];

  for (const scrap of TEST_SCRAPS) {
    try {
      console.log(`Writing test scrap booking: ${scrap.id} (${scrap.material})`);
      
      // Attempt online write to Firestore
      try {
        await setDoc(doc(db, 'scrapRequests', scrap.id), scrap);
        console.log(`  - Saved online to Firestore`);
      } catch (dbErr) {
        console.warn(`  - [Firestore Skip] Could not write online (rules/permissions): ${dbErr.message}`);
      }

      // Write locally to JSON
      const index = localDb.scrapRequests.findIndex(s => s.id === scrap.id);
      if (index > -1) {
        localDb.scrapRequests[index] = { ...localDb.scrapRequests[index], ...scrap };
      } else {
        localDb.scrapRequests.push(scrap);
      }
      console.log(`  - Saved local backup to data-local.json`);

    } catch (err) {
      console.error(`  - Failed for ${scrap.id}:`, err.message);
    }
  }

  fs.writeFileSync(localDbPath, JSON.stringify(localDb, null, 2), 'utf-8');
  console.log('Test scrap requests successfully created!');
}

createScraps();
