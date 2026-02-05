import { useState, useEffect } from "react";
import { Router } from "./Router";
import { GoogleCallback } from "./GoogleCallback";
import { TestData } from "./TestData";
import { motion } from "framer-motion";
import { DebugAuth } from "./DebugAuth";
import { TestEncoding } from "./TestEncoding";

type Page = 'home' | 'create' | 'claim' | 'gift-manage' | 'create-lixi' | 'claim-lixi' | 'lixi-manage' | 'transactions' | 'success' | 'debug-auth' | 'test-encoding';
type GiftType = 'gift' | 'lixi';

function App() {
  // Check if this is Google OAuth callback page
  if (window.location.pathname === '/auth/google/callback') {
    return <GoogleCallback />;
  }

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [createdGiftId, setCreatedGiftId] = useState<string | null>(null);
  const [giftType, setGiftType] = useState<GiftType>('gift');
  const [showTestData, setShowTestData] = useState(false);
  const showDebugPanel = import.meta.env.DEV && import.meta.env.VITE_SHOW_DEBUG_PANEL === 'true';

  // Ensure homepage on fresh load unless there's a valid hash route
  useEffect(() => {
    const hash = window.location.hash;
    const validRoutes = ['/claim', '/claim-lixi', '/gift-manage', '/lixi-manage', '/transactions', '/create', '/create-lixi', '/debug-auth', '/test-encoding'];
    const hasValidRoute = validRoutes.some(route => hash.includes(route));
    
    if (!hasValidRoute && currentPage !== 'success') {
      setCurrentPage('home');
      window.location.hash = '';
    }
    
    // Handle special routes
    if (hash === '#/debug-auth') {
      setCurrentPage('debug-auth');
    }
    if (hash === '#/test-encoding') {
      setCurrentPage('test-encoding');
    }
  }, []);

  const handleGiftCreated = (id: string, type: GiftType = 'gift') => {
    console.log('🎯 handleGiftCreated called!');
    console.log('Gift ID:', id);
    console.log('Type:', type);
    setCreatedGiftId(id);
    setGiftType(type);
    setCurrentPage('success');
    console.log('✅ State updated - should show Success page now');
  };

  if (currentPage === 'success') {
    const claimRoute = giftType === 'lixi' ? 'claim-lixi' : 'claim';
    const baseUrl = window.location.origin + window.location.pathname;
    const claimLink = `${baseUrl}#/${claimRoute}?id=${createdGiftId}`;
    
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(to bottom, #ffffff 0%, #fef9f6 100%)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        {/* Animated Background Particles */}
        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              x: [0, Math.random() * 150 - 75, 0],
              y: [0, Math.random() * 150 - 75, 0],
              opacity: [0.15, 0.35, 0.15],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
            style={{
              position: "absolute",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: i % 3 === 0 ? "#ff6b35" : i % 3 === 1 ? "#f7931e" : "#ffa500",
              boxShadow: `0 0 18px ${i % 3 === 0 ? "#ff6b35" : i % 3 === 1 ? "#f7931e" : "#ffa500"}`,
              filter: "blur(0.5px)",
            }}
          />
        ))}
        
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "30px",
            padding: "3.5rem",
            maxWidth: "700px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 30px 100px rgba(255, 107, 53, 0.35)",
            border: "3px solid rgba(255, 107, 53, 0.3)",
            backdropFilter: "blur(10px)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, type: "spring" }}
            style={{ fontSize: "6rem", marginBottom: "1.5rem" }}
          >
            {giftType === 'lixi' ? '🧧' : '🎉'}
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              color: "#ff6b35",
              fontSize: "3rem",
              fontWeight: 900,
              marginBottom: "1.5rem",
            }}
          >
            {giftType === 'lixi' ? '🧧 Lì Xì Đã Tạo!' : '🎁 Quà Đã Gửi!'}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ color: "#666", fontSize: "1.2rem", marginBottom: "1.5rem", fontWeight: 500 }}
          >
            Chia sẻ link này để người khác nhận {giftType === 'lixi' ? 'lì xì' : 'quà'}:
          </motion.p>
          
          {/* Link Claim Đầy Đủ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              background: "linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%)",
              padding: "2rem",
              borderRadius: "20px",
              marginBottom: "1.5rem",
              wordBreak: "break-all",
              fontSize: "0.95rem",
              border: "3px solid #ff6b35",
              fontWeight: 600,
              color: "#ff6b35",
            }}
          >
            {claimLink}
          </motion.div>
          
          {/* Gift/Lixi ID */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ color: "#999", fontSize: "0.9rem", marginBottom: "2rem" }}
          >
            <strong style={{ color: "#666" }}>ID:</strong>{' '}
            <span style={{ fontFamily: "monospace" }}>{createdGiftId}</span>
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                navigator.clipboard.writeText(claimLink);
                alert("✅ Đã copy link nhận " + (giftType === 'lixi' ? 'lì xì' : 'quà') + "!");
              }}
              style={{
                background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                color: "white",
                padding: "1.2rem 2.5rem",
                fontSize: "1.1rem",
                fontWeight: 800,
                borderRadius: "15px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 10px 30px rgba(255, 107, 53, 0.4)",
              }}
            >
              🔗 Copy Link Nhận {giftType === 'lixi' ? 'Lì Xì' : 'Quà'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage('home')}
              style={{
                background: "white",
                color: "#ff6b35",
                padding: "1.2rem 2.5rem",
                fontSize: "1.1rem",
                fontWeight: 800,
                borderRadius: "15px",
                border: "3px solid #ff6b35",
                cursor: "pointer",
              }}
            >
              🏠 Về trang chủ
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Debug Panel - toggled bằng biến môi trường */}
      {showDebugPanel && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 9999,
          fontFamily: 'monospace',
        }}>
          <div>Current Page: <strong>{currentPage}</strong></div>
          <div>Gift Type: <strong>{giftType}</strong></div>
          <div>Gift ID: <strong>{createdGiftId ? createdGiftId.slice(0, 10) + '...' : 'null'}</strong></div>
        </div>
      )}
      
      {currentPage === 'debug-auth' ? (
        <DebugAuth />
      ) : currentPage === 'test-encoding' ? (
        <TestEncoding />
      ) : (
        <Router 
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onGiftCreated={handleGiftCreated}
        />
      )}
      
      {/* Floating Test Data Button */}
      <motion.button
        whileHover={{ scale: 1.05, y: -3 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowTestData(true)}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
          color: "white",
          padding: "1rem 1.5rem",
          borderRadius: "50px",
          border: "none",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: "1rem",
          boxShadow: "0 10px 30px rgba(255, 107, 53, 0.4)",
          zIndex: 999,
        }}
      >
        📋 Test Data
      </motion.button>

      {showTestData && <TestData onClose={() => setShowTestData(false)} />}
    </>
  );
}

export default App;
