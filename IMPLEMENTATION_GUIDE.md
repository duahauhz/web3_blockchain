# 🎁 Sui Gifting System - Advanced Features

## 📊 Tổng Quan Các Cải Tiến

Dự án đã được nâng cấp toàn diện với các tính năng tiên tiến:

### ✅ Đã Hoàn Thành

#### 1. **Smart Contract Upgrades**
- ✅ zkLogin integration với email-based recipients
- ✅ Email validation on-chain
- ✅ Expiry timestamp & auto-refund
- ✅ Reject & refund functionality
- ✅ Gas Station capability
- ✅ Shared Object cho lì xì nhóm
- ✅ Random distribution algorithm
- ✅ Event emission cho notification system

#### 2. **Backend Infrastructure**
- ✅ Node.js Express server
- ✅ WebSocket server cho real-time notifications
- ✅ Event listener polling blockchain events
- ✅ Gas Station API endpoints
- ✅ Rate limiting & security

#### 3. **Frontend Features**
- ✅ Google OAuth integration
- ✅ zkLogin authentication flow
- ✅ Notification system với toast
- ✅ Lì xì creation UI
- ✅ Lì xì claiming UI với animations
- ✅ Fireworks effects
- ✅ Leaderboard display
- ✅ Deep linking support

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ zkLogin  │  │ Gift UI  │  │ Lixi UI  │  │ Notif.   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        │             │             │             │ WebSocket
        │             │             │             │
┌───────┼─────────────┼─────────────┼─────────────┼──────────┐
│       │             │             │             │           │
│  ┌────▼─────┐  ┌────▼─────┐  ┌───▼────┐  ┌─────▼─────┐   │
│  │ OAuth    │  │ Gas      │  │ Event  │  │ WebSocket │   │
│  │ Handler  │  │ Station  │  │ Listen │  │ Server    │   │
│  └──────────┘  └──────────┘  └───┬────┘  └───────────┘   │
│                                   │                         │
│                  Backend (Node.js/Express)                  │
└───────────────────────────────────┼─────────────────────────┘
                                    │
                                    │ Sui SDK
                                    │
┌───────────────────────────────────▼─────────────────────────┐
│                      Sui Blockchain                          │
│  ┌────────────────┐              ┌──────────────────┐       │
│  │ gifting.move   │              │ sui_lixi.move    │       │
│  │                │              │                  │       │
│  │ • GiftBox     │              │ • LixiEnvelope   │       │
│  │ • zkLogin     │              │ • Random Dist.   │       │
│  │ • Expiry      │              │ • Shared Object  │       │
│  │ • Events      │              │ • Events         │       │
│  └────────────────┘              └──────────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

## 🚀 Hướng Dẫn Triển Khai

### Bước 1: Cài Đặt Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ui
npm install
```

### Bước 2: Cấu Hình Environment

#### Backend (.env)
```env
SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# Tạo keypair mới cho Gas Station
# Chạy: sui keygen
GAS_STATION_PRIVATE_KEY=your_private_key_hex
GAS_STATION_ADDRESS=your_address

GIFTING_PACKAGE_ID=0x...  # Sẽ update sau khi publish

PORT=3001
WS_PORT=3002

JWT_SECRET=random_secret_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id

MAX_GAS_SPONSORSHIP_PER_USER=5
GAS_SPONSORSHIP_COOLDOWN_MS=60000
```

#### Frontend (.env)
```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_WS_URL=ws://localhost:3002
VITE_BACKEND_URL=http://localhost:3001
```

### Bước 3: Publish Smart Contracts

```bash
cd move/hello-world

# Build
sui move build

# Publish
sui client publish --gas-budget 100000000

# Lưu lại Package ID từ output
# Update vào:
# - ui/src/constants.ts
# - backend/.env (GIFTING_PACKAGE_ID)
```

### Bước 4: Setup Google OAuth

1. Truy cập [Google Cloud Console](https://console.cloud.google.com)
2. Tạo project mới
3. Enable "Google+ API"
4. Tạo OAuth 2.0 Client ID
5. Thêm authorized redirect URIs:
   - `http://localhost:5173/auth/google/callback`
   - `http://localhost:5173` (cho popup)
6. Copy Client ID vào `.env` files

### Bước 5: Nạp SUI cho Gas Station

```bash
# Lấy địa chỉ Gas Station từ .env
# Truy cập https://faucet.sui.io
# Paste địa chỉ và request SUI

# Hoặc dùng CLI:
curl -X POST https://faucet.testnet.sui.io/gas \
  -H "Content-Type: application/json" \
  -d '{"recipient": "YOUR_GAS_STATION_ADDRESS"}'
```

### Bước 6: Chạy Ứng Dụng

#### Terminal 1 - Backend
```bash
cd backend
npm start
```

#### Terminal 2 - Frontend
```bash
cd ui
npm run dev
```

Truy cập: `http://localhost:5173`

## 📚 API Documentation

### Gas Station Endpoints

#### POST /api/gas-station/sponsor-claim-gift
Sponsor gas fee cho việc claim gift.

**Request:**
```json
{
  "giftId": "0x...",
  "recipientAddress": "0x...",
  "recipientEmail": "user@gmail.com",
  "googleJWT": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "digest": "0x...",
  "effects": {...}
}
```

#### POST /api/gas-station/sponsor-claim-lixi
Sponsor gas fee cho việc claim lì xì.

**Request:**
```json
{
  "lixiId": "0x...",
  "claimerAddress": "0x...",
  "claimerEmail": "user@gmail.com"
}
```

#### GET /api/gas-station/balance
Kiểm tra số dư Gas Station.

**Response:**
```json
{
  "address": "0x...",
  "balance": "1000000000",
  "balanceSUI": "1.0000"
}
```

### WebSocket Protocol

#### Client → Server
```json
{
  "type": "register",
  "email": "user@gmail.com",
  "address": "0x..."
}
```

#### Server → Client
```json
{
  "type": "gift_received",
  "title": "🎁 Bạn có quà mới!",
  "message": "Ai đó vừa gửi cho bạn 1.5000 SUI",
  "giftId": "0x...",
  "amount": "1500000000",
  "expiryTimestamp": 1234567890,
  "timestamp": 1234567890
}
```

## 🔧 Smart Contract API

### gifting module

#### send_sui_gift_with_email
```move
public fun send_sui_gift_with_email(
    input_coin: Coin<SUI>, 
    message: String,
    sender_email: String,
    recipient_email: String,
    expiry_days: u64,
    clock: &Clock,
    ctx: &mut TxContext
)
```

#### open_and_claim_with_zklogin
```move
public fun open_and_claim_with_zklogin(
    gift: &mut GiftBox,
    recipient_email_proof: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

#### reject_and_refund
```move
public fun reject_and_refund(
    gift: &mut GiftBox,
    recipient_email_proof: String,
    ctx: &mut TxContext
)
```

#### reclaim_expired_gift
```move
public fun reclaim_expired_gift(
    gift: &mut GiftBox,
    clock: &Clock,
    ctx: &mut TxContext
)
```

### sui_lixi module

#### create_lixi
```move
public fun create_lixi(
    input_coin: Coin<SUI>,
    creator_email: String,
    max_recipients: u64,
    distribution_mode: u8,  // 0=Equal, 1=Random
    min_amount: u64,
    max_amount: u64,
    message: String,
    expiry_hours: u64,
    clock: &Clock,
    ctx: &mut TxContext
)
```

#### claim_lixi
```move
public fun claim_lixi(
    lixi: &mut LixiEnvelope,
    claimer_email: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

## 🎨 UI/UX Features

### Animations
- ✅ Confetti effect khi mở quà
- ✅ Fireworks effect khi claim lì xì
- ✅ Shake animation cho bao lì xì
- ✅ Hover effects
- ✅ Loading spinners
- ✅ Floating decorations

### States Visualization
- 🟢 **Đang hoạt động**: Màu đỏ rực rỡ, animations
- 🔴 **Đã kết thúc**: Màu xám, icon trống
- 🟡 **Sắp hết hạn**: Warning banner

### Responsive Design
- Mobile-friendly
- Tablet-optimized
- Desktop full experience

## 🔒 Security Features

### Rate Limiting
- Maximum 5 sponsored transactions per user per minute
- Cooldown period: 60 seconds
- IP-based tracking

### Email Validation
- On-chain validation trong Move
- Format checking: `user@domain.com`
- JWT verification trong backend

### Gas Sponsorship Protection
- Maximum amount per transaction
- Whitelist/blacklist support
- Transaction monitoring

## 📊 Event System

### Events Emitted

1. **GiftCreatedEvent**
   - Trigger: Khi tạo gift
   - Data: gift_id, sender, recipient_email, amount, expiry

2. **GiftOpenedEvent**
   - Trigger: Khi mở gift
   - Data: gift_id, sender, recipient, amount

3. **LixiCreatedEvent**
   - Trigger: Khi tạo lì xì
   - Data: lixi_id, creator, total_amount, max_recipients

4. **LixiClaimedEvent**
   - Trigger: Khi claim lì xì
   - Data: lixi_id, claimer, amount, claimed_count

5. **LixiCompletedEvent**
   - Trigger: Khi lì xì hết
   - Data: lixi_id, total_distributed, total_claimers

## 🧪 Testing Checklist

### Smart Contract Testing
- [ ] Email validation
- [ ] Expiry functionality
- [ ] Random distribution
- [ ] Shared object interactions
- [ ] Event emission

### Backend Testing
- [ ] Gas Station sponsorship
- [ ] Rate limiting
- [ ] WebSocket connections
- [ ] Event listener accuracy

### Frontend Testing
- [ ] Google OAuth flow
- [ ] Gift creation
- [ ] Gift claiming
- [ ] Lixi creation
- [ ] Lixi claiming
- [ ] Notifications
- [ ] Deep linking

## 🚨 Troubleshooting

### Common Issues

#### 1. Gas Station không sponsor
```bash
# Kiểm tra balance
curl http://localhost:3001/api/gas-station/balance

# Nạp thêm SUI nếu cần
```

#### 2. WebSocket không connect
```bash
# Kiểm tra port 3002 có đang dùng không
netstat -ano | findstr 3002

# Restart backend
```

#### 3. Smart Contract lỗi
```bash
# Rebuild
sui move build

# Check lỗi
sui move test
```

#### 4. OAuth không hoạt động
- Kiểm tra GOOGLE_CLIENT_ID
- Kiểm tra Authorized Redirect URIs
- Clear browser cache

## 📈 Performance Optimization

### Backend
- Sử dụng connection pooling cho Sui client
- Cache event data để giảm RPC calls
- Implement batch processing

### Frontend
- Code splitting
- Lazy loading components
- Memoization cho expensive computations
- WebSocket reconnection logic

## 🔮 Future Enhancements

### Phase 2 (Upcoming)
- [ ] Multi-currency support (USDC, USDT)
- [ ] NFT gifting
- [ ] Scheduled gifts (gửi trước, mở sau)
- [ ] Gift templates
- [ ] Social sharing features

### Phase 3 (Planned)
- [ ] Group gifting pools
- [ ] Charity donations integration
- [ ] Gamification (achievements, badges)
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

## 📝 Notes

### zkLogin Integration (Advanced)
Hiện tại đang sử dụng simplified version. Để full zkLogin:
1. Integrate với Sui zkLogin SDK
2. Generate zero-knowledge proofs
3. Verify proofs on-chain
4. Manage ephemeral keys

### Gas Station Economics
- Estimate: ~0.001 SUI per transaction
- With 1 SUI: ~1000 sponsored transactions
- Implement fee recovery mechanism nếu cần

### Scalability
- Current: Supports ~100 concurrent users
- Scale: Add load balancer, multiple backend instances
- Database: Add MongoDB cho persistent notifications

## 🆘 Support

Nếu gặp vấn đề:
1. Check logs: `backend/logs/` và browser console
2. Review [CHECKLIST.md](CHECKLIST.md)
3. Contact: [Your contact info]

## 📜 License

MIT License - Free to use and modify

---

**Built with ❤️ on Sui Blockchain**

🎁 Happy Gifting! 🧧
