import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'digitale_mes_db';
const DB_VERSION = 1;

export interface MESLocalEvent {
  event_id: string;
  event_type: string;
  payload: any;
  occurred_at: string;
  synced: number; // 0 or 1
}

export async function initMESDatabase() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db: IDBPDatabase) {
      if (!db.objectStoreNames.contains('events')) {
        const store = db.createObjectStore('events', { keyPath: 'event_id' });
        store.createIndex('synced', 'synced');
      }
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config');
      }
    },
  });
}

export async function saveLocalEvent(event: MESLocalEvent) {
  const db = await initMESDatabase();
  return db.put('events', event);
}

export async function getUnsyncedEvents() {
  const db = await initMESDatabase();
  return db.getAllFromIndex('events', 'synced', 0);
}

export async function markEventSynced(eventId: string) {
  const db = await initMESDatabase();
  const event = await db.get('events', eventId);
  if (event) {
    event.synced = 1;
    await db.put('events', event);
  }
}
