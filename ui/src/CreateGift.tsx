import { Transaction } from "@mysten/sui/transactions";
import { Box, Button, Container, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, ArrowLeft, Send, Sparkles, Package, User, MessageCircle, Wallet } from "lucide-react";
import ClipLoader from "react-spinners/ClipLoader";

interface CreateGiftProps {
  onBack: () => void;
  onCreated: (id: string) => void;
}

export function CreateGift({ onBack, onCreated }: CreateGiftProps) {
  const packageId = useNetworkVariable("helloWorldPackageId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [waitingForTxn, setWaitingForTxn] = useState(false);
  const [error, setError] = useState("");

  const handleSendGift = () => {
    if (!recipient || !amount || !message) {
      setError("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Số lượng SUI không hợp lệ!");
      return;
    }

    setError("");
    setWaitingForTxn(true);

    const tx = new Transaction();
    
    const amountInMist = Math.floor(amountNum * 1_000_000_000);
    const [coin] = tx.splitCoins(tx.gas, [amountInMist]);

    tx.moveCall({
      target: `${packageId}::gifting::send_sui_gift`,
      arguments: [
        coin,
        tx.pure.string(message),
        tx.pure.address(recipient),
      ],
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          suiClient
            .waitForTransaction({ 
              digest: result.digest, 
              options: { showEffects: true, showObjectChanges: true } 
            })
            .then((txResult) => {
              const createdObjects = txResult.objectChanges?.filter(
                (obj) => obj.type === "created"
              );
              
              if (createdObjects && createdObjects.length > 0) {
                const giftBoxId = (createdObjects[0] as any).objectId;
                onCreated(giftBoxId);
              }
              setWaitingForTxn(false);
            })
            .catch((err) => {
              console.error(err);
              setError("Giao dịch thất bại. Vui lòng thử lại!");
              setWaitingForTxn(false);
            });
        },
        onError: (err) => {
          console.error("Error details:", err);
          console.error("Error message:", err.message);
          console.error("Error stack:", err.stack);
          
          let errorMessage = "Có lỗi xảy ra. ";
          
          if (err.message && (err.message.includes("No valid gas coins") || err.message.includes("Insufficient"))) {
            errorMessage = "❌ Ví không có SUI! Vui lòng:\n\n1️⃣ Click nút 'Lấy Testnet SUI' ở góc trên\n2️⃣ Hoặc truy cập: https://faucet.sui.io\n3️⃣ Paste địa chỉ ví và lấy SUI miễn phí";
          } else if (err.message && err.message.includes("Invalid")) {
            errorMessage = "Địa chỉ người nhận không hợp lệ!";
          } else if (err.message) {
            errorMessage += err.message;
          } else {
            errorMessage += "Vui lòng kiểm tra số dư và thử lại!";
          }
          
          setError(errorMessage);
          setWaitingForTxn(false);
        },
      }
    );
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #ffffff 0%, #fef9f6 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated Background Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            x: [0, Math.random() * 200 - 100, 0],
            y: [0, Math.random() * 200 - 100, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
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
            boxShadow: `0 0 15px ${i % 3 === 0 ? "#ff6b35" : i % 3 === 1 ? "#f7931e" : "#ffa500"}`,
            filter: "blur(1px)",
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
            opacity: [0.05, 0.15, 0.05],
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
            width: `${40 + i * 5}px`,
            height: `${40 + i * 5}px`,
            borderRadius: i % 2 === 0 ? "50%" : "15%",
            border: `2px solid ${i % 2 === 0 ? "#ff6b35" : "#f7931e"}`,
          }}
        />
      ))}

      <Container size="3" py="6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="soft"
            size="3"
            onClick={onBack}
            style={{
              color: "#ff6b35",
              background: "rgba(255, 107, 53, 0.1)",
              marginBottom: "2rem",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={20} />
            Quay lại
          </Button>
        </motion.div>

        <Flex direction="column" align="center" gap="6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", position: "relative" }}
          >
            {/* Glow ring around icon */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -80%)",
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255, 107, 53, 0.4) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ position: "relative", zIndex: 1 }}
            >
              <Box style={{
                display: "inline-flex",
                background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                padding: "2rem",
                borderRadius: "30px",
                boxShadow: "0 20px 60px rgba(255, 107, 53, 0.35), inset 0 1px 0 rgba(255,255,255,0.4)",
                border: "3px solid rgba(255, 255, 255, 0.2)",
              }}>
                <Gift size={80} color="white" strokeWidth={2.5} />
              </Box>
            </motion.div>
            
            <Heading size="8" mt="5" mb="2" style={{ 
              background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 900,
              fontSize: "2.5rem",
            }}>
              Tạo hộp quà đặc biệt ✨
            </Heading>
            <Text size="3" style={{ color: "#666", fontWeight: 500, maxWidth: "500px", margin: "0 auto" }}>
              Gửi SUI token kèm lời nhắn ý nghĩa đến người thân yêu của bạn
            </Text>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ width: "100%", maxWidth: "700px" }}
          >
            <Box
              p="8"
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                borderRadius: "35px",
                boxShadow: "0 30px 90px rgba(0, 0, 0, 0.12), 0 10px 30px rgba(255, 107, 53, 0.15)",
                backdropFilter: "blur(40px)",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                position: "relative",
              }}
            >
              <Flex direction="column" gap="6">
                {/* 3D Gift Preview Section */}
                <Box
                  style={{
                    padding: "2.5rem",
                    background: "linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(247, 147, 30, 0.08) 100%)",
                    borderRadius: "25px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                    border: "2px dashed rgba(255, 107, 53, 0.3)",
                  }}
                >
                  <motion.div
                    animate={{
                      rotateY: [0, 360],
                      y: [0, -15, 0],
                    }}
                    transition={{
                      rotateY: { duration: 10, repeat: Infinity, ease: "linear" },
                      y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    }}
                    style={{ perspective: "1000px" }}
                  >
                    <Package size={100} color="#ff6b35" strokeWidth={1.5} />
                  </motion.div>
                  
                  {/* Floating particles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={`float-${i}`}
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0.3, 0.8, 0.3],
                        scale: [1, 1.3, 1],
                      }}
                      transition={{
                        duration: 2 + i * 0.3,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                      style={{
                        position: "absolute",
                        top: `${20 + i * 10}%`,
                        left: `${15 + (i % 2) * 60}%`,
                      }}
                    >
                      <Sparkles size={16 + i * 2} color="#ffa500" />
                    </motion.div>
                  ))}
                </Box>

                {/* Form Fields with Modern Design */}
                <Box>
                  <Flex align="center" gap="2" mb="2">
                    <User size={18} color="#ff6b35" />
                    <Text size="3" weight="bold" style={{ color: "#333" }}>
                      Địa chỉ người nhận
                    </Text>
                  </Flex>
                  <TextField.Root
                    size="3"
                    placeholder="0x..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    disabled={waitingForTxn}
                    style={{
                      borderRadius: "15px",
                      border: "2px solid rgba(255, 107, 53, 0.2)",
                      fontSize: "1rem",
                      padding: "0.7rem",
                      background: "rgba(255, 255, 255, 0.95)",
                    }}
                  />
                </Box>

                <Box>
                  <Flex align="center" gap="2" mb="2">
                    <Wallet size={18} color="#ff6b35" />
                    <Text size="3" weight="bold" style={{ color: "#333" }}>
                      Số lượng SUI
                    </Text>
                  </Flex>
                  <TextField.Root
                    size="3"
                    type="number"
                    placeholder="0.1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={waitingForTxn}
                    style={{
                      borderRadius: "15px",
                      border: "2px solid rgba(255, 107, 53, 0.2)",
                      fontSize: "1rem",
                      padding: "0.7rem",
                      background: "rgba(255, 255, 255, 0.95)",
                    }}
                  />
                  <Text size="2" style={{ color: "#999", marginTop: "0.5rem", display: "block" }}>
                    💡 Số dư: {currentAccount ? "Kiểm tra trong ví" : "Chưa kết nối"}
                  </Text>
                </Box>

                <Box>
                  <Flex align="center" gap="2" mb="2">
                    <MessageCircle size={18} color="#ff6b35" />
                    <Text size="3" weight="bold" style={{ color: "#333" }}>
                      Lời nhắn
                    </Text>
                  </Flex>
                  <TextField.Root
                    size="3"
                    placeholder="Chúc mừng sinh nhật! 🎉"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={waitingForTxn}
                    style={{
                      borderRadius: "15px",
                      border: "2px solid rgba(255, 107, 53, 0.2)",
                      fontSize: "1rem",
                      padding: "0.7rem",
                      background: "rgba(255, 255, 255, 0.95)",
                    }}
                  />
                </Box>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Box
                        p="3"
                        style={{
                          background: "rgba(255, 50, 50, 0.1)",
                          borderRadius: "12px",
                          border: "1px solid rgba(255, 50, 50, 0.3)",
                        }}
                      >
                        <Text size="2" style={{ color: "#d00", fontWeight: 600 }}>
                          ⚠️ {error}
                        </Text>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Send Button */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="4"
                    onClick={handleSendGift}
                    disabled={waitingForTxn}
                    style={{
                      background: waitingForTxn 
                        ? "#ccc"
                        : "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                      color: "white",
                      padding: "1.8rem",
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      borderRadius: "18px",
                      cursor: waitingForTxn ? "not-allowed" : "pointer",
                      border: "none",
                      marginTop: "1rem",
                      width: "100%",
                      boxShadow: waitingForTxn ? "none" : "0 15px 40px rgba(255, 107, 53, 0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
                    }}
                  >
                    {waitingForTxn ? (
                      <Flex align="center" justify="center" gap="3">
                        <ClipLoader size={24} color="white" />
                        <span>Đang gửi quà...</span>
                      </Flex>
                    ) : (
                      <Flex align="center" justify="center" gap="3">
                        <Send size={28} />
                        <span>🎁 Gói quà & Gửi ngay!</span>
                      </Flex>
                    )}
                  </Button>
                </motion.div>
              </Flex>
            </Box>
          </motion.div>
        </Flex>
      </Container>
    </Box>
  );
}
