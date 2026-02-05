import { SuiClient } from '@mysten/sui/client';
import dotenv from 'dotenv';

dotenv.config();

const suiClient = new SuiClient({
  url: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443'
});

const GIFTING_PACKAGE_ID = process.env.GIFTING_PACKAGE_ID;
const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds

let lastProcessedCheckpoint = null;
let broadcastCallback = null;

/**
 * Start listening to blockchain events
 */
export async function startEventListener(broadcast) {
  broadcastCallback = broadcast;
  
  console.log('🎧 Starting event listener...');
  console.log(`📦 Monitoring package: ${GIFTING_PACKAGE_ID}`);
  
  // Get latest checkpoint
  try {
    const latestCheckpoint = await suiClient.getLatestCheckpointSequenceNumber();
    lastProcessedCheckpoint = latestCheckpoint;
    console.log(`📍 Starting from checkpoint: ${latestCheckpoint}`);
  } catch (error) {
    console.error('Failed to get latest checkpoint:', error);
  }
  
  // Start polling
  pollEvents();
}

/**
 * Poll for new events
 */
async function pollEvents() {
  try {
    // Query events for gift creation
    const giftCreatedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${GIFTING_PACKAGE_ID}::gifting::GiftCreatedEvent`
      },
      limit: 10,
      order: 'descending',
    });

    // Query events for lixi creation
    const lixiCreatedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${GIFTING_PACKAGE_ID}::sui_lixi::LixiCreatedEvent`
      },
      limit: 10,
      order: 'descending',
    });

    // Query events for lixi claimed
    const lixiClaimedEvents = await suiClient.queryEvents({
      query: {
        MoveEventType: `${GIFTING_PACKAGE_ID}::sui_lixi::LixiClaimedEvent`
      },
      limit: 10,
      order: 'descending',
    });

    // Process gift created events
    for (const event of giftCreatedEvents.data) {
      const eventData = event.parsedJson;
      
      console.log('🎁 New Gift Created!');
      console.log(`   Gift ID: ${eventData.gift_id}`);
      console.log(`   Recipient: ${eventData.recipient_email}`);
      console.log(`   Amount: ${(parseInt(eventData.amount) / 1_000_000_000).toFixed(4)} SUI`);

      // Send notification via WebSocket
      if (broadcastCallback) {
        broadcastCallback(eventData.recipient_email, {
          type: 'gift_received',
          title: '🎁 Bạn có quà mới!',
          message: `Ai đó vừa gửi cho bạn ${(parseInt(eventData.amount) / 1_000_000_000).toFixed(4)} SUI`,
          giftId: eventData.gift_id,
          amount: eventData.amount,
          expiryTimestamp: eventData.expiry_timestamp,
          timestamp: Date.now(),
        });
      }
    }

    // Process lixi created events
    for (const event of lixiCreatedEvents.data) {
      const eventData = event.parsedJson;
      
      console.log('🧧 New Lixi Created!');
      console.log(`   Lixi ID: ${eventData.lixi_id}`);
      console.log(`   Total: ${(parseInt(eventData.total_amount) / 1_000_000_000).toFixed(4)} SUI`);
      console.log(`   Recipients: ${eventData.max_recipients}`);
    }

    // Process lixi claimed events
    for (const event of lixiClaimedEvents.data) {
      const eventData = event.parsedJson;
      
      console.log('💰 Lixi Claimed!');
      console.log(`   Claimer: ${eventData.claimer_email}`);
      console.log(`   Amount: ${(parseInt(eventData.amount) / 1_000_000_000).toFixed(4)} SUI`);
      console.log(`   Progress: ${eventData.claimed_count} claims`);
    }

  } catch (error) {
    console.error('Event polling error:', error.message);
  }

  // Schedule next poll
  setTimeout(pollEvents, POLL_INTERVAL_MS);
}

/**
 * Subscribe to real-time events (WebSocket-based)
 * Note: Sui's WebSocket support varies by network
 */
export async function subscribeToEvents() {
  try {
    const unsubscribe = await suiClient.subscribeEvent({
      filter: {
        MoveEventType: `${GIFTING_PACKAGE_ID}::gifting::GiftCreatedEvent`
      },
      onMessage: (event) => {
        console.log('📨 Real-time event received:', event);
        
        const eventData = event.parsedJson;
        
        if (broadcastCallback) {
          broadcastCallback(eventData.recipient_email, {
            type: 'gift_received',
            title: '🎁 Bạn có quà mới!',
            message: `Ai đó vừa gửi cho bạn ${(parseInt(eventData.amount) / 1_000_000_000).toFixed(4)} SUI`,
            giftId: eventData.gift_id,
            amount: eventData.amount,
            timestamp: Date.now(),
          });
        }
      },
    });

    console.log('✅ Subscribed to real-time events');
    
    return unsubscribe;
  } catch (error) {
    console.log('⚠️  Real-time subscription not available, using polling instead');
    console.error('Subscription error:', error.message);
    return null;
  }
}
