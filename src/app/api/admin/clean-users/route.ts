import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Verify access passcode to prevent unauthorized triggers
  if (secret !== 'eshwar_reset_2026') {
    return NextResponse.json(
      { error: 'Unauthorized secret key verification failed.' },
      { status: 401 }
    );
  }

  try {
    console.log('Initiating production database cleanse...');

    // 1. Fetch existing users from Firebase Authentication
    const listUsersResult = await adminAuth.listUsers(1000);
    const authUsers = listUsersResult.users;
    
    let deletedAuthCount = 0;
    let isKailashCreated = false;
    let kailashUid = '';

    for (const u of authUsers) {
      if (u.email === 'satkurikailash@gmail.com') {
        isKailashCreated = true;
        kailashUid = u.uid;
        
        // Ensure kailash has the correct phone number
        if (u.phoneNumber !== '+918309740722') {
          await adminAuth.updateUser(u.uid, {
            phoneNumber: '+918309740722'
          });
        }
      } else {
        await adminAuth.deleteUser(u.uid);
        deletedAuthCount++;
      }
    }

    let tempPassCreated = '';

    // 2. If Kailash is not present in Auth, register him
    if (!isKailashCreated) {
      tempPassCreated = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
      const newAuthUser = await adminAuth.createUser({
        email: 'satkurikailash@gmail.com',
        emailVerified: true,
        phoneNumber: '+918309740722',
        password: tempPassCreated,
        displayName: 'Satkuri Kailash',
        disabled: false,
      });
      kailashUid = newAuthUser.uid;
      console.log(`Registered satkurikailash@gmail.com in Auth under UID: ${kailashUid}`);
    }

    // 3. Query Firestore 'users' collection and delete all profiles except Kailash
    const usersSnapshot = await adminDb.collection('users').get();
    let deletedFirestoreCount = 0;

    for (const doc of usersSnapshot.docs) {
      const uData = doc.data();
      if (uData.email === 'satkurikailash@gmail.com' || doc.id === kailashUid) {
        // Skip deletion for master administrator
      } else {
        await doc.ref.delete();
        deletedFirestoreCount++;
      }
    }

    // 4. Overwrite/Insert Kailash's profile in Firestore with phoneVerified: true and role: admin
    const adminProfile = {
      uid: kailashUid,
      email: 'satkurikailash@gmail.com',
      phone: '8309740722',
      displayName: 'Satkuri Kailash',
      role: 'admin',
      phoneVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection('users').doc(kailashUid).set(adminProfile);
    console.log(`Configured satkurikailash@gmail.com as primary administrator in Firestore users/${kailashUid}`);

    return NextResponse.json({
      success: true,
      message: 'ESHwar User Cleanse completed successfully.',
      details: {
        deletedAuthAccounts: deletedAuthCount,
        deletedFirestoreProfiles: deletedFirestoreCount,
        primaryAdminEmail: 'satkurikailash@gmail.com',
        primaryAdminUid: kailashUid,
        ...(tempPassCreated ? { temporaryPassword: tempPassCreated } : {}),
      }
    });

  } catch (error) {
    console.error('Error during Firestore database reset:', error);
    return NextResponse.json(
      { error: `Database reset execution failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
