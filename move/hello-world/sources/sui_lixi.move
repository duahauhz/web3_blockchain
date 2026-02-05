module hello_world::sui_lixi {
    use std::string::String;
    use sui::coin::{Self as coin, Coin};
    use sui::sui::SUI;
    use sui::event;
    use sui::clock::{Clock};
    use sui::table::{Self, Table};
    use sui::hash;
    use sui::bcs;

    // ========== ERROR CODES ==========
    const ELixiExpired: u64 = 1;
    const ELixiEmpty: u64 = 2;
    const EAlreadyClaimed: u64 = 3;
    const ENotCreator: u64 = 4;
    const ELixiNotExpired: u64 = 5;
    const EInvalidAmount: u64 = 6;
    const ELixiLocked: u64 = 7;     // Lì xì đã bị khóa
    const EWrongPassword: u64 = 8;  // Sai mật khẩu

    // ========== DISTRIBUTION MODES ==========
    const MODE_EQUAL: u8 = 0;      // Chia đều
    const MODE_RANDOM: u8 = 1;     // Random (may mắn)

    // ========== DATA STRUCTURES ==========
    
    // Shared Object - Bao Lì Xì có thể được nhiều người claim
    #[allow(lint(coin_field))]
    public struct LixiEnvelope has key {
        id: UID,
        creator: address,
        creator_email: String,
        total_amount: u64,          // Tổng tiền ban đầu
        remaining_amount: u64,      // Số tiền còn lại
        max_recipients: u64,        // Số người nhận tối đa
        claimed_count: u64,         // Số người đã nhận
        distribution_mode: u8,      // MODE_EQUAL hoặc MODE_RANDOM
        min_amount: u64,            // Số tiền tối thiểu mỗi phần (cho random mode)
        max_amount: u64,            // Số tiền tối đa mỗi phần (cho random mode)
        message: String,
        balance: Coin<SUI>,         // Quỹ tiền
        claimers: Table<address, ClaimRecord>,  // Danh sách người đã nhận
        created_at: u64,
        expiry_timestamp: u64,
        is_active: bool,
        secret_hash: vector<u8>,    // Hash của mật khẩu (blake2b256)
        has_password: bool,         // Có dùng mật khẩu không
    }

    // Record của mỗi người claim
    public struct ClaimRecord has store {
        claimer: address,
        email: String,
        amount: u64,
        timestamp: u64,
    }

    // ========== EVENTS ==========
    
    public struct LixiCreatedEvent has copy, drop {
        lixi_id: ID,
        creator: address,
        total_amount: u64,
        max_recipients: u64,
        distribution_mode: u8,
        expiry_timestamp: u64,
    }

    public struct LixiClaimedEvent has copy, drop {
        lixi_id: ID,
        creator: address,
        claimer: address,
        claimer_email: String,
        amount: u64,
        claimed_count: u64,
        remaining_amount: u64,
    }

    public struct LixiLockedEvent has copy, drop {
        lixi_id: ID,
        creator: address,
        timestamp: u64,
    }

    public struct LixiCompletedEvent has copy, drop {
        lixi_id: ID,
        total_distributed: u64,
        total_claimers: u64,
    }

    public struct LixiRefundedEvent has copy, drop {
        lixi_id: ID,
        creator: address,
        refunded_amount: u64,
    }

    // ========== HELPER FUNCTIONS ==========

    // Generate pseudo-random number using blockchain data
    fun generate_random_amount(
        lixi_id: &UID,
        claimer: address,
        min: u64,
        max: u64,
        clock: &Clock,
        ctx: &TxContext
    ): u64 {
        let timestamp = sui::clock::timestamp_ms(clock);
        let epoch = ctx.epoch();
        
        // Combine multiple sources for randomness
        let mut data = vector::empty<u8>();
        vector::append(&mut data, bcs::to_bytes(lixi_id));
        vector::append(&mut data, bcs::to_bytes(&claimer));
        vector::append(&mut data, bcs::to_bytes(&timestamp));
        vector::append(&mut data, bcs::to_bytes(&epoch));
        
        let hash_bytes = hash::blake2b256(&data);
        
        // Convert first 8 bytes to u64
        let mut random_value: u64 = 0;
        let mut i = 0;
        while (i < 8) {
            random_value = (random_value << 8) | (*vector::borrow(&hash_bytes, i) as u64);
            i = i + 1;
        };
        
        // Map to range [min, max]
        let range = max - min;
        min + (random_value % range)
    }

    // ========== MAIN FUNCTIONS ==========

    // 1. Tạo bao lì xì (với mật khẩu bảo vệ)
    public entry fun create_lixi(
        input_coin: Coin<SUI>,
        creator_email: String,
        max_recipients: u64,
        distribution_mode: u8,
        min_amount: u64,      // Chỉ dùng cho random mode
        max_amount: u64,      // Chỉ dùng cho random mode
        message: String,
        password: String,     // Mật khẩu bảo vệ (rỗng = không cần mật khẩu)
        expiry_hours: u64,    // Số giờ hết hạn
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let total_amount = coin::value(&input_coin);
        
        // Validate
        assert!(total_amount > 0, EInvalidAmount);
        assert!(max_recipients > 0, EInvalidAmount);
        
        if (distribution_mode == MODE_RANDOM) {
            assert!(min_amount > 0 && max_amount >= min_amount, EInvalidAmount);
            // Ensure có đủ tiền cho trường hợp xấu nhất (tất cả nhận min_amount)
            assert!(total_amount >= min_amount * max_recipients, EInvalidAmount);
        };

        let creator = ctx.sender();
        let lixi_id = object::new(ctx);
        let current_time = sui::clock::timestamp_ms(clock);
        let expiry_timestamp = current_time + (expiry_hours * 60 * 60 * 1000);

        // Hash password nếu có
        let password_bytes = std::string::as_bytes(&password);
        let has_password = vector::length(password_bytes) > 0;
        let secret_hash = if (has_password) {
            hash::blake2b256(password_bytes)
        } else {
            vector::empty<u8>()
        };

        let lixi = LixiEnvelope {
            id: lixi_id,
            creator,
            creator_email,
            total_amount,
            remaining_amount: total_amount,
            max_recipients,
            claimed_count: 0,
            distribution_mode,
            min_amount,
            max_amount,
            message,
            balance: input_coin,
            claimers: table::new(ctx),
            created_at: current_time,
            expiry_timestamp,
            is_active: true,
            secret_hash,
            has_password,
        };

        let id_inner = object::uid_to_inner(&lixi.id);

        // Emit event
        event::emit(LixiCreatedEvent {
            lixi_id: id_inner,
            creator,
            total_amount,
            max_recipients,
            distribution_mode,
            expiry_timestamp,
        });

        // Share object để mọi người có thể claim
        transfer::share_object(lixi);
    }

    // 2. Claim lì xì (mở bao) - cần nhập đúng mật khẩu
    public entry fun claim_lixi(
        lixi: &mut LixiEnvelope,
        claimer_email: String,
        password: String,     // Mật khẩu (rỗng nếu không có password)
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let claimer = ctx.sender();
        
        // Check if locked
        assert!(lixi.is_active, ELixiLocked);
        
        // Verify password nếu có
        if (lixi.has_password) {
            let password_bytes = std::string::as_bytes(&password);
            let input_hash = hash::blake2b256(password_bytes);
            assert!(input_hash == lixi.secret_hash, EWrongPassword);
        };
        
        // Check expiry
        let current_time = sui::clock::timestamp_ms(clock);
        assert!(current_time <= lixi.expiry_timestamp, ELixiExpired);
        
        // Check not claimed before
        assert!(!table::contains(&lixi.claimers, claimer), EAlreadyClaimed);
        
        // Check còn chỗ
        assert!(lixi.claimed_count < lixi.max_recipients, ELixiEmpty);
        
        // Check còn tiền
        assert!(lixi.remaining_amount > 0, ELixiEmpty);

        // Calculate amount to give
        let amount = if (lixi.distribution_mode == MODE_EQUAL) {
            // Equal distribution
            let remaining_people = lixi.max_recipients - lixi.claimed_count;
            lixi.remaining_amount / remaining_people
        } else {
            // Random distribution
            let random_amount = generate_random_amount(
                &lixi.id,
                claimer,
                lixi.min_amount,
                lixi.max_amount,
                clock,
                ctx
            );
            
            // Ensure không vượt quá số tiền còn lại
            if (random_amount > lixi.remaining_amount) {
                lixi.remaining_amount
            } else {
                random_amount
            }
        };

        // Ensure amount hợp lý
        let final_amount = if (amount > lixi.remaining_amount) {
            lixi.remaining_amount
        } else if (amount == 0) {
            1 // Tối thiểu 1 MIST
        } else {
            amount
        };

        // Update state
        lixi.claimed_count = lixi.claimed_count + 1;
        lixi.remaining_amount = lixi.remaining_amount - final_amount;

        // Record claim
        let record = ClaimRecord {
            claimer,
            email: claimer_email,
            amount: final_amount,
            timestamp: current_time,
        };
        table::add(&mut lixi.claimers, claimer, record);

        // Emit event
        event::emit(LixiClaimedEvent {
            lixi_id: object::uid_to_inner(&lixi.id),
            creator: lixi.creator,
            claimer,
            claimer_email,
            amount: final_amount,
            claimed_count: lixi.claimed_count,
            remaining_amount: lixi.remaining_amount,
        });

        // Transfer coin
        let coin = coin::split(&mut lixi.balance, final_amount, ctx);
        transfer::public_transfer(coin, claimer);

        // Check if completed
        if (lixi.claimed_count >= lixi.max_recipients || lixi.remaining_amount == 0) {
            lixi.is_active = false;
            
            event::emit(LixiCompletedEvent {
                lixi_id: object::uid_to_inner(&lixi.id),
                total_distributed: lixi.total_amount - lixi.remaining_amount,
                total_claimers: lixi.claimed_count,
            });
        };
    }

    // 3. Thu hồi lì xì đã hết hạn hoặc đã khóa (chỉ creator)
    public entry fun reclaim_expired_lixi(
        lixi: &mut LixiEnvelope,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = ctx.sender();
        
        // Verify creator
        assert!(lixi.creator == caller, ENotCreator);
        
        // Check if expired OR locked
        let current_time = sui::clock::timestamp_ms(clock);
        let is_expired = current_time > lixi.expiry_timestamp;
        let is_locked = !lixi.is_active;
        assert!(is_expired || is_locked, ELixiNotExpired);
        
        // Get remaining amount
        let remaining = lixi.remaining_amount;
        
        if (remaining > 0) {
            lixi.remaining_amount = 0;
            lixi.is_active = false;

            // Emit event
            event::emit(LixiRefundedEvent {
                lixi_id: object::uid_to_inner(&lixi.id),
                creator: caller,
                refunded_amount: remaining,
            });

            // Refund to creator
            let coin = coin::split(&mut lixi.balance, remaining, ctx);
            transfer::public_transfer(coin, caller);
        };
    }

    // 4. Khoá lì xì (chỉ creator)
    public entry fun lock_lixi(
        lixi: &mut LixiEnvelope,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = ctx.sender();
        assert!(lixi.creator == caller, ENotCreator);

        lixi.is_active = false;

        event::emit(LixiLockedEvent {
            lixi_id: object::uid_to_inner(&lixi.id),
            creator: caller,
            timestamp: sui::clock::timestamp_ms(clock),
        });
    }

    // ========== VIEW FUNCTIONS ==========
    
    // Get lixi stats
    public fun get_lixi_info(lixi: &LixiEnvelope): (u64, u64, u64, u64, bool, bool) {
        (
            lixi.total_amount,
            lixi.remaining_amount,
            lixi.claimed_count,
            lixi.max_recipients,
            lixi.is_active,
            lixi.has_password  // Trả về thêm thông tin có password không
        )
    }

    // Check if lixi has password protection
    public fun is_password_protected(lixi: &LixiEnvelope): bool {
        lixi.has_password
    }

    // Check if address has claimed
    public fun has_claimed(lixi: &LixiEnvelope, addr: address): bool {
        table::contains(&lixi.claimers, addr)
    }
}
