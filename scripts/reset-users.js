const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Manually parse env files to load service account credentials
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

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

let app;

const hasRealCreds = privateKey && 
                     clientEmail && 
                     projectId && 
                     privateKey.includes('-----BEGIN PRIVATE KEY-----') && 
                     !privateKey.includes('your_private_key_here');

if (hasRealCreds) {
  try {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      })
    });
    console.log('✅ Firebase Admin initialized with service account private key.');
  } catch (e) {
    console.warn('⚠️ Service account cert initialization failed, trying default...', e);
  }
}

if (!app) {
  console.error('\n❌ ERROR: Firebase Admin SDK requires a valid Private Key certificate to clean and reset users.');
  console.error('Please configure your ".env.local" file with your actual "FIREBASE_PRIVATE_KEY" (containing BEGIN PRIVATE KEY)');
  console.error('and "FIREBASE_CLIENT_EMAIL" downloaded from the Firebase Console (Project Settings -> Service Accounts).\n');
  process.exit(1);
}

const auth = getAuth(app);
const db = getFirestore(app);

async function resetUsers() {
  console.log('\n====================================================');
  console.log('      ESHwar Database Cleanse & Re-indexing         ');
  console.log('====================================================\n');

  try {
    // 1. Delete all users from Firebase Auth
    console.log('⏳ Fetching existing Auth accounts...');
    const listUsersResult = await auth.listUsers(1000);
    const authUsers = listUsersResult.users;
    
    console.log(`Found ${authUsers.length} user accounts in Firebase Auth.`);
    for (const u of authUsers) {
      console.log(`Deleting Auth user: ${u.email} (${u.uid})...`);
      await auth.deleteUser(u.uid);
    }
    console.log('✅ All Auth accounts deleted successfully.');

    // 2. Delete all records from Firestore 'users' collection
    console.log('\n⏳ Fetching Firestore "users" collection documents...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} user documents in Firestore.`);
    
    const batch = db.batch();
    usersSnapshot.forEach(doc => {
      console.log(`Queueing deletion of Firestore document: users/${doc.id}...`);
      batch.delete(doc.ref);
    });
    
    if (usersSnapshot.size > 0) {
      await batch.commit();
      console.log('✅ All user documents deleted from Firestore.');
    } else {
      console.log('No user documents to delete.');
    }

    // 3. Create satkurikailash@gmail.com in Firebase Auth
    console.log('\n⏳ Provisioning admin user: satkurikailash@gmail.com...');
    const newAuthUser = await auth.createUser({
      email: 'satkurikailash@gmail.com',
      emailVerified: true,
      phoneNumber: '+918309740722',
      password: 'admin123', // Initial master password
      displayName: 'Satkuri Kailash',
      disabled: false,
    });
    console.log(`✅ Auth user created successfully with UID: ${newAuthUser.uid}`);

    // 4. Save satkurikailash@gmail.com with 'admin' role in Firestore
    const adminProfile = {
      uid: newAuthUser.uid,
      email: 'satkurikailash@gmail.com',
      phone: '8309740722',
      displayName: 'Satkuri Kailash',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.collection('users').doc(newAuthUser.uid).set(adminProfile);
    console.log(`✅ Firestore admin profile saved under users/${newAuthUser.uid}`);

    console.log('\n====================================================');
    console.log('🎉 Cleanse completed successfully! Login using:');
    console.log('   Email:    satkurikailash@gmail.com');
    console.log('   Password: admin123');
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Cleanse process failed:');
    console.error(error);
  }
}

resetUsers();
