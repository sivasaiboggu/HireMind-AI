import { updateHiring, type Candidate, type HiringAction } from './hiring';

const STORE = 'workspaces';

function openHiringDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('hiremind-hiring', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onerror = () => reject(new Error('This browser could not open the hiring register.'));
    request.onsuccess = () => resolve(request.result);
  });
}

export async function hiringTransaction(workspace: string, action?: HiringAction) {
  const database = await openHiringDatabase();
  try {
    return await new Promise<{ candidates: Candidate[]; message: string }>((resolve, reject) => {
      const transaction = database.transaction(STORE, action ? 'readwrite' : 'readonly');
      const register = transaction.objectStore(STORE);
      const read = register.get(workspace);
      let result: { candidates: Candidate[]; message: string };
      let validationError: unknown;

      read.onsuccess = () => {
        const candidates: Candidate[] = read.result ?? [];
        if (!action) {
          result = { candidates, message: '' };
          return;
        }
        try {
          result = updateHiring(candidates, action, crypto.randomUUID(), Date.now());
          register.put(result.candidates, workspace);
        } catch (error) {
          validationError = error;
          transaction.abort();
        }
      };
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = () => reject(validationError ?? new Error('The hiring register could not be saved in this browser.'));
    });
  } finally {
    database.close();
  }
}
