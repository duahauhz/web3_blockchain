import { useState } from "react";
import { HomePage } from "./HomePage";
import { CreateGift } from "./CreateGift";
import { ClaimGift } from "./ClaimGift";
import { TestData } from "./TestData";
import { motion, AnimatePresence } from "framer-motion";

type Page = 'home' | 'create' | 'claim' | 'success';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [createdGiftId, setCreatedGiftId] = useState<string | null>(null);
  const [showTestData, setShowTestData] = useState(false);

  const handleGiftCreated = (id: string) => {
    setCreatedGiftId(id);
    setCurrentPage('success');
  };

  const pageVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  };

  const pageTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <motion.div
            key="home"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <HomePage onNavigate={setCurrentPage} />
          </motion.div>
        );
      case 'create':
        return (
          <motion.div
            key="create"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <CreateGift
              onBack={() => setCurrentPage('home')}
              onCreated={handleGiftCreated}
            />
          </motion.div>
        );
      case 'claim':
        return (
          <motion.div
            key="claim"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <ClaimGift onBack={() => setCurrentPage('home')} />
          </motion.div>
        );
      case 'success':
        return (
          <motion.div
            key="success"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
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
            
            {/* Floating geometric shapes */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`shape-${i}`}
                animate={{
                  y: [0, -30, 0],
                  rotate: [0, 180, 360],
                  opacity: [0.08, 0.18, 0.08],
                }}
                transition={{
                  duration: 8 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
                style={{
                  position: "absolute",
                  top: `${10 + i * 12}%`,
                  left: `${5 + (i % 2) * 85}%`,
                  width: `${50 + i * 7}px`,
                  height: `${50 + i * 7}px`,
                  borderRadius: i % 2 === 0 ? "50%" : "15%",
                  border: `3px solid ${i % 2 === 0 ? "rgba(255, 107, 53, 0.25)" : "rgba(247, 147, 30, 0.25)"}`,
                }}
              />
            ))}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                borderRadius: "30px",
                padding: "3.5rem",
                maxWidth: "700px",
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
                🎉
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
                Quà đã được gửi!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ color: "#666", fontSize: "1.2rem", marginBottom: "2.5rem", fontWeight: 500 }}
              >
                Chia sẻ <strong style={{ color: "#ff6b35" }}>Gift ID</strong> này với người nhận:
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  background: "linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%)",
                  padding: "2rem",
                  borderRadius: "20px",
                  marginBottom: "2.5rem",
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                  fontSize: "1rem",
                  border: "3px solid #ff6b35",
                  fontWeight: 600,
                  color: "#ff6b35",
                }}
              >
                {createdGiftId}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    navigator.clipboard.writeText(createdGiftId || "");
                    alert("Đã copy Gift ID!");
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
                  📋 Copy Gift ID
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
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="default"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <HomePage onNavigate={setCurrentPage} />
          </motion.div>
        );
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {renderPage()}
      </AnimatePresence>
      
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