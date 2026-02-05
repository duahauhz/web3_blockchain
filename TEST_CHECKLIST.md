# 🧪 TEST CHECKLIST - Lixi Flow

## ✅ Test 1: Tạo Lì Xì
1. Mở http://localhost:5173
2. Connect Sui Wallet
3. Click "🧧 Tạo Lì Xì Nhóm"
4. Điền thông tin:
   - Tổng tiền: 1 SUI
   - Số người nhận: 5
   - Chế độ: Random
   - Lời chúc: "Chúc mừng năm mới"
   - Hết hạn: 24 giờ
5. Click "Tạo Bao Lì Xì"
6. Confirm transaction trong wallet

**Kết quả mong đợi:**
- ✅ Chuyển sang trang Success
- ✅ Hiển thị emoji 🧧
- ✅ Tiêu đề: "🧧 Lì Xì Đã Tạo!"
- ✅ Hiển thị link đầy đủ: `http://localhost:5173/claim-lixi?id=0x...`
- ✅ Hiển thị ID dưới dạng text nhỏ
- ✅ Nút "🔗 Copy Link Nhận Lì Xì"
- ✅ Nút "🏠 Về trang chủ"

---

## ✅ Test 2: Copy Link
1. Từ trang Success, click "🔗 Copy Link Nhận Lì Xì"
2. Kiểm tra clipboard

**Kết quả mong đợi:**
- ✅ Alert: "✅ Đã copy link nhận lì xì!"
- ✅ Clipboard chứa: `http://localhost:5173/claim-lixi?id=0x...`

---

## ✅ Test 3: Mở Link (Trình duyệt khác hoặc Incognito)
1. Mở trình duyệt mới/Incognito
2. Paste link: `http://localhost:5173/claim-lixi?id=0x...`
3. Enter

**Kết quả mong đợi:**
- ✅ Tự động chuyển đến trang ClaimLixi
- ✅ Lixi ID đã được tự động điền vào ô input
- ✅ Hiển thị thông tin lì xì (số người còn lại, tổng tiền...)

---

## ✅ Test 4: Nhận Lì Xì
1. Connect Sui Wallet
2. Click "MỞ BÁO LÌ XÌ"
3. Confirm transaction

**Kết quả mong đợi:**
- ✅ Animation shake (rung lì xì)
- ✅ Fireworks effect (pháo hoa)
- ✅ Hiển thị số tiền nhận được
- ✅ Toast notification thành công
- ✅ Balance tăng lên

---

## ✅ Test 5: Tạo Gift (Test so sánh)
1. Về trang chủ
2. Click "🎁 Tạo Gift Mới"
3. Tạo gift thành công

**Kết quả mong đợi:**
- ✅ Trang Success hiển thị emoji 🎉 (khác với lì xì)
- ✅ Tiêu đề: "🎁 Quà Đã Gửi!" (khác với lì xì)
- ✅ Link: `http://localhost:5173/claim?id=0x...` (không có -lixi)
- ✅ Nút: "🔗 Copy Link Nhận Quà" (khác với lì xì)

---

## 🐛 Common Issues

### Issue 1: Không thấy trang Success
- **Nguyên nhân:** currentPage không chuyển sang 'success'
- **Kiểm tra:** Console log trong handleGiftCreated
- **Fix:** Đảm bảo onCreated callback được gọi đúng

### Issue 2: Link không có query parameter
- **Nguyên nhân:** window.location.origin sai hoặc createdGiftId null
- **Kiểm tra:** Console log claimLink
- **Fix:** Đảm bảo createdGiftId được set trước khi render

### Issue 3: Lixi ID không tự động điền
- **Nguyên nhân:** useEffect không chạy hoặc query param sai
- **Kiểm tra:** Console log trong useEffect của ClaimLixi
- **Fix:** Đảm bảo URLSearchParams.get('id') hoạt động

### Issue 4: "No module found with module name sui_lixi"
- **Nguyên nhân:** Package ID cũ
- **Fix:** Đã fix - Package ID mới: 0x66f68179632247de32f089ba2a71fe222144863476fc601cfe8ddb9c61e22dc6

---

## 📊 Current Status

✅ **Completed:**
- Package published with sui_lixi module
- Frontend routing với query parameters
- Success page với link sharing
- Auto-fill Lixi ID from URL
- Copy link functionality
- Differentiate Gift vs Lixi

🔧 **To Test:**
- User thực tế click qua flow để verify
- Copy/paste link giữa các tabs
- Multiple users claim cùng lúc

📍 **Package ID:** 0x66f68179632247de32f089ba2a71fe222144863476fc601cfe8ddb9c61e22dc6
🌐 **Frontend:** http://localhost:5173
🚀 **Backend:** http://localhost:3001 (HTTP) & ws://localhost:3002 (WebSocket)
