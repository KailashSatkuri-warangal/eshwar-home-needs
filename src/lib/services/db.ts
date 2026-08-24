import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';

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

/**
 * Subscribe to a Firestore collection in real-time, falling back to local database polling
 */
export function subscribeDbCollection(
  collectionName: string,
  callback: (data: any[]) => void
): () => void {
  try {
    const q = collection(db, collectionName);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    }, (err) => {
      console.warn(`[Firestore Real-time Failover] "${collectionName}" subscription failed, switching to local DB polling.`, err);
      startPolling();
    });
    
    let isCancelled = false;
    let pollInterval: any = null;

    const startPolling = () => {
      const fetchLocal = async () => {
        if (isCancelled) return;
        try {
          const res = await fetch(`/api/db?collection=${collectionName}`);
          if (res.ok) {
            const data = await res.json();
            callback(data || []);
          }
        } catch (apiErr) {
          console.error(`[Local DB Poll] Failed for "${collectionName}":`, apiErr);
        }
      };
      fetchLocal();
      pollInterval = window.setInterval(fetchLocal, 4000);
    };

    return () => {
      isCancelled = true;
      unsubscribe();
      if (pollInterval) window.clearInterval(pollInterval);
    };
  } catch (err) {
    console.warn(`[Firestore Real-time Error] Subscription setup failed for "${collectionName}". Using polling fallback.`, err);
    
    let isCancelled = false;
    let pollInterval: any = null;

    const fetchLocal = async () => {
      if (isCancelled) return;
      try {
        const res = await fetch(`/api/db?collection=${collectionName}`);
        if (res.ok) {
          const data = await res.json();
          callback(data || []);
        }
      } catch (apiErr) {
        console.error(`[Local DB Poll] Failed for "${collectionName}":`, apiErr);
      }
    };
    fetchLocal();
    pollInterval = window.setInterval(fetchLocal, 4000);

    return () => {
      isCancelled = true;
      if (pollInterval) window.clearInterval(pollInterval);
    };
  }
}

/**
 * Subscribe to a filtered Firestore collection in real-time, falling back to local database polling
 */
export function subscribeDbDocsFiltered(
  collectionName: string,
  fieldName: string,
  fieldValue: string,
  callback: (data: any[]) => void
): () => void {
  try {
    const q = query(collection(db, collectionName), where(fieldName, '==', fieldValue));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    }, (err) => {
      console.warn(`[Firestore Real-time Filtered Failover] "${collectionName}" subscription failed, switching to local DB polling.`, err);
      startPolling();
    });

    let isCancelled = false;
    let pollInterval: any = null;

    const startPolling = () => {
      const fetchLocalFiltered = async () => {
        if (isCancelled) return;
        try {
          const res = await fetch(`/api/db?collection=${collectionName}`);
          if (res.ok) {
            const data = await res.json() as any[];
            const filtered = data.filter(item => item[fieldName] === fieldValue);
            callback(filtered || []);
          }
        } catch (apiErr) {
          console.error(`[Local DB Filtered Poll] Failed for "${collectionName}":`, apiErr);
        }
      };
      fetchLocalFiltered();
      pollInterval = window.setInterval(fetchLocalFiltered, 4000);
    };

    return () => {
      isCancelled = true;
      unsubscribe();
      if (pollInterval) window.clearInterval(pollInterval);
    };
  } catch (err) {
    console.warn(`[Firestore Filtered Real-time Error] Subscription failed for "${collectionName}". Using polling fallback.`, err);
    
    let isCancelled = false;
    let pollInterval: any = null;

    const fetchLocalFiltered = async () => {
      if (isCancelled) return;
      try {
        const res = await fetch(`/api/db?collection=${collectionName}`);
        if (res.ok) {
          const data = await res.json() as any[];
          const filtered = data.filter(item => item[fieldName] === fieldValue);
          callback(filtered || []);
        }
      } catch (apiErr) {}
    };
    fetchLocalFiltered();
    pollInterval = window.setInterval(fetchLocalFiltered, 4000);

    return () => {
      isCancelled = true;
      if (pollInterval) window.clearInterval(pollInterval);
    };
  }
}
