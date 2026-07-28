import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'digitale_mes_v2';
const DB_VERSION = 2;

export type SyncStatus = 'pending' | 'syncing' | 'synchronized' | 'failed' | 'permanently_rejected';

export interface MESLocalEvent {
  event_id: string;
  event_type: string;
  agent_id: string;
  machine_id?: string;
  production_order_id?: string;
  operator_id?: string;
  occurred_at: string;
  created_at_device: string;
  payload: any;
  sync_status: SyncStatus;
  retry_count: number;
  last_error?: string;
  next_retry_at?: string;
}

export async function initMESDatabase() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Stores requested in Step 1
      if (!db.objectStoreNames.contains('agent_config')) db.createObjectStore('agent_config');
      if (!db.objectStoreNames.contains('operator_session')) db.createObjectStore('operator_session');
      if (!db.objectStoreNames.contains('cached_machines')) db.createObjectStore('cached_machines', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('cached_production_orders')) db.createObjectStore('cached_production_orders', { keyPath: 'id' });
      
      if (!db.objectStoreNames.contains('events')) {
        const store = db.createObjectStore('events', { keyPath: 'event_id' });
        store.createIndex('sync_status', 'sync_status');
        store.createIndex('occurred_at', 'occurred_at');
        store.createIndex('op_order', ['production_order_id', 'occurred_at']);
      }
      
      if (!db.objectStoreNames.contains('sync_logs')) {
        db.createObjectStore('sync_logs', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function saveLocalEvent(event: Omit<MESLocalEvent, 'sync_status' | 'retry_count' | 'created_at_device'>) {
  const db = await initMESDatabase();
  const fullEvent: MESLocalEvent = {
    ...event,
    sync_status: 'pending',
    retry_count: 0,
    created_at_device: new Date().toISOString(),
  };
  return db.put('events', fullEvent);
}

export async function getPendingEvents() {
  const db = await initMESDatabase();
  const tx = db.transaction('events', 'readonly');
  const index = tx.store.index('sync_status');
  return index.getAll('pending');
}

export async function updateEventStatus(eventId: string, status: SyncStatus, error?: string) {
  const db = await initMESDatabase();
  const event = await db.get('events', eventId);
  if (event) {
    event.sync_status = status;
    if (error) {
      event.last_error = error;
      event.retry_count += 1;
      // Exponential backoff: 10s, 30s, 120s...
      const backoff = [10, 30, 120, 600][Math.min(event.retry_count - 1, 3)];
      const nextDate = new Date();
      nextDate.setSeconds(nextDate.getSeconds() + backoff);
      event.next_retry_at = nextDate.toISOString();
    }
    await db.put('events', event);
  }
}

export async function setCache(storeName: 'cached_machines' | 'cached_production_orders', data: any[]) {
  const db = await initMESDatabase();
  const tx = db.transaction(storeName, 'readwrite');
  await tx.store.clear();
  for (const item of data) {
    await tx.store.put({ ...item, cached_at: new Date().toISOString() });
  }
  await tx.done;
}

