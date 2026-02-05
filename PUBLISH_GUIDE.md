# 🚀 Hướng dẫn Publish Move Contract

## Vấn đề hiện tại
Lỗi: `No function was found with function name lock_lixi`

**Nguyên nhân**: Code Move đã có hàm `lock_lixi` nhưng chưa được publish lên blockchain.

## Các bước publish:

### 1. Di chuyển vào thư mục Move
```powershell
cd E:\WEB3_PTIT\sui-stack-hello-world\move\hello-world
```

### 2. Build Move package
```powershell
sui move build
```

### 3. Publish lên Sui Testnet
```powershell
sui client publish --gas-budget 100000000
```

**Lưu ý**: 
- Đảm bảo bạn đã có SUI token trong ví (dùng faucet nếu cần)
- Sau khi publish thành công, console sẽ hiển thị **Package ID mới**

### 4. Copy Package ID mới và cập nhật vào code

Sau khi publish, tìm dòng như này trong output:
```
Published Objects:
...
PackageID: 0xABCD1234...
```

### 5. Cập nhật Package ID trong UI

Mở file `ui/src/constants.ts` và thay đổi:
```typescript
export const TESTNET_HELLO_WORLD_PACKAGE_ID = "0xNEW_PACKAGE_ID_HERE";
```

### 6. Test lại

Sau khi cập nhật Package ID, trang web sẽ dùng contract mới với đầy đủ các function:
- ✅ `create_lixi`
- ✅ `claim_lixi` 
- ✅ `lock_lixi` (MỚI)
- ✅ `reclaim_expired_lixi`

## Kiểm tra nhanh

Sau khi publish, test các chức năng:
1. Tạo bao lì xì ✅
2. Người khác nhận lì xì ✅
3. **Khóa lì xì ngay** ✅ (chức năng mới)
4. Hoàn tiền khi hết hạn/đã khóa ✅

---

**Package ID hiện tại (CŨ)**: `0x4045bfd30ece67f3073d96635427e9e6663e3772713ada67cc25d78d6f2c4193`

**Cần publish để có Package ID MỚI** với đầy đủ functions!
