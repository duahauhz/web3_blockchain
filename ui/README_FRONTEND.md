# 🎁 SuiGift - Ứng dụng Tặng Quà Kỹ Thuật Số trên Sui Blockchain

Ứng dụng Web3 cho phép gửi SUI token như một món quà với lời nhắn đặc biệt trên blockchain Sui.

## 🌟 Tính năng

- **Trang chủ hiện đại**: Hero section với gradient đẹp mắt và animation mượt mà
- **Tạo hộp quà**: Gửi SUI token kèm lời nhắn cho bạn bè
- **Nhận quà**: Mở hộp quà với hiệu ứng confetti đầy bất ngờ
- **Blockchain Sui**: Nhanh chóng, an toàn và minh bạch
- **UI/UX hiện đại**: Thiết kế gradient tím-hồng công nghệ cao

## 📦 Công nghệ sử dụng

### Frontend
- **React** + **TypeScript** + **Vite**
- **@mysten/dapp-kit**: Kết nối với Sui blockchain
- **Framer Motion**: Animations mượt mà
- **Canvas Confetti**: Hiệu ứng pháo giấy
- **Radix UI**: Component library
- **Lucide React**: Icon library

### Smart Contract (Move)
- **Module**: `hello_world::gifting`
- **Functions**:
  - `send_sui_gift`: Gửi quà
  - `open_and_claim`: Mở và nhận quà

## 🚀 Cài đặt và Chạy

### Bước 1: Cài đặt dependencies

```bash
cd ui
npm install
# hoặc
pnpm install
```

### Bước 2: Publish Move Package (nếu chưa có)

```bash
cd move/hello-world

# Kiểm tra cấu hình Sui CLI
sui client active-address

# Build Move package
sui move build

# Publish lên Testnet
sui client publish --gas-budget 100000000
```

**Quan trọng**: Sau khi publish, copy **Package ID** và cập nhật vào file `ui/src/constants.ts`:

```typescript
export const TESTNET_HELLO_WORLD_PACKAGE_ID = "0xYOUR_PACKAGE_ID_HERE";
```

### Bước 3: Chạy ứng dụng

```bash
cd ui
npm run dev
# hoặc
pnpm dev
```

Mở trình duyệt tại: http://localhost:5173/

## 🎮 Hướng dẫn sử dụng

### 1. Kết nối ví
- Nhấn nút **"Connect Wallet"** ở góc trên phải
- Chọn ví Sui của bạn (khuyến nghị: Sui Wallet)
- Xác nhận kết nối

### 2. Lấy SUI Testnet (nếu cần)
- Nhấn nút **"Lấy Testnet SUI"**
- Hoặc truy cập: https://faucet.sui.io/

### 3. Tạo và Gửi Quà

1. Nhấn **"Tạo hộp quà"** từ trang chủ
2. Điền thông tin:
   - **Địa chỉ người nhận**: Địa chỉ ví Sui (0x...)
   - **Số lượng SUI**: Ví dụ 0.1
   - **Lời nhắn**: Tin nhắn cho người nhận
3. Nhấn **"Gói quà & Gửi"**
4. Xác nhận giao dịch trong ví
5. Copy **Gift ID** và gửi cho người nhận

### 4. Nhận Quà

1. Nhấn **"Nhận quà"** từ trang chủ
2. Dán **Gift ID** đã nhận được
3. Nhấn **"Tìm quà"**
4. Xem thông tin quà (người gửi, lời nhắn)
5. Nhấn **"🎉 Mở quà ngay!"**
6. Xác nhận giao dịch
7. Thưởng thức hiệu ứng confetti! 🎉

## 📁 Cấu trúc Project

```
sui-stack-hello-world/
├── move/hello-world/           # Smart Contract Move
│   ├── sources/
│   │   └── sendAndReceiveGift.move
│   ├── Move.toml
│   └── Published.toml
│
└── ui/                         # Frontend React
    ├── src/
    │   ├── App.tsx            # Router chính
    │   ├── HomePage.tsx       # Trang chủ
    │   ├── CreateGift.tsx     # Tạo quà
    │   ├── ClaimGift.tsx      # Nhận quà
    │   ├── constants.ts       # Package ID
    │   ├── networkConfig.ts   # Cấu hình mạng
    │   └── main.tsx
    ├── package.json
    └── vite.config.mts
```

## 🎨 Thiết kế

### Màu sắc
- **Primary Gradient**: `#667eea` → `#764ba2` → `#f093fb`
- **Background**: Gradient động với animation
- **Accent**: Trắng với độ trong suốt

### Animation
- **Framer Motion**: Fade in, scale, rotate
- **Canvas Confetti**: Hiệu ứng pháo giấy khi mở quà
- **Floating**: Hộp quà lơ lửng với animation

## 🔧 Move Smart Contract

### Struct chính

```move
public struct GiftBox has key, store {
    id: UID,
    sender: address,
    message: String,
    is_opened: bool,
    content: Coin<SUI>
}
```

### Functions

```move
// Gửi quà
public fun send_sui_gift(
    input_coin: Coin<SUI>,
    message: String,
    recipient: address,
    ctx: &mut TxContext
)

// Mở và nhận quà
public fun open_and_claim(
    gift: GiftBox,
    ctx: &mut TxContext
)
```

## 📝 TODO / Cải tiến

- [ ] Thêm zkLogin để đăng nhập bằng Google
- [ ] Hỗ trợ gửi NFT kèm quà
- [ ] Lịch sử giao dịch
- [ ] Tùy chỉnh theme hộp quà
- [ ] Thông báo realtime
- [ ] Share link social media

## ⚠️ Lưu ý

- Hiện tại chỉ hỗ trợ **Sui Testnet**
- Cần có SUI testnet để thực hiện giao dịch
- Chỉ người nhận mới có thể mở quà (kiểm tra owner)
- Move package cần được publish trước khi sử dụng

## 🐛 Troubleshooting

### Lỗi "Package not found"
- Kiểm tra lại Package ID trong `constants.ts`
- Đảm bảo package đã được publish lên Testnet

### Lỗi "Insufficient gas"
- Lấy thêm SUI từ faucet
- Kiểm tra số dư ví

### Lỗi "Cannot open gift"
- Chỉ người nhận mới có thể mở quà
- Kiểm tra Gift ID có đúng không
- Quà có thể đã được mở rồi

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console log trong DevTools
2. Xem lại hướng dẫn cài đặt
3. Đảm bảo đã kết nối ví đúng cách

## 📜 License

MIT License

---

**Được xây dựng với ❤️ bằng Sui Blockchain**
