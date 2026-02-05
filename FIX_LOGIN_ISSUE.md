# ✅ Đã Fix: Yêu cầu đăng nhập khi mở quà

## ❌ Vấn đề trước đây:
Khi mở quà, app bắt đăng nhập Google nhưng không có nút login → **막막함**

## ✅ Đã sửa:

### 1. **Logic phân biệt 2 loại quà:**

#### **Quà gửi bằng Email** (có recipient_email):
- ✅ Yêu cầu đăng nhập Google
- ✅ Hiển thị nút "🔑 Đăng nhập Google" ở góc phải
- ✅ Khi lỗi → nút "Đăng nhập Google ngay" trong error box
- ✅ Email phải khớp với recipient_email

#### **Quà gửi bằng Address** (legacy):
- ✅ KHÔNG yêu cầu đăng nhập
- ✅ Có Sui wallet là claim được
- ✅ Không cần email verification

### 2. **UI Improvements:**

**Trên trang ClaimGift:**
```
[← Quay lại]                    [🔑 Đăng nhập Google]  (nếu chưa login)
[← Quay lại]                    [👤 User Info]          (nếu đã login)
```

**Error Box có nút login:**
```
⚠️ Quà này yêu cầu đăng nhập Google để xác thực email!
[🔑 Đăng nhập Google ngay]
```

### 3. **Flow hoàn chỉnh:**

#### **Người gửi tạo quà:**
```
1. Tạo quà với email: recipient@gmail.com
2. Event emit → người nhận nhận thông báo (nếu đã login)
```

#### **Người nhận mở quà:**

**Cách 1: Qua thông báo (KHÔNG CẦN LINK)**
```
1. Đăng nhập Google với recipient@gmail.com
2. Đợi 5s → Notification bell có số "1"
3. Click notification → Tự động vào trang Claim
4. Click "🎉 MỞ QUÀ NGAY!" → Xong!
```

**Cách 2: Qua link trực tiếp**
```
1. Nhận link: http://localhost:5175/#/claim?id=0x...
2. Mở link → Thấy thông báo "Đăng nhập Google"
3. Click "🔑 Đăng nhập Google"
4. Đăng nhập với email đúng
5. Click "🎉 MỞ QUÀ NGAY!" → Xong!
```

---

## 🔧 Điều kiện cần thiết:

### 1. **Google OAuth Client ID** (BẮT BUỘC)

Nếu chưa có, làm theo file [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md):

**Tóm tắt nhanh:**
1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo OAuth Client ID
3. Copy Client ID vào `ui/.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   ```
4. Restart dev server: `npm run dev`

### 2. **Sui Wallet** (Chrome Extension)

- Tải: https://chrome.google.com/webstore/detail/sui-wallet
- Kết nối: Click nút "Connect Wallet" trên app

### 3. **Testnet SUI**

- Click nút "✨ Lấy Testnet SUI" trên header
- Hoặc: https://faucet.sui.io

---

## 🧪 Test hoàn chỉnh:

### **Test 1: Gửi quà bằng Email**

**Tab 1 (Người gửi):**
1. ✅ Đăng nhập Google: `sender@gmail.com`
2. ✅ Kết nối Sui wallet
3. ✅ Tạo quà với email: `recipient@gmail.com`
4. ✅ Thấy notification "Đã tạo quà thành công"

**Tab 2 (Người nhận - Incognito):**
1. ✅ Đăng nhập Google: `recipient@gmail.com`
2. ✅ Đợi 5s → Notification bell hiện số "1"
3. ✅ Click notification → Tự động vào trang claim
4. ✅ Thấy user info ở góc phải
5. ✅ Kết nối Sui wallet
6. ✅ Click "🎉 MỞ QUÀ NGAY!" → Nhận được SUI!

### **Test 2: Mở quà qua link (chưa đăng nhập)**

**Người nhận:**
1. ❌ Chưa đăng nhập Google
2. ✅ Nhận link: `http://localhost:5175/#/claim?id=0x...`
3. ✅ Mở link → Thấy nút "🔑 Đăng nhập Google" ở góc
4. ✅ Click đăng nhập
5. ✅ Popup Google OAuth → chọn email
6. ✅ Quay lại trang → Thấy user info
7. ✅ Kết nối wallet → Mở quà thành công!

### **Test 3: Email không khớp**

**Người nhận:**
1. ✅ Đăng nhập Google: `wrong@gmail.com` (SAI)
2. ✅ Quà gửi cho: `recipient@gmail.com`
3. ✅ Click "MỞ QUÀ"
4. ✅ Blockchain reject → Error message
5. ✅ Đăng xuất → Đăng nhập lại với email đúng
6. ✅ Thành công!

---

## 🐛 Troubleshooting:

### **"Client ID not configured"**
→ Chưa có `VITE_GOOGLE_CLIENT_ID` trong `.env`
→ Làm theo [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

### **"redirect_uri_mismatch"**
→ Google Console chưa có redirect URI
→ Thêm: `http://localhost:5175/auth/google/callback`

### **"Không nhận được thông báo"**
→ Mở Console (F12) kiểm tra log:
```javascript
🎁 GiftCreatedEvent received
❌ NO NOTIFICATION - Email mismatch
```
→ Email không khớp!

### **"Quà yêu cầu đăng nhập nhưng không có nút"**
→ Đã fix! Nút ở góc phải và trong error box

---

## 📝 Tóm tắt:

✅ **Đã thêm:**
- Nút đăng nhập Google trên trang ClaimGift
- Hiển thị user info khi đã login
- Error message rõ ràng với nút login
- Phân biệt quà email vs address

✅ **User không bị bối rối nữa!**
- Thấy rõ cần đăng nhập
- Có nút để click
- Biết email nào cần dùng

🎉 **Trải nghiệm mượt mà!**
