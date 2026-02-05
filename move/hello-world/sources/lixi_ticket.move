/// Module LixiTicket - NFT Ticket để claim Lì Xì
/// Mỗi ticket chỉ dùng được 1 lần và bị burn sau khi claim
module hello_world::lixi_ticket {
    use std::string::{Self, String};
    use sui::event;
    use sui::url::{Self, Url};

    // ========== ERROR CODES ==========
    const ENotTicketOwner: u64 = 1;
    const ETicketNotForThisLixi: u64 = 2;
    const ETicketAlreadyUsed: u64 = 3;

    // ========== DATA STRUCTURES ==========
    
    /// NFT Ticket để claim Lì Xì
    /// Mỗi ticket gắn với 1 Lixi ID cụ thể
    public struct LixiTicket has key, store {
        id: UID,
        /// ID của Lì Xì mà ticket này dùng để claim
        lixi_id: ID,
        /// Số thứ tự ticket (1, 2, 3...)
        ticket_number: u64,
        /// Tổng số ticket được mint
        total_tickets: u64,
        /// Người tạo Lì Xì
        creator: address,
        /// Lời chúc trên ticket
        message: String,
        /// URL hình ảnh ticket (optional)
        image_url: Url,
        /// Thời gian tạo
        created_at: u64,
    }

    // ========== EVENTS ==========
    
    public struct TicketMintedEvent has copy, drop {
        ticket_id: ID,
        lixi_id: ID,
        ticket_number: u64,
        total_tickets: u64,
        creator: address,
        recipient: address,
    }

    public struct TicketBurnedEvent has copy, drop {
        ticket_id: ID,
        lixi_id: ID,
        ticket_number: u64,
        burned_by: address,
    }

    // ========== MAIN FUNCTIONS ==========

    /// Mint ticket và transfer cho recipient
    /// Được gọi bởi sui_lixi module khi tạo Lì Xì
    public fun mint_ticket(
        lixi_id: ID,
        ticket_number: u64,
        total_tickets: u64,
        creator: address,
        recipient: address,
        message: String,
        image_url_str: String,
        created_at: u64,
        ctx: &mut TxContext
    ): LixiTicket {
        let ticket_uid = object::new(ctx);
        let ticket_id = object::uid_to_inner(&ticket_uid);

        // Parse image URL
        let image_url = if (string::length(&image_url_str) > 0) {
            url::new_unsafe(string::to_ascii(image_url_str))
        } else {
            // Default Lì Xì image
            url::new_unsafe_from_bytes(b"https://i.imgur.com/8kQZnVL.png")
        };

        let ticket = LixiTicket {
            id: ticket_uid,
            lixi_id,
            ticket_number,
            total_tickets,
            creator,
            message,
            image_url,
            created_at,
        };

        // Emit event
        event::emit(TicketMintedEvent {
            ticket_id,
            lixi_id,
            ticket_number,
            total_tickets,
            creator,
            recipient,
        });

        ticket
    }

    /// Verify ticket thuộc về đúng Lì Xì và burn nó
    /// Trả về true nếu verify thành công
    public fun verify_and_burn(
        ticket: LixiTicket,
        expected_lixi_id: ID,
        ctx: &mut TxContext
    ): bool {
        // Verify ticket thuộc về đúng Lì Xì
        assert!(ticket.lixi_id == expected_lixi_id, ETicketNotForThisLixi);

        let ticket_id = object::uid_to_inner(&ticket.id);
        let lixi_id = ticket.lixi_id;
        let ticket_number = ticket.ticket_number;
        let burner = ctx.sender();

        // Emit burn event
        event::emit(TicketBurnedEvent {
            ticket_id,
            lixi_id,
            ticket_number,
            burned_by: burner,
        });

        // Burn ticket
        let LixiTicket { 
            id, 
            lixi_id: _, 
            ticket_number: _, 
            total_tickets: _,
            creator: _,
            message: _,
            image_url: _,
            created_at: _,
        } = ticket;
        object::delete(id);

        true
    }

    // ========== VIEW FUNCTIONS ==========

    /// Get ticket info
    public fun get_ticket_info(ticket: &LixiTicket): (ID, u64, u64, address) {
        (ticket.lixi_id, ticket.ticket_number, ticket.total_tickets, ticket.creator)
    }

    /// Get lixi_id của ticket
    public fun get_lixi_id(ticket: &LixiTicket): ID {
        ticket.lixi_id
    }

    /// Get ticket number
    public fun get_ticket_number(ticket: &LixiTicket): u64 {
        ticket.ticket_number
    }
}
