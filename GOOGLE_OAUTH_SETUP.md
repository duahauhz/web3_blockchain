# 🔐 Hướng dẫn Setup Google OAuth

## ⚠️ Quan trọng: Xác định Redirect URI

Trước tiên, mở Console (F12) và click nút "Đăng nhập Google". Bạn sẽ thấy log:
```javascript
🔐 Google OAuth Config: {
  redirect_uri: "http://localhost:5175/auth/google/callback"
}
```

**Copy chính xác redirect_uri này** để dùng ở bước tiếp theo!

---

## Bước 1: Tạo Google OAuth Client ID

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Vào **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Nếu chưa có OAuth consent screen, click **Configure Consent Screen**:
   - Chọn **External**
   - Điền **App name**: `SuiGift`
   - **User support email**: email của bạn
   - **Developer contact**: email của bạn
   - Click **Save and Continue** → **Save and Continue** (bỏ qua Scopes)
   - Thêm test users: email bạn muốn test
   - Click **Save and Continue**

6. Quay lại **Credentials** → **Create Credentials** → **OAuth client ID**
7. Chọn **Application type**: **Web application**
8. Điền thông tin:
   - **Name**: `SuiGift Web Client`
   
   - **Authorized JavaScript origins**: 
     ```
     http://localhost:5173
     http://localhost:5174
     http://localhost:5175
     ```
   
   - **Authorized redirect URIs** (QUAN TRỌNG - phải đúng 100%):
     ```
     http://localhost:5173/auth/google/callback
     http://localhost:5174/auth/google/callback
     http://localhost:5175/auth/google/callback
     ```

9. Click **Create** và copy **Client ID** (có dạng: `xxx.apps.googleusercontent.com`)

## Bước 2: Cấu hình Environment Variables

Mở file `ui/.env` và paste Client ID vào:

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com

# Backend URLs
VITE_WS_URL=ws://localhost:3002
VITE_BACKEND_URL=http://localhost:3001
```

## Bước 3: Restart Dev Server

```bash
cd ui
npm run dev
```

## Bước 4: Test Đăng Nhập

1. Mở app tại `http://localhost:5175`
2. Click nút **"Đăng nhập Google"** ở góc trên
3. Chọn tài khoản Google
4. Sau khi đăng nhập thành công, bạn sẽ thấy:
   - Avatar + email hiển thị ở header
   - Notification Bell hoạt động

## ✅ Cách hoạt động

### Flow Gửi Quà:
```
Người gửi → Tạo quà với email recipient@gmail.com
    ↓
GiftCreatedEvent emit ra blockchain
    ↓
Người nhận đăng nhập Google với recipient@gmail.com
    ↓
NotificationContext tự động poll events (5s)
    ↓
Match email → Thêm notification tự động
    ↓
Người nhận click notification → Trang Claim Quà
```

### Lưu ý quan trọng:
- **Email phải khớp chính xác** (case-sensitive)
- Người nhận cần **đăng nhập Google** trước khi nhận được thông báo
- Thông báo tự động xuất hiện sau 5 giây (polling interval)

## 🔍 Debug

### Nếu gặp lỗi `redirect_uri_mismatch`:

✅ **Checklist:**
1. Mở Console (F12) khi click "Đăng nhập Google"
2. Xem log `redirect_uri` (ví dụ: `http://localhost:5175/auth/google/callback`)
3. Vào [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
4. Click vào OAuth Client ID đã tạo
5. Kiểm tra **Authorized redirect URIs** có chứa CHÍNH XÁC URI ở bước 2
6. Nếu không có → Click **Add URI** → Paste URI → **Save**
7. Đợi 1-2 phút để Google update
8. Thử login lại!

### Nếu không nhận được thông báo:

Mở **Console (F12)** và kiểm tra:

```javascript
// Log này xuất hiện khi có event
🎁 GiftCreatedEvent received: {
  recipient_email: "test@gmail.com",
  current_user_email: "test@gmail.com",
  will_notify_recipient: true
}

// Log này xác nhận notification được thêm
✅ ADDING NOTIFICATION FOR RECIPIENT: test@gmail.com
```

Nếu thấy:
```javascript
❌ NO NOTIFICATION - Email mismatch or not logged in
```
→ Email không khớp hoặc chưa đăng nhập!

### Các lỗi khác:

1. **"Client ID not configured"**: Chưa có `VITE_GOOGLE_CLIENT_ID` trong `.env`
2. **"Invalid client"**: Client ID sai hoặc bị xóa
3. **"Access blocked"**: App chưa được verify (thêm email vào Test Users)
