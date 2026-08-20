import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Check if credentials are set and are not placeholder dummies
const isConfigured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                     !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('your_') &&
                     process.env.NEXT_PUBLIC_FIREBASE_API_KEY.length > 10;

const firebaseConfig = {
  apiKey: isConfigured 
    ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY 
    : 'AIzaSyMockApiKeyForNextJsPrerenderingBuilds',
  authDomain: isConfigured 
    ? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN 
    : 'mock-eshwar-home-needs.firebaseapp.com',
  projectId: isConfigured 
    ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID 
    : 'mock-eshwar-home-needs',
  storageBucket: isConfigured 
    ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET 
    : 'mock-eshwar-home-needs.appspot.com',
  messagingSenderId: isConfigured 
    ? process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID 
    : '1234567890',
  appId: isConfigured 
    ? process.env.NEXT_PUBLIC_FIREBASE_APP_ID 
    : '1:672525700558:web:abcd',
};

// Diagnostic log in the browser console to trace connection issues
if (typeof window !== 'undefined') {
  console.log('[Firebase Init] Project ID:', firebaseConfig.projectId, '| Keys configured:', !!isConfigured);
}

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
