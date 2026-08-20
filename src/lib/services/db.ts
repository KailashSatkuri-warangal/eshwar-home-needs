import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';

/**
 * Fetch list of documents from Firestore, falling back to local JSON API if Firestore throws permission/network errors
 */
export async function getDbDocs(collectionName: string): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    if (!querySnapshot.empty) {
      return querySnapshot.docs.map(doc => doc.data());
    }
  } catch (err) {
    console.warn(`[Firestore Read Fallback] Failed for "${collectionName}". Reading from local JSON backup database.`, err);
  }

  // Fallback to local server API
  try {
    const res = await fetch(`/api/db?collection=${collectionName}`);
    if (res.ok) {
      const data = await res.json();
      return data || [];
    }
  } catch (apiErr) {
    console.error(`[Local DB] Failed to fetch collection "${collectionName}":`, apiErr);
  }

  return [];
}

/**
 * Fetch filtered list of documents (e.g. where userId == currentUid), avoiding collection scan permissions blocks
 */
export async function getDbDocsFiltered(collectionName: string, fieldName: string, fieldValue: string): Promise<any[]> {
  try {
    const q = query(collection(db, collectionName), where(fieldName, '==', fieldValue));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs.map(doc => doc.data());
    }
  } catch (err) {
    console.warn(`[Firestore Filtered Read Fallback] Failed for "${collectionName}" where ${fieldName} == ${fieldValue}. Reading from local JSON backup database.`, err);
  }

  // Fallback to local server API
  try {
    const res = await fetch(`/api/db?collection=${collectionName}`);
    if (res.ok) {
      const data = await res.json() as any[];
      return data.filter(item => item[fieldName] === fieldValue) || [];
    }
  } catch (apiErr) {
    console.error(`[Local DB] Failed to fetch filtered collection "${collectionName}":`, apiErr);
  }

  return [];
}

/**
 * Write a document to Firestore, falling back to local JSON API if Firestore throws permission/network errors
 */
export async function setDbDoc(collectionName: string, docId: string, data: any): Promise<boolean> {
  try {
    // Clean data of any potential undefined values to satisfy Firestore
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(doc(db, collectionName, docId), cleanData);
    return true;
  } catch (err) {
    console.warn(`[Firestore Write Fallback] Failed for "${collectionName}/${docId}". Writing to local JSON backup database.`, err);
  }

  // Fallback to local server API
  try {
    const res = await fetch(`/api/db?collection=${collectionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: docId, data })
    });
    return res.ok;
  } catch (apiErr) {
    console.error(`[Local DB] Failed to write document "${collectionName}/${docId}":`, apiErr);
    return false;
  }
}

/**
 * Delete a document from Firestore, falling back to local JSON API if Firestore throws permission/network errors
 */
export async function deleteDbDoc(collectionName: string, docId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return true;
  } catch (err) {
    console.warn(`[Firestore Delete Fallback] Failed for "${collectionName}/${docId}". Deleting from local JSON backup database.`, err);
  }

  // Fallback to local server API
  try {
    const res = await fetch(`/api/db?collection=${collectionName}&id=${docId}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (apiErr) {
    console.error(`[Local DB] Failed to delete document "${collectionName}/${docId}":`, apiErr);
    return false;
  }
}
