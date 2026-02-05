# 🚀 CÁCH CHẠY DỰ ÁN

## ✅ Đã Setup
- ✅ Smart contracts đã build thành công
- ✅ Backend dependencies đã cài đặt
- ✅ Frontend dependencies đã cài đặt
- ✅ File .env đã được tạo

## 🏃 Chạy Ngay

### Option 1: Dùng File BAT (Đơn giản nhất)

1. **Double-click** file: `start-backend.bat` (backend đang chạy rồi)
2. **Double-click** file: `start-frontend.bat` (mở terminal mới)

### Option 2: Dùng Terminal

**Terminal 1 - Backend (ĐÃ CHẠY):**
```bash
cd e:\WEB3_PTIT\sui-stack-hello-world\backend
node src/server.js
```

**Terminal 2 - Frontend (MỞ TERMINAL MỚI):**
```bash
cd e:\WEB3_PTIT\sui-stack-hello-world\ui
npm run dev
```

## 🌐 Truy Cập

Sau khi chạy frontend (terminal 2), mở trình duyệt:

**🎯 http://localhost:5173**

## 📊 Status Check

### Backend Running ✅
- HTTP Server: http://localhost:3001
- WebSocket: ws://localhost:3002
- Health Check: http://localhost:3001/health

### Frontend (Chờ khởi động)
- Vite Dev Server: http://localhost:5173

## 🧪 Test Chức Năng

### 1. Test Gift Cơ Bản (Không cần zkLogin)

1. Mở http://localhost:5173
2. Click "Connect Wallet" → Chọn Sui Wallet
3. Click "Tạo Quà" 
4. Nhập:
   - **Người nhận**: Copy địa chỉ ví khác
   - **Số lượng**: 0.1 SUI
   - **Lời nhắn**: "Test gift"
5. Click "Gửi Quà"
6. **Copy Gift ID** từ thông báo
7. Mở ví người nhận → "Nhận Quà" → Paste ID

**Kết quả:** Tiền chuyển + confetti effect 🎉

### 2. Test Lì Xì Nhóm

1. Click "Tạo Lì Xì"
2. Nhập:
   - **Tổng tiền**: 1.0 SUI
   - **Số người**: 5
   - **Chế độ**: May mắn
   - **Min/Max**: 0.1 / 0.5 SUI
   - **Lời chúc**: "Happy New Year!"
3. Click "Tạo Bao Lì Xì"
4. **Copy Lixi ID** và share
5. Mở link → Click "MỞ BÁO LÌ XÌ"

**Kết quả:** Random amount + fireworks 🎆

## ⚠️ Lưu Ý Quan Trọng

### 1. Cần SUI Testnet
- Truy cập: https://faucet.sui.io
- Paste địa chỉ ví → Request SUI miễn phí

### 2. Chưa Publish Smart Contracts
Hiện đang dùng Package ID cũ. Để deploy contract mới:

```bash
cd e:\WEB3_PTIT\sui-stack-hello-world\move\hello-world
sui client publish --gas-budget 100000000

# Copy Package ID từ output
# Update vào:
# - ui/src/constants.ts
# - backend/.env (GIFTING_PACKAGE_ID)
```

### 3. Gas Station Chưa Setup
Gas Station cần keypair riêng. Để setup đầy đủ:

```bash
# Tạo keypair mới
sui keygen

# Copy private key và address
# Paste vào backend/.env:
# GAS_STATION_PRIVATE_KEY=0x...
# GAS_STATION_ADDRESS=0x...

# Nạp SUI cho Gas Station từ faucet
```

### 4. Google OAuth (Optional)
Tính năng zkLogin cần Google OAuth. Xem hướng dẫn trong:
- [QUICK_DEPLOY.md](QUICK_DEPLOY.md)
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)

## 🛠️ Troubleshooting

### Frontend không chạy?
```bash
cd ui
npm install
npm run dev
```

### Backend lỗi?
```bash
cd backend
npm install
node src/server.js
```

### Smart Contract lỗi?
```bash
cd move/hello-world
sui move build
```

### Port đã được dùng?
```powershell
# Kill process trên port 3001
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process

# Kill process trên port 5173
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

## 📚 Tài Liệu

- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Tổng quan dự án
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Hướng dẫn chi tiết
- [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - Deploy production

## 🎯 Current Status

### ✅ Hoàn Thành
- Smart Contracts (Move) - Build successful
- Backend Server - Running on port 3001
- WebSocket Server - Running on port 3002
- Event Listener - Active

### 🔄 Cần Làm Tiếp
1. Mở terminal mới và chạy frontend
2. Test các chức năng cơ bản
3. Publish smart contracts lên testnet (optional)
4. Setup Gas Station keypair (optional)
5. Setup Google OAuth (optional)

---

## 🆘 Cần Trợ Giúp?

1. Check terminal output cho lỗi cụ thể
2. Xem [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
3. Xem logs trong browser console

**Chúc bạn thành công!** 🎉
