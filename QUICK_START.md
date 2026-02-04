# 🚀 Hướng dẫn Chạy Nhanh - SuiGift

## Bước 1: Cài đặt Dependencies

Mở terminal và chạy:

```bash
cd e:\WEB3_PTIT\sui-stack-hello-world\ui
npm install
```

Các package sẽ được cài:
- canvas-confetti (hiệu ứng pháo giấy)
- framer-motion (animations)
- lucide-react (icons)
- @types/canvas-confetti

## Bước 2: Publish Move Package

```bash
# Chuyển vào thư mục Move
cd e:\WEB3_PTIT\sui-stack-hello-world\move\hello-world

# Build package
sui move build

# Publish lên Testnet (cần có SUI testnet)
sui client publish --gas-budget 100000000
```

**QUAN TRỌNG**: Sau khi publish, bạn sẽ thấy output như:

```
----- Transaction Effects ----
...
----- Published Package ----
PackageID: 0xABC123...
...
```

Copy **PackageID** này!

## Bước 3: Cập nhật Package ID

Mở file `ui/src/constants.ts` và thay đổi:

```typescript
export const TESTNET_HELLO_WORLD_PACKAGE_ID = "0xPASTE_YOUR_PACKAGE_ID_HERE";
```

## Bước 4: Chạy Frontend

```bash
cd e:\WEB3_PTIT\sui-stack-hello-world\ui
npm run dev
```

Mở trình duyệt: **http://localhost:5173/**

## Bước 5: Sử dụng App

### A. Lần đầu sử dụng
1. Cài extension **Sui Wallet** cho Chrome/Firefox
2. Tạo hoặc import ví
3. Lấy SUI testnet từ: https://faucet.sui.io/

### B. Kết nối ví
1. Click **"Connect Wallet"** trên app
2. Chọn ví Sui
3. Approve connection

### C. Tạo quà
1. Click **"Tạo hộp quà"**
2. Nhập:
   - Địa chỉ người nhận (0x...)
   - Số lượng SUI (ví dụ: 0.1)
   - Lời nhắn (ví dụ: "Happy Birthday!")
3. Click **"Gói quà & Gửi"**
4. Approve transaction trong ví
5. Copy Gift ID gửi cho người nhận

### D. Nhận quà
1. Click **"Nhận quà"**
2. Paste Gift ID
3. Click **"Tìm quà"**
4. Xem thông tin quà
5. Click **"Mở quà ngay!"**
6. Approve transaction
7. Tận hưởng hiệu ứng confetti! 🎉

## ⚡ Tips

- Nếu thiếu SUI testnet, click nút **"Lấy Testnet SUI"** trên app
- Mỗi Gift ID chỉ mở được 1 lần
- Chỉ người nhận (recipient address) mới mở được quà
- Giao dịch trên testnet nhanh chóng (2-3 giây)

## 🐛 Lỗi thường gặp

### "pnpm not found"
➡️ Dùng `npm` thay vì `pnpm`

### "Package not found"
➡️ Kiểm tra lại Package ID trong constants.ts

### "Insufficient gas"
➡️ Lấy thêm SUI từ faucet

### "Transaction failed"
➡️ Kiểm tra:
- Đã kết nối ví chưa?
- Có đủ SUI không?
- Địa chỉ người nhận đúng format không?

## 📞 Need Help?

Check console log trong DevTools (F12) để xem lỗi chi tiết!

---

🎉 **Chúc bạn thành công!**
