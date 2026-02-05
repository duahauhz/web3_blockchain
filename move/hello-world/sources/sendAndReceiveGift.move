#[allow(lint(self_transfer))]
module hello_world::gifting {
    use std::string::{Self, String};
    use sui::coin::{Self as coin, Coin}; 
    use sui::sui::SUI;
    use sui::event;
    use sui::clock::{Clock};

    // ========== ERROR CODES ==========
    const EInvalidEmail: u64 = 1;
    const EGiftExpired: u64 = 2;
    const ENotRecipient: u64 = 3;
    const EGiftAlreadyOpened: u64 = 4;
    const ENotSender: u64 = 5;
    const EGiftNotExpired: u64 = 6;

    // ========== DATA STRUCTURES ==========
    
    // Enhanced GiftBox with email-based recipient and expiry
    #[allow(lint(coin_field))]
    public struct GiftBox has key, store {
        id: UID,
        sender: address,
        sender_email: String,
        recipient_email: String,  // Email thay cho address để tích hợp zkLogin
        message: String,
        is_opened: bool,
        content: Coin<SUI>,
        created_at: u64,
        expiry_timestamp: u64,  // Thời gian hết hạn (milliseconds)
    }

    // Capability để sponsor gas (Gas Station sẽ sử dụng)
    public struct GasStationCap has key, store {
        id: UID,
    }

    // ========== EVENTS ==========
    
    public struct GiftCreatedEvent has copy, drop {
        gift_id: ID,
        sender: address,
        recipient_email: String,
        amount: u64,
        expiry_timestamp: u64,
    }

    public struct GiftOpenedEvent has copy, drop {
        gift_id: ID,
        sender: address,
        recipient: address,
        recipient_email: String,
        amount: u64,
    }

    public struct GiftRejectedEvent has copy, drop {
        gift_id: ID,
        sender: address,
        recipient: address,
    }

    public struct GiftRefundedEvent has copy, drop {
        gift_id: ID,
        sender: address,
        amount: u64,
    }

    // ========== HELPER FUNCTIONS ==========

    // Kiểm tra định dạng email hợp lệ (basic validation)
    fun is_valid_email(email: &String): bool {
        let bytes = string::as_bytes(email);
        let len = vector::length(bytes);
        
        if (len < 5) return false;  // Tối thiểu: a@b.c
        
        let mut has_at = false;
        let mut has_dot_after_at = false;
        let mut at_position = 0;
        let mut i = 0;
        
        while (i < len) {
            let byte = *vector::borrow(bytes, i);
            
            if (byte == 64) {  // '@' character
                if (has_at) return false;  // Chỉ được có 1 @
                has_at = true;
                at_position = i;
            };
            
            if (has_at && byte == 46 && i > at_position) {  // '.' after @
                has_dot_after_at = true;
            };
            
            i = i + 1;
        };
        
        has_at && has_dot_after_at
    }

    // ========== MAIN FUNCTIONS ==========

    // Initialize Gas Station capability (chỉ admin gọi một lần)
    fun init(ctx: &mut TxContext) {
        let cap = GasStationCap {
            id: object::new(ctx),
        };
        transfer::public_transfer(cap, ctx.sender());
    }

    // 1. Gửi quà với email recipient
    public entry fun send_sui_gift_with_email(
        input_coin: Coin<SUI>, 
        message: String,
        sender_email: String,
        recipient_email: String,
        expiry_days: u64,  // Số ngày hết hạn (0 = không hết hạn)
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate emails
        assert!(is_valid_email(&sender_email), EInvalidEmail);
        assert!(is_valid_email(&recipient_email), EInvalidEmail);

        let sender = ctx.sender();
        let id = object::new(ctx);
        let amount = coin::value(&input_coin);
        let current_time = sui::clock::timestamp_ms(clock);
        
        // Calculate expiry (0 = no expiry)
        let expiry_timestamp = if (expiry_days == 0) {
            0
        } else {
            current_time + (expiry_days * 24 * 60 * 60 * 1000)
        };

        let gift = GiftBox {
            id,
            sender,
            sender_email,
            recipient_email,
            message,
            is_opened: false,
            content: input_coin,
            created_at: current_time,
            expiry_timestamp,
        };

        let gift_id = object::uid_to_inner(&gift.id);

        // Emit event for notification system
        event::emit(GiftCreatedEvent {
            gift_id,
            sender,
            recipient_email,
            amount,
            expiry_timestamp,
        });

        // Transfer as shared object để có thể sponsored transaction
        transfer::public_share_object(gift);
    }

    // 2. Mở quà với zkLogin verification (sponsored by Gas Station)
    public entry fun open_and_claim_with_zklogin(
        gift: &mut GiftBox,
        recipient_email_proof: String,  // Email từ zkLogin JWT
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let recipient = ctx.sender();
        
        // Verify email matches
        assert!(gift.recipient_email == recipient_email_proof, ENotRecipient);
        assert!(!gift.is_opened, EGiftAlreadyOpened);
        
        // Check expiry
        if (gift.expiry_timestamp > 0) {
            let current_time = sui::clock::timestamp_ms(clock);
            assert!(current_time <= gift.expiry_timestamp, EGiftExpired);
        };

        let amount = coin::value(&gift.content);
        gift.is_opened = true;

        // Emit event
        event::emit(GiftOpenedEvent {
            gift_id: object::uid_to_inner(&gift.id),
            sender: gift.sender,
            recipient,
            recipient_email: gift.recipient_email,
            amount,
        });

        // Extract coin và transfer
        let coin = coin::split(&mut gift.content, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }

    // 3. Từ chối quà và hoàn trả cho người gửi
    public entry fun reject_and_refund(
        gift: &mut GiftBox,
        recipient_email_proof: String,
        ctx: &mut TxContext
    ) {
        let recipient = ctx.sender();
        
        // Verify recipient
        assert!(gift.recipient_email == recipient_email_proof, ENotRecipient);
        assert!(!gift.is_opened, EGiftAlreadyOpened);

        let amount = coin::value(&gift.content);
        gift.is_opened = true;

        // Emit event
        event::emit(GiftRejectedEvent {
            gift_id: object::uid_to_inner(&gift.id),
            sender: gift.sender,
            recipient,
        });

        // Refund to sender
        let coin = coin::split(&mut gift.content, amount, ctx);
        transfer::public_transfer(coin, gift.sender);
    }

    // 4. Thu hồi quà đã hết hạn (chỉ người gửi)
    public entry fun reclaim_expired_gift(
        gift: &mut GiftBox,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        
        // Verify sender
        assert!(gift.sender == sender, ENotSender);
        assert!(!gift.is_opened, EGiftAlreadyOpened);
        
        // Check expired
        assert!(gift.expiry_timestamp > 0, EGiftNotExpired);
        let current_time = sui::clock::timestamp_ms(clock);
        assert!(current_time > gift.expiry_timestamp, EGiftNotExpired);

        let amount = coin::value(&gift.content);
        gift.is_opened = true;

        // Emit event
        event::emit(GiftRefundedEvent {
            gift_id: object::uid_to_inner(&gift.id),
            sender,
            amount,
        });

        // Refund to sender
        let coin = coin::split(&mut gift.content, amount, ctx);
        transfer::public_transfer(coin, sender);
    }

    // ========== LEGACY COMPATIBILITY ==========
    
    // Keep old function for backward compatibility
    public fun send_sui_gift(
        input_coin: Coin<SUI>, 
        message: String, 
        recipient: address, 
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let id = object::new(ctx);

        let gift = GiftBox {
            id,
            sender,
            sender_email: string::utf8(b"legacy@sender.com"),
            recipient_email: string::utf8(b"legacy@recipient.com"),
            message,
            is_opened: false,
            content: input_coin,
            created_at: 0,
            expiry_timestamp: 0,
        };

        transfer::public_transfer(gift, recipient);
    }

    // Old claim function
    public entry fun open_and_claim(
        gift: GiftBox, 
        ctx: &mut TxContext
    ) {
        let recipient = ctx.sender();

        let GiftBox { 
            id, 
            sender,
            sender_email: _,
            recipient_email: _,
            message: _, 
            is_opened: _, 
            content,
            created_at: _,
            expiry_timestamp: _,
        } = gift;

        event::emit(GiftOpenedEvent {
            gift_id: object::uid_to_inner(&id),
            sender: sender,
            recipient: recipient,
            recipient_email: string::utf8(b"legacy@recipient.com"),
            amount: coin::value(&content),
        });

        object::delete(id);
        transfer::public_transfer(content, recipient);
    }
}