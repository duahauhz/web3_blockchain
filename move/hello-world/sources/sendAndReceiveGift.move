#[allow(lint(self_transfer))]
module hello_world::gifting {
    use std::string::String;
    // Chỉ giữ lại những import cần thiết chưa có sẵn
    use sui::coin::{Coin}; 
    use sui::sui::SUI;
    use sui::event; // <--- Đã thêm dòng này để sửa lỗi E03006

    // Tắt cảnh báo về việc dùng Coin thay vì Balance để code dễ hiểu hơn
    #[allow(lint(coin_field))]
    public struct GiftBox has key, store {
        id: UID,
        sender: address,
        message: String,
        is_opened: bool,
        content: Coin<SUI> 
    }

    // Sự kiện Proof of Impact
    public struct GiftOpenedEvent has copy, drop {
        gift_id: ID,
        sender: address,
        recipient: address,
    }

    // --- CÁC HÀM CHỨC NĂNG ---

    // 1. Gửi quà (Nhận Coin<SUI> từ frontend gửi xuống)
    public fun send_sui_gift(
        input_coin: Coin<SUI>, 
        message: String, 
        recipient: address, 
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender(); // Cú pháp ngắn gọn hơn của tx_context::sender(ctx)
        let id = object::new(ctx);

        let gift = GiftBox {
            id,
            sender,
            message,
            is_opened: false,
            content: input_coin
        };

        transfer::public_transfer(gift, recipient);
    }

    // 2. Mở quà và Nhận tiền (Open and Claim)
    public fun open_and_claim(
        gift: GiftBox, 
        ctx: &mut TxContext
    ) {
        let recipient = ctx.sender();

        // Phá vỡ cấu trúc (Destructure) để lấy dữ liệu
        let GiftBox { 
            id, 
            sender, // Biến này được dùng ở dòng event::emit bên dưới
            message: _, 
            is_opened: _, 
            content 
        } = gift;

        // Proof of Impact: Ghi lại sự kiện
        event::emit(GiftOpenedEvent {
            gift_id: object::uid_to_inner(&id),
            sender: sender,   // Lỗi unused variable sẽ biến mất vì ta dùng ở đây
            recipient: recipient,
        });

        // Hủy ID hộp quà để lấy lại phí lưu trữ (storage rebate)
        object::delete(id);

        // Chuyển tiền cho người nhận
        transfer::public_transfer(content, recipient);
    }
}