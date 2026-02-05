// Utility để quản lý mapping giữa Google email và Sui wallet address

interface WalletMapping {
  [email: string]: string; // email -> wallet address
}

const STORAGE_KEY = 'google_wallet_mapping';

// Lưu mapping email -> wallet
export function linkWalletToEmail(email: string, walletAddress: string): void {
  const mappings = getWalletMappings();
  mappings[email] = walletAddress;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  console.log(`✅ Linked wallet ${walletAddress} to email ${email}`);
}

// Lấy tất cả mappings
export function getWalletMappings(): WalletMapping {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

// Kiểm tra email có linked với wallet này không
export function isWalletLinkedToEmail(email: string, walletAddress: string): boolean {
  const mappings = getWalletMappings();
  const linkedWallet = mappings[email];
  
  if (!linkedWallet) {
    // Chưa có mapping, tự động link
    linkWalletToEmail(email, walletAddress);
    return true;
  }
  
  return linkedWallet.toLowerCase() === walletAddress.toLowerCase();
}

// Lấy wallet address đã link với email
export function getLinkedWallet(email: string): string | null {
  const mappings = getWalletMappings();
  return mappings[email] || null;
}

// Xóa mapping
export function unlinkWallet(email: string): void {
  const mappings = getWalletMappings();
  delete mappings[email];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  console.log(`❌ Unlinked wallet from email ${email}`);
}
