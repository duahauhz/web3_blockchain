// 🧪 DEBUG SCRIPT - Paste vào Console của http://localhost:5173

console.clear();
console.log('%c🧪 DEBUG SCRIPT STARTED', 'background: #ff6b35; color: white; padding: 10px; font-size: 16px; font-weight: bold;');

// Test 1: Check if Router is working
console.log('\n--- Test 1: Router Check ---');
console.log('Current URL:', window.location.href);
console.log('Pathname:', window.location.pathname);
console.log('Search:', window.location.search);

// Test 2: Parse query parameter
const params = new URLSearchParams(window.location.search);
const id = params.get('id');
console.log('\n--- Test 2: Query Parameter ---');
console.log('ID from URL:', id || '(không có)');

if (id) {
    console.log('%c✅ Query parameter hoạt động!', 'color: green; font-weight: bold;');
} else {
    console.log('%c⚠️ Không có query parameter', 'color: orange; font-weight: bold;');
    console.log('Nếu bạn đang ở trang claim, hãy thử URL: /claim-lixi?id=0xtest123');
}

// Test 3: Generate sample link
console.log('\n--- Test 3: Generate Sample Link ---');
const sampleId = '0xabc123def456';
const claimLink = `${window.location.origin}/claim-lixi?id=${sampleId}`;
console.log('Sample Claim Link:', claimLink);
console.log('%cCopy link này và paste vào address bar để test:', 'color: blue; font-weight: bold;');
console.log(claimLink);

// Test 4: Check React components
console.log('\n--- Test 4: React Components ---');
const rootElement = document.getElementById('root');
if (rootElement) {
    console.log('✅ Root element exists');
    console.log('Children count:', rootElement.children.length);
    if (rootElement.children.length === 0) {
        console.error('❌ Root element is empty! App không render!');
    }
} else {
    console.error('❌ Root element không tồn tại!');
}

// Test 5: Check button existence (after a delay)
setTimeout(() => {
    console.log('\n--- Test 5: Button Check (after 1s) ---');
    
    const createLixiButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Tạo Lì Xì Nhóm') || btn.textContent.includes('🧧')
    );
    
    if (createLixiButton) {
        console.log('%c✅ Nút "Tạo Lì Xì Nhóm" tìm thấy!', 'color: green; font-weight: bold;');
        console.log('Button text:', createLixiButton.textContent);
        console.log('Click vào nút này để test:', createLixiButton);
    } else {
        console.log('%c⚠️ Không tìm thấy nút "Tạo Lì Xì Nhóm"', 'color: orange; font-weight: bold;');
        console.log('Có thể bạn chưa connect wallet, hoặc đang ở trang khác');
        
        // List all buttons
        const allButtons = document.querySelectorAll('button');
        console.log('Tất cả buttons trên trang:');
        allButtons.forEach((btn, i) => {
            console.log(`  ${i + 1}. ${btn.textContent.substring(0, 50)}`);
        });
    }
}, 1000);

// Test 6: Monitor navigation
console.log('\n--- Test 6: Navigation Monitor ---');
console.log('Sẽ theo dõi khi bạn click vào nút...');

// Override history.pushState to monitor navigation
const originalPushState = history.pushState;
history.pushState = function(...args) {
    console.log('%c🔄 Navigation detected:', 'color: purple; font-weight: bold;', args);
    return originalPushState.apply(this, args);
};

console.log('\n%c📋 HƯỚNG DẪN:', 'background: #228be6; color: white; padding: 8px; font-size: 14px; font-weight: bold;');
console.log('1. Connect Sui Wallet (nếu chưa)');
console.log('2. Tìm nút "🧧 Tạo Lì Xì Nhóm" và click');
console.log('3. Điền form và submit');
console.log('4. Sau khi tạo thành công, kiểm tra:');
console.log('   - Có chuyển sang trang Success không?');
console.log('   - Có hiển thị link với ?id= không?');
console.log('   - Click Copy Link có alert không?');
console.log('\n5. Copy link và paste vào tab mới');
console.log('6. Check xem ID có tự động điền vào form không');
console.log('\n%c⚠️ Nếu gặp lỗi màu ĐỎ, hãy copy và gửi cho tôi!', 'color: red; font-weight: bold; font-size: 14px;');

// Helper function to test link generation
window.testLinkGeneration = function(giftId) {
    const link = `${window.location.origin}/claim-lixi?id=${giftId}`;
    console.log('\n%c🔗 Test Link Generated:', 'background: #28a745; color: white; padding: 5px;');
    console.log(link);
    console.log('\nCopy đoạn này vào tab mới:');
    console.log(link);
    return link;
};

console.log('\n%c💡 TIP: Gọi testLinkGeneration("0xYourID") để test generate link', 'color: blue; font-style: italic;');
console.log('Ví dụ: testLinkGeneration("0xabc123")');

console.log('\n%c✅ DEBUG SCRIPT READY', 'background: #28a745; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
