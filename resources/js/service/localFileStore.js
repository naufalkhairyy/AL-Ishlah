const DB_NAME = "project_pa_file_preview_store";
const STORE_NAME = "files";
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runStore(mode, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function saveLocalFile(key, file) {
  if (!key || !file) return;
  await runStore("readwrite", (store) => store.put({
    key,
    blob: file,
    name: file.name,
    type: file.type,
    size: file.size,
    savedAt: new Date().toISOString(),
  }));
}

export async function getLocalFileUrl(key) {
  if (!key) return "";
  const record = await runStore("readonly", (store) => store.get(key));
  return record?.blob ? URL.createObjectURL(record.blob) : "";
}
