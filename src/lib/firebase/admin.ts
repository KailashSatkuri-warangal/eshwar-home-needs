import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

let app: any;

if (!getApps().length) {
  // Only attempt certificate initialization if credentials look real and are not dummy placeholders
  const hasRealCreds = privateKey && 
                       clientEmail && 
                       projectId && 
                       privateKey.includes('-----BEGIN PRIVATE KEY-----') && 
                       !privateKey.includes('your_private_key_here') &&
                       !privateKey.includes('your_firebase_api_key_here');

  if (hasRealCreds) {
    try {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('Firebase Admin initialized with service account certificate.');
    } catch (e) {
      console.warn('Firebase Admin cert initialization failed. Trying default fallback...', e);
    }
  }

  // Fallback to local default / mock project if certificate parse failed or credentials not present
  if (!app) {
    try {
      app = initializeApp({
        projectId: projectId || 'mock-eshwar-home-needs',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mock-eshwar-home-needs.appspot.com',
      });
      console.log('Firebase Admin initialized with fallback credentials.');
    } catch (e) {
      console.warn('Firebase Admin fallback failed to initialize.', e);
    }
  }
} else {
  app = getApp();
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);
export default app;
