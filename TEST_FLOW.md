# Test Flow: Click thông báo → Verification Screen

## 🎯 Mục tiêu
Khi click thông báo, phải đi thẳng đến trang SO SÁNH TÀI KHOẢN, KHÔNG hiển thị form nhập Gift ID

## ✅ Flow mong đợi

```
User click thông báo
    ↓
URL: /claim?id=0x123abc...
    ↓
useEffect chạy:
  - params.get('id') = '0x123abc...'
  - setGiftId('0x123abc...')
  - setSearchedGiftId('0x123abc...')
  - setShowVerification(true) ← KEY!
  - setHasCheckedUrl(true)
    ↓
Component re-render với:
  - hasCheckedUrl = true ✅
  - searchedGiftId = '0x123abc...' ✅
  - showVerification = true ✅
    ↓
Điều kiện kiểm tra:
  1. Header & Input Form: hasCheckedUrl && !searchedGiftId → FALSE ❌ (không hiển thị)
  2. Loading: !hasCheckedUrl → FALSE ❌ (không hiển thị)
  3. Verification: hasCheckedUrl && searchedGiftId && showVerification → TRUE ✅
    ↓
✅ HIỂN THỊ VERIFICATION SCREEN
```

## 🧪 Test Cases

### Test 1: Click thông báo (có ?id=)
**Input:**
- URL: `http://localhost:5175/#/claim?id=0x123abc`

**Expected:**
1. ❌ KHÔNG hiển thị header "Nhận quà tặng 🎁"
2. ❌ KHÔNG hiển thị form input Gift ID
3. ✅ HIỂN thị Verification Screen với:
   - Thông tin quà (từ, số tiền, lời nhắn)
   - Check Google account
   - Check Wallet address
   - Check mapping Google ↔ Wallet

**Console logs:**
```
🔍 Checking URL params: { idFromUrl: '0x123abc' }
✅ Found Gift ID in URL, auto-loading verification...
```

### Test 2: Mở trang trực tiếp (không có ?id=)
**Input:**
- URL: `http://localhost:5175/#/claim`

**Expected:**
1. ✅ HIỂN thị header "Nhận quà tặng 🎁"
2. ✅ HIỂN thị form input Gift ID
3. ❌ KHÔNG hiển thị Verification Screen

**Console logs:**
```
🔍 Checking URL params: { idFromUrl: null }
ℹ️ No Gift ID in URL, showing input form
```

### Test 3: Nhập thủ công Gift ID
**Input:**
- Nhập ID và click "Tìm quà"

**Expected:**
1. handleSearchGift() chạy
2. setShowVerification(true)
3. Chuyển đến Verification Screen

## 🔍 Debug Checklist

Nếu vẫn thấy form input khi click thông báo:

### Check 1: Console logs
Mở F12 Console, xem có logs này không:
```
✅ Found Gift ID in URL, auto-loading verification...
```

Nếu không có → useEffect không chạy hoặc params.get('id') = null

### Check 2: URL format
URL phải có dạng:
```
/#/claim?id=0x123abc
```
KHÔNG phải:
```
/#/claim#id=0x123abc  ← SAI
/claim?id=0x123abc     ← SAI (thiếu #)
```

### Check 3: State values (dùng React DevTools)
- hasCheckedUrl = true?
- searchedGiftId = có giá trị?
- showVerification = true?

### Check 4: Điều kiện hiển thị
Verification screen chỉ hiển thị khi:
```typescript
hasCheckedUrl && searchedGiftId && !isOpened && showVerification
```

## 🐛 Known Issues & Solutions

### Issue 1: Form vẫn hiển thị
**Reason:** URL parsing sai
**Solution:** Check URL hash routing

### Issue 2: Không có console logs
**Reason:** useEffect không chạy
**Solution:** Check dependencies array []

### Issue 3: Verification không hiển thị
**Reason:** showVerification = false
**Solution:** Đảm bảo setShowVerification(true) được gọi trong useEffect

## 📊 State Flow Diagram

```
INITIAL STATE:
├─ hasCheckedUrl: false
├─ searchedGiftId: ""
├─ showVerification: false
└─ Hiển thị: Loading...

     ↓ useEffect runs

WITH URL PARAMS (?id=xxx):
├─ hasCheckedUrl: true
├─ searchedGiftId: "0x123..."
├─ showVerification: true
└─ Hiển thị: Verification Screen ✅

WITHOUT URL PARAMS:
├─ hasCheckedUrl: true
├─ searchedGiftId: ""
├─ showVerification: false
└─ Hiển thị: Input Form ✅
```
