import express from 'express';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromHEX } from '@mysten/sui/utils';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Sui Client
const suiClient = new SuiClient({
  url: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443'
});

// Load Gas Station keypair from env
let gasStationKeypair;
try {
  if (process.env.GAS_STATION_PRIVATE_KEY) {
    const privateKeyBytes = fromHEX(process.env.GAS_STATION_PRIVATE_KEY);
    gasStationKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    console.log('✅ Gas Station keypair loaded');
    console.log('📍 Gas Station Address:', gasStationKeypair.getPublicKey().toSuiAddress());
  }
} catch (error) {
  console.error('❌ Failed to load Gas Station keypair:', error.message);
  console.log('⚠️  Gas Station will not be available');
}

// Rate limiting map: address -> { count, lastReset }
const rateLimitMap = new Map();
const MAX_REQUESTS_PER_USER = parseInt(process.env.MAX_GAS_SPONSORSHIP_PER_USER) || 5;
const COOLDOWN_MS = parseInt(process.env.GAS_SPONSORSHIP_COOLDOWN_MS) || 60000;

// Check rate limit
function checkRateLimit(address) {
  const now = Date.now();
  const record = rateLimitMap.get(address);
  
  if (!record) {
    rateLimitMap.set(address, { count: 1, lastReset: now });
    return true;
  }
  
  // Reset if cooldown passed
  if (now - record.lastReset > COOLDOWN_MS) {
    rateLimitMap.set(address, { count: 1, lastReset: now });
    return true;
  }
  
  // Check limit
  if (record.count >= MAX_REQUESTS_PER_USER) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * POST /api/gas-station/sponsor-claim-gift
 * 
 * Body:
 * {
 *   "giftId": "0x...",
 *   "recipientAddress": "0x...",
 *   "recipientEmail": "user@gmail.com",
 *   "googleJWT": "eyJhbGc..."
 * }
 */
router.post('/sponsor-claim-gift', async (req, res) => {
  try {
    if (!gasStationKeypair) {
      return res.status(503).json({
        error: 'Gas Station not configured'
      });
    }

    const { giftId, recipientAddress, recipientEmail, googleJWT } = req.body;

    // Validate inputs
    if (!giftId || !recipientAddress || !recipientEmail) {
      return res.status(400).json({
        error: 'Missing required fields: giftId, recipientAddress, recipientEmail'
      });
    }

    // Verify Google JWT (basic validation)
    // In production, verify with Google's public keys
    if (googleJWT) {
      try {
        const decoded = jwt.decode(googleJWT);
        if (decoded?.email?.toLowerCase() !== recipientEmail.toLowerCase()) {
          return res.status(403).json({
            error: 'Email mismatch in JWT'
          });
        }
      } catch (error) {
        return res.status(401).json({
          error: 'Invalid JWT token'
        });
      }
    }

    // Check rate limit
    if (!checkRateLimit(recipientAddress)) {
      return res.status(429).json({
        error: `Rate limit exceeded. Maximum ${MAX_REQUESTS_PER_USER} requests per ${COOLDOWN_MS / 1000} seconds`
      });
    }

    // Get clock object
    const clockId = '0x6';

    // Build transaction
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${process.env.GIFTING_PACKAGE_ID}::gifting::open_and_claim_with_zklogin`,
      arguments: [
        tx.object(giftId),
        tx.pure.string(recipientEmail),
        tx.object(clockId),
      ],
    });

    // Set Gas Station as sponsor (pay gas)
    tx.setSender(recipientAddress);
    tx.setGasOwner(gasStationKeypair.getPublicKey().toSuiAddress());

    // Sign and execute
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: gasStationKeypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log(`✅ Sponsored gift claim for ${recipientEmail}: ${result.digest}`);

    res.json({
      success: true,
      digest: result.digest,
      effects: result.effects,
    });

  } catch (error) {
    console.error('Gas Station error:', error);
    res.status(500).json({
      error: error.message || 'Failed to sponsor transaction'
    });
  }
});

/**
 * POST /api/gas-station/sponsor-claim-lixi
 */
router.post('/sponsor-claim-lixi', async (req, res) => {
  try {
    if (!gasStationKeypair) {
      return res.status(503).json({
        error: 'Gas Station not configured'
      });
    }

    const { lixiId, claimerAddress, claimerEmail } = req.body;

    if (!lixiId || !claimerAddress || !claimerEmail) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Check rate limit
    if (!checkRateLimit(claimerAddress)) {
      return res.status(429).json({
        error: `Rate limit exceeded`
      });
    }

    const clockId = '0x6';

    const tx = new Transaction();
    
    tx.moveCall({
      target: `${process.env.GIFTING_PACKAGE_ID}::sui_lixi::claim_lixi`,
      arguments: [
        tx.object(lixiId),
        tx.pure.string(claimerEmail),
        tx.object(clockId),
      ],
    });

    tx.setSender(claimerAddress);
    tx.setGasOwner(gasStationKeypair.getPublicKey().toSuiAddress());

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: gasStationKeypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log(`✅ Sponsored lixi claim for ${claimerEmail}: ${result.digest}`);

    res.json({
      success: true,
      digest: result.digest,
      effects: result.effects,
    });

  } catch (error) {
    console.error('Gas Station error:', error);
    res.status(500).json({
      error: error.message || 'Failed to sponsor transaction'
    });
  }
});

/**
 * GET /api/gas-station/balance
 * Check Gas Station balance
 */
router.get('/balance', async (req, res) => {
  try {
    if (!gasStationKeypair) {
      return res.status(503).json({
        error: 'Gas Station not configured'
      });
    }

    const address = gasStationKeypair.getPublicKey().toSuiAddress();
    const balance = await suiClient.getBalance({ owner: address });

    res.json({
      address,
      balance: balance.totalBalance,
      balanceSUI: (parseInt(balance.totalBalance) / 1_000_000_000).toFixed(4),
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

export { router as gasStationRouter };
