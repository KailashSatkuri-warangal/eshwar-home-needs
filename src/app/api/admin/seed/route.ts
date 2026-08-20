import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { 
  MOCK_CATEGORIES, 
  MOCK_PRODUCTS, 
  MOCK_SCRAP_RATES, 
  MOCK_REVIEWS 
} from '@/lib/mockData';

export async function GET(request: Request) {
  try {
    console.log('Starting database seeding...');
    
    // 1. Seed Categories
    for (const cat of MOCK_CATEGORIES) {
      await adminDb.collection('categories').doc(cat.id).set(cat);
      console.log(`Seeded category: ${cat.name}`);
    }

    // 2. Seed Products
    for (const prod of MOCK_PRODUCTS) {
      await adminDb.collection('products').doc(prod.id).set({
        ...prod,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Seeded product: ${prod.name}`);
    }

    // 3. Seed Scrap Rates
    for (const rate of MOCK_SCRAP_RATES) {
      await adminDb.collection('scrapRates').doc(rate.id).set({
        ...rate,
        updatedAt: new Date(),
      });
      console.log(`Seeded scrap rate: ${rate.material}`);
    }

    // 4. Seed Reviews
    for (const rev of MOCK_REVIEWS) {
      await adminDb.collection('reviews').doc(rev.id).set({
        ...rev,
        createdAt: new Date(),
      });
      console.log(`Seeded review from: ${rev.userName}`);
    }

    // 5. Seed Default Admin User Profile
    const adminUid = 'admin_demo_account';
    await adminDb.collection('users').doc(adminUid).set({
      uid: adminUid,
      email: 'admin@eshwarhomeneeds.com',
      role: 'admin',
      displayName: 'ESHwar Administrator',
      phone: '+91 98765 43210',
      createdAt: new Date(),
      updatedAt: new Date(),
      creditTerms: 'Unlimited credit config',
    });
    console.log('Seeded default administrator profile.');

    return NextResponse.json({
      success: true,
      message: 'Firestore Database successfully seeded with ESHwar Home Needs starter data.',
    });
  } catch (error) {
    console.error('Error during Firestore database seed:', error);
    return NextResponse.json(
      { error: `Database seeding failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
