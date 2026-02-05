# 🎯 ROADMAP CÀI ĐẶT NHANH

## ⚡ Triển Khai trong 30 phút

### 📋 Checklist Thực Hiện

#### Phần 1: Smart Contracts (10 phút)
```bash
# 1. Build contracts
cd e:\WEB3_PTIT\sui-stack-hello-world\move\hello-world
sui move build

# 2. Kiểm tra lỗi (nếu có)
# Lỗi thường gặp: missing imports, syntax errors
# Fix và build lại

# 3. Publish lên Testnet
sui client publish --gas-budget 100000000

# 4. QUAN TRỌNG: Copy Package ID
# Tìm dòng: Published Objects:
# PackageID: 0xABC123...
# LƯU LẠI ID NÀY!
```

**✅ Kết quả mong đợi:** Package ID như `0x4e1cf62ae7d377c7404ac2a617598754a548a5de6a599f236a53603d5674d8b8`

#### Phần 2: Backend Setup (10 phút)
```bash
# 1. Install dependencies
cd e:\WEB3_PTIT\sui-stack-hello-world\backend
npm install

# 2. Tạo file .env
copy .env.example .env

# 3. Cấu hình .env
# Mở .env và điền:
```

**.env Configuration:**
```env
# Network
SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# Gas Station (Tạo ví mới cho Gas Station)
# Chạy: sui keygen
# Copy private key (dạng 0x...)
GAS_STATION_PRIVATE_KEY=0x_YOUR_PRIVATE_KEY_HERE_
GAS_STATION_ADDRESS=0x_YOUR_ADDRESS_HERE_

# Package từ bước 1
GIFTING_PACKAGE_ID=0x_PACKAGE_ID_FROM_STEP_1_

# Server
PORT=3001
WS_PORT=3002

# JWT (random string bất kỳ)
JWT_SECRET=my_super_secret_key_123

# Google OAuth (Tạm thời để trống, config sau)
GOOGLE_CLIENT_ID=

# Rate Limiting
MAX_GAS_SPONSORSHIP_PER_USER=5
GAS_SPONSORSHIP_COOLDOWN_MS=60000
```

```bash
# 4. Nạp SUI cho Gas Station
# Truy cập: https://faucet.sui.io
# Paste GAS_STATION_ADDRESS và request

# 5. Test backend
npm start

# Kết quả mong đợi:
# ✅ Gas Station keypair loaded
# 🚀 Backend server running on http://localhost:3001
# 🔌 WebSocket server running on ws://localhost:3002
# 🎧 Event listener started
```

#### Phần 3: Frontend Setup (10 phút)
```bash
# 1. Install dependencies
cd e:\WEB3_PTIT\sui-stack-hello-world\ui
npm install

# 2. Update Package ID
# Mở: ui/src/constants.ts
# Thay đổi TESTNET_HELLO_WORLD_PACKAGE_ID thành Package ID từ Phần 1

# 3. Tạo .env
```

**.env Configuration:**
```env
VITE_GOOGLE_CLIENT_ID=
VITE_WS_URL=ws://localhost:3002
VITE_BACKEND_URL=http://localhost:3001
```

```bash
# 4. Chạy frontend
npm run dev

# Kết quả:
# ➜  Local:   http://localhost:5173/
```

### 🎯 Test Ngay!

#### Test 1: Gift Cơ Bản (Không cần zkLogin)
1. Mở http://localhost:5173
2. Connect Sui Wallet
3. Click "Tạo Quà"
4. Nhập:
   - Địa chỉ người nhận: (copy từ ví khác)
   - Số lượng: 0.1
   - Lời nhắn: "Test gift"
5. Click "Gửi Quà"
6. Copy Gift ID từ thông báo thành công
7. Mở ví người nhận, truy cập "Nhận Quà"
8. Paste Gift ID → Click "Mở Quà"

**✅ Success:** Tiền đã chuyển + confetti effect

#### Test 2: Lì Xì Nhóm
1. Click "Tạo Lì Xì"
2. Nhập:
   - Tổng tiền: 1.0 SUI
   - Số người: 5
   - Chế độ: May mắn
   - Min: 0.1, Max: 0.5
   - Lời chúc: "Happy New Year!"
   - Hết hạn: 24 giờ
3. Click "Tạo Bao Lì Xì"
4. Copy Lixi ID
5. Share link với bạn bè (hoặc test với ví khác)
6. Mở link → Click "MỞ BÁO LÌ XÌ"

**✅ Success:** Random amount + fireworks

### 🔧 Troubleshooting Nhanh

#### Lỗi: "No valid gas coins"
```bash
# Lấy SUI từ faucet
curl -X POST https://faucet.testnet.sui.io/gas \
  -H "Content-Type: application/json" \
  -d "{\"recipient\": \"YOUR_ADDRESS\"}"
```

#### Lỗi: "Cannot find module"
```bash
# Backend
cd backend
rm -rf node_modules
npm install

# Frontend
cd ui
rm -rf node_modules
npm install
```

#### Lỗi: Port đã được dùng
```powershell
# Windows PowerShell
# Kill process on port 3001
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process

# Kill process on port 3002
Get-Process -Id (Get-NetTCPConnection -LocalPort 3002).OwningProcess | Stop-Process

# Kill process on port 5173
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

#### Smart Contract lỗi compile
```bash
cd move/hello-world

# Kiểm tra syntax
sui move build

# Nếu lỗi import, check:
# - All modules có đúng tên không
# - use statements đầy đủ chưa
# - Public/private functions correct
```

### 🎓 Setup Google OAuth (Optional - Cho zkLogin)

1. **Google Cloud Console**
   - Truy cập: https://console.cloud.google.com
   - Create new project: "Sui Gifting"
   
2. **Enable APIs**
   - APIs & Services → Enable APIs
   - Search "Google+ API" → Enable

3. **Create OAuth Client**
   - Credentials → Create Credentials → OAuth Client ID
   - Application type: Web application
   - Name: "Sui Gifting Web"
   
4. **Authorized Redirect URIs**
   ```
   http://localhost:5173
   http://localhost:5173/auth/google/callback
   ```

5. **Copy Client ID**
   - Copy the Client ID (dạng: xxx.apps.googleusercontent.com)
   - Paste vào:
     - `backend/.env` → GOOGLE_CLIENT_ID
     - `ui/.env` → VITE_GOOGLE_CLIENT_ID

6. **Restart**
   ```bash
   # Restart backend
   Ctrl+C
   npm start

   # Restart frontend (khác terminal)
   Ctrl+C
   npm run dev
   ```

### 📊 Monitoring

#### Check Backend Health
```bash
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":1234567890}
```

#### Check Gas Station Balance
```bash
curl http://localhost:3001/api/gas-station/balance
# Expected: {"address":"0x...","balance":"1000000000","balanceSUI":"1.0000"}
```

#### Check WebSocket
```javascript
// Browser console
const ws = new WebSocket('ws://localhost:3002');
ws.onopen = () => console.log('Connected');
ws.send(JSON.stringify({type:'register',email:'test@test.com'}));
```

### 🎯 Production Deployment (Sau khi test xong)

#### 1. Deploy Smart Contracts lên Mainnet
```bash
sui client switch --env mainnet
sui client publish --gas-budget 100000000
# Update Package IDs
```

#### 2. Deploy Backend
```bash
# Option 1: VPS (DigitalOcean, AWS EC2)
# Option 2: Heroku
# Option 3: Railway.app (recommended)

# Set environment variables
# Start with: npm start
```

#### 3. Deploy Frontend
```bash
# Option 1: Vercel (recommended)
npm run build
vercel deploy

# Option 2: Netlify
npm run build
netlify deploy --prod

# Update VITE_WS_URL và VITE_BACKEND_URL
```

### 📚 Tài Liệu Tham Khảo

- [Sui Documentation](https://docs.sui.io)
- [Move Language Guide](https://move-language.github.io/move/)
- [@mysten/dapp-kit Docs](https://sdk.mystenlabs.com/dapp-kit)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Chi tiết đầy đủ

### 🚀 Next Steps

Sau khi test xong, xem:
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Full documentation
- [CHECKLIST.md](./CHECKLIST.md) - Detailed features
- Backend logs để monitor events

---

**Thời gian ước tính:**
- Setup: 30 phút
- Testing: 15 phút
- Google OAuth (optional): 15 phút
- **Tổng: 45-60 phút**

🎉 **Chúc bạn thành công!**
