import { getPendingEvents, updateEventStatus, MESLocalEvent } from './local-db';
import { supabase } from '@/integrations/supabase/client';

const SYNC_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 5;

let isSyncing = false;

export async function syncEvents() {
  if (isSyncing) return;
  if (!navigator.onLine) return;

  isSyncing = true;
  console.log('MES: Starting sync process...');

  try {
    const pendingEvents = await getPendingEvents();
    
    // Group by Production Order to preserve sequence (Step 4)
    const grouped = pendingEvents.reduce((acc, event) => {
      const opId = event.production_order_id || 'unassigned';
      if (!acc[opId]) acc[opId] = [];
      acc[opId].push(event);
      return acc;
    }, {} as Record<string, MESLocalEvent[]>);

    for (const opId in grouped) {
      const events = grouped[opId].sort((a: MESLocalEvent, b: MESLocalEvent) => 
        new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
      );

      for (const event of events) {
        // Step 5: Retry with backoff
        if (event.next_retry_at && new Date(event.next_retry_at) > new Date()) {
          console.log(`MES: Skipping event ${event.event_id} - waiting for backoff`);
          // If we skip the first event of an OP, we must skip the rest of the same OP to preserve order
          break; 
        }

        try {
          await updateEventStatus(event.event_id, 'syncing');

          // Call the secure backend endpoint
          const { error } = await supabase.rpc('process_mes_event', {
            p_event_id: event.event_id
          });

          if (error) {
            // Step 7: Handle permanently rejected or business errors
            const isPermanent = error.message.includes('permanent') || event.retry_count >= MAX_RETRIES;
            await updateEventStatus(
              event.event_id, 
              isPermanent ? 'permanently_rejected' : 'failed',
              error.message
            );
            
            // Stop syncing this OP sequence if a sync fails
            break;
          } else {
            await updateEventStatus(event.event_id, 'synchronized');
          }
        } catch (e: any) {
          await updateEventStatus(event.event_id, 'failed', e.message);
          break;
        }
      }
    }
  } catch (error) {
    console.error('MES Sync Error:', error);
  } finally {
    isSyncing = false;
  }
}

// Background sync manager
export function startBackgroundSync() {
  // Listen for online events
  window.addEventListener('online', () => {
    console.log('MES: Network back online, triggering sync');
    syncEvents();
  });

  // Interval-based sync
  const interval = setInterval(syncEvents, SYNC_INTERVAL);
  
  // Initial sync attempt
  syncEvents();

  return () => clearInterval(interval);
}
