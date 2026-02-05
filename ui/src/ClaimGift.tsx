import {
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Box, Button, Container, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import ClipLoader from "react-spinners/ClipLoader";
import confetti from "canvas-confetti";
import { useAuth } from "./contexts/AuthContext";

interface ClaimGiftProps {
  onBack: () => void;
}

export function ClaimGift({ onBack }: ClaimGiftProps) {
  const packageId = useNetworkVariable("helloWorldPackageId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { user } = useAuth();

  const [giftId, setGiftId] = useState("");
  const [searchedGiftId, setSearchedGiftId] = useState("");
  const [waitingForTxn, setWaitingForTxn] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [error, setError] = useState("");

  // Tự động điền Gift ID từ URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('id');
    if (idFromUrl) {
      setGiftId(idFromUrl);
      setSearchedGiftId(idFromUrl);
    }
  }, []);

  const { data, isPending, error: queryError } = useSuiClientQuery(
    "getObject",
    {
      id: searchedGiftId,
      options: {
        showContent: true,
        showOwner: true,
      },
    },
    {
      enabled: searchedGiftId.length > 0,
    }
  );

  // Trigger confetti animation
  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const handleSearchGift = () => {
    if (!giftId) {
      setError("Vui lòng nhập Gift ID!");
      return;
    }
    setError("");
    setSearchedGiftId(giftId);
  };

  const handleOpenGift = () => {
    if (!searchedGiftId) return;

    if (giftData?.recipient_email && !user?.email) {
      setError("Vui lòng đăng nhập để xác nhận nhận quà!");
      return;
    }

    setWaitingForTxn(true);
    setError("");

    const tx = new Transaction();

    if (giftData?.recipient_email) {
      const recipientEmailProof = user?.email || "legacy@recipient.com";
      tx.moveCall({
        target: `${packageId}::gifting::open_and_claim_with_zklogin`,
        arguments: [
          tx.object(searchedGiftId),
          tx.pure.string(recipientEmailProof),
          tx.object("0x6"),
        ],
      });
    } else {
      tx.moveCall({
        target: `${packageId}::gifting::open_and_claim`,
        arguments: [tx.object(searchedGiftId)],
      });
    }

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          suiClient
            .waitForTransaction({ digest: result.digest })
            .then(async () => {
              setIsOpened(true);
              triggerConfetti();
              setWaitingForTxn(false);
            })
            .catch((err) => {
              console.error(err);
              setError("Không thể mở quà. Vui lòng thử lại!");
              setWaitingForTxn(false);
            });
        },
        onError: (err) => {
          console.error(err);
          setError("Có lỗi xảy ra. Bạn có phải là người nhận không?");
          setWaitingForTxn(false);
        },
      }
    );
  };

  const handleRejectGift = () => {
    if (!searchedGiftId) return;
    if (!giftData?.recipient_email) {
      setError("Không thể hoàn quà legacy. Vui lòng nhận quà.");
      return;
    }

    if (!user?.email) {
      setError("Vui lòng đăng nhập để hoàn quà!");
      return;
    }

    const recipientEmailProof = user.email;

    setWaitingForTxn(true);
    setError("");

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::gifting::reject_and_refund`,
      arguments: [tx.object(searchedGiftId), tx.pure.string(recipientEmailProof)],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          suiClient
            .waitForTransaction({ digest: result.digest })
            .then(() => {
              setWaitingForTxn(false);
              setIsOpened(true);
            })
            .catch((err) => {
              console.error(err);
              setError("Không thể hoàn lại quà. Vui lòng thử lại!");
              setWaitingForTxn(false);
            });
        },
        onError: (err) => {
          console.error(err);
          setError("Không thể hoàn lại quà. Vui lòng thử lại!");
          setWaitingForTxn(false);
        },
      }
    );
  };

  const getGiftFields = (data: SuiObjectData) => {
    if (data.content?.dataType !== "moveObject") {
      return null;
    }
    return data.content.fields as {
      sender: string;
      recipient_email?: string;
      message: string;
      is_opened: boolean;
      content: { fields: { balance: string } };
    };
  };

  const giftData = data?.data ? getGiftFields(data.data) : null;
  const canReject = Boolean(giftData?.recipient_email || user?.email || currentAccount?.address);
  const suiAmount = giftData?.content?.fields?.balance
    ? (parseInt(giftData.content.fields.balance) / 1_000_000_000).toFixed(4)
    : "0";

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
        {/* Back Button */}
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
            style={{ textAlign: "center" }}
          >
            <Box style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
              padding: "1.5rem",
              borderRadius: "25px",
              marginBottom: "1rem",
              boxShadow: "0 15px 50px rgba(255, 107, 53, 0.4)",
            }}>
              <Sparkles size={56} color="white" />
            </Box>
            <Heading size="8" mb="2" style={{ color: "#ff6b35", fontWeight: 900 }}>
              Nhận quà tặng 🎁
            </Heading>
            <Text size="3" style={{ color: "#666", fontWeight: 500 }}>
              Nhập Gift ID để mở hộp quà bất ngờ của bạn
            </Text>
          </motion.div>

          {/* Search Box */}
          {!searchedGiftId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ width: "100%", maxWidth: "600px" }}
            >
              <Box
                p="6"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "25px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                }}
              >
                <Flex direction="column" gap="4">
                  <Box>
                    <Text as="label" size="3" weight="bold" mb="2" style={{ display: "block", color: "#ff6b35" }}>
                      🎁 Gift ID
                    </Text>
                    <TextField.Root
                      size="3"
                      placeholder="0x..."
                      value={giftId}
                      onChange={(e) => setGiftId(e.target.value)}
                      style={{
                        borderRadius: "12px",
                        border: "2px solid rgba(255, 107, 53, 0.3)",
                        fontSize: "1rem",
                      }}
                    />
                  </Box>

                  {error && (
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
                  )}

                  <Button
                    size="4"
                    onClick={handleSearchGift}
                    style={{
                      background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                      color: "white",
                      padding: "1.2rem",
                      fontSize: "1rem",
                      fontWeight: 700,
                      borderRadius: "15px",
                      cursor: "pointer",
                      border: "none",
                      boxShadow: "0 10px 30px rgba(255, 107, 53, 0.3)",
                    }}
                  >
                    🔍 Tìm quà
                  </Button>
                </Flex>
              </Box>
            </motion.div>
          )}

          {/* Gift Box Display */}
          {searchedGiftId && !isOpened && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              style={{ 
                width: "100%", 
                maxWidth: "600px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
              }}
            >
              <Box
                p="8"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "30px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                }}
              >
                {isPending ? (
                  <Flex justify="center" align="center" style={{ padding: "3rem" }}>
                    <ClipLoader size={50} color="#ff6b35" />
                  </Flex>
                ) : queryError || !giftData ? (
                  <Box style={{ textAlign: "center" }}>
                    <Text size="4" style={{ color: "#c00" }}>
                      Không tìm thấy quà hoặc quà đã được mở!
                    </Text>
                    <Button
                      size="3"
                      variant="soft"
                      onClick={() => {
                        setSearchedGiftId("");
                        setGiftId("");
                        setError("");
                      }}
                      style={{ marginTop: "1rem" }}
                    >
                      Thử lại
                    </Button>
                  </Box>
                ) : (
                  <Flex direction="column" align="center" gap="5">
                    {/* Gift Info */}
                    <Box style={{ textAlign: "center", width: "100%" }}>
                      <Text size="2" style={{ color: "#666", marginBottom: "0.8rem", display: "block", fontWeight: 500 }}>
                        Từ: {giftData.sender.slice(0, 6)}...{giftData.sender.slice(-4)}
                      </Text>
                      <Box
                        p="4"
                        mb="4"
                        style={{
                          background: "rgba(255, 107, 53, 0.08)",
                          borderRadius: "15px",
                          border: "2px dashed rgba(255, 107, 53, 0.3)",
                        }}
                      >
                        <Text size="3" style={{ color: "#ff6b35", fontStyle: "italic", fontWeight: 600 }}>
                          "{giftData.message}"
                        </Text>
                      </Box>
                    </Box>

                    {error && (
                      <Box
                        p="3"
                        style={{
                          background: "#fee",
                          borderRadius: "12px",
                          border: "1px solid #fcc",
                          width: "100%",
                        }}
                      >
                        <Text size="2" style={{ color: "#c00" }}>
                          {error}
                        </Text>
                      </Box>
                    )}

                    {/* Open Button */}
                    <Flex direction="column" gap="2" style={{ width: "100%" }}>
                      <motion.div
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ width: "100%" }}
                      >
                        <Button
                          size="4"
                          onClick={handleOpenGift}
                          disabled={waitingForTxn}
                          style={{
                            background: waitingForTxn 
                              ? "#ccc"
                              : "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                            color: "white",
                            padding: "2rem 3rem",
                            fontSize: "1.3rem",
                            fontWeight: 900,
                            borderRadius: "20px",
                            cursor: waitingForTxn ? "not-allowed" : "pointer",
                            border: "none",
                            width: "100%",
                            boxShadow: "0 20px 50px rgba(255, 107, 53, 0.5)",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {waitingForTxn ? (
                            <Flex align="center" justify="center" gap="2">
                              <ClipLoader size={24} color="white" />
                              Đang mở quà...
                            </Flex>
                          ) : (
                            <motion.span
                              animate={{
                                scale: [1, 1.05, 1],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                              }}
                            >
                              🎉 MỞ QUÀ NGAY!
                            </motion.span>
                          )}
                        </Button>
                      </motion.div>
                      <Button
                        onClick={handleRejectGift}
                        disabled={waitingForTxn || !canReject}
                        size="3"
                        variant="soft"
                        style={{
                          borderColor: "rgba(255, 107, 53, 0.4)",
                          color: "#ff6b35",
                        }}
                      >
                        Hoàn lại người gửi
                      </Button>
                    </Flex>
                  </Flex>
                )}
              </Box>
            </motion.div>
          )}

          {/* Success State - After Opening with Explosion Effect */}
          <AnimatePresence>
            {isOpened && (
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                style={{ 
                  width: "100%", 
                  maxWidth: "700px",
                  boxShadow: "0 40px 120px rgba(255, 107, 53, 0.5)"
                }}
              >
                <Box
                  p="9"
                  style={{
                    background: "rgba(255, 255, 255, 0.98)",
                    borderRadius: "35px",
                    boxShadow: "0 40px 120px rgba(255, 107, 53, 0.5)",
                    textAlign: "center",
                    border: "4px solid #ff6b35",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Celebration Animation */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 20, -20, 0],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: 3,
                    }}
                  >
                    <Text
                      size="9"
                      style={{
                        fontSize: "7rem",
                        display: "block",
                        marginBottom: "1rem",
                        filter: "drop-shadow(0 10px 30px rgba(255, 107, 53, 0.5))",
                      }}
                    >
                      🎉
                    </Text>
                  </motion.div>

                  <Heading size="8" mb="5" style={{ color: "#ff6b35", fontWeight: 900 }}>
                    CHÚC MỪNG!
                  </Heading>

                  {/* Animated Amount Display */}
                  <Box
                    p="7"
                    mb="5"
                    style={{
                      background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                      borderRadius: "25px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      style={{
                        position: "absolute",
                        top: "-50%",
                        left: "-50%",
                        width: "200%",
                        height: "200%",
                        background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
                      }}
                    />
                    
                    <Text size="3" style={{ color: "rgba(255,255,255,0.95)", marginBottom: "0.8rem", display: "block", position: "relative" }}>
                      Bạn đã nhận được
                    </Text>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.8, type: "spring" }}
                    >
                      <Text
                        size="9"
                        weight="bold"
                        style={{
                          color: "white",
                          fontSize: "4rem",
                          display: "block",
                          textShadow: "0 4px 20px rgba(0,0,0,0.3)",
                          position: "relative",
                        }}
                      >
                        {suiAmount} SUI
                      </Text>
                    </motion.div>
                  </Box>

                  {giftData && (
                    <Box
                      p="5"
                      mb="5"
                      style={{
                        background: "rgba(255, 107, 53, 0.1)",
                        borderRadius: "20px",
                        border: "2px dashed #ff6b35",
                      }}
                    >
                      <Text size="4" weight="bold" style={{ color: "#ff6b35", marginBottom: "0.5rem", display: "block" }}>
                        💌 Lời nhắn từ người gửi:
                      </Text>
                      <Text size="4" style={{ color: "#666", fontStyle: "italic", lineHeight: 1.6 }}>
                        "{giftData.message}"
                      </Text>
                    </Box>
                  )}

                  <Button
                    size="4"
                    variant="soft"
                    onClick={() => {
                      setIsOpened(false);
                      setSearchedGiftId("");
                      setGiftId("");
                    }}
                    style={{
                      padding: "1.5rem 2.5rem",
                      borderRadius: "15px",
                      marginTop: "1rem",
                      background: "rgba(255, 107, 53, 0.1)",
                      color: "#ff6b35",
                      fontWeight: 700,
                      border: "2px solid #ff6b35",
                    }}
                  >
                    Nhận quà khác
                  </Button>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Flex>
      </Container>
    </Box>
  );
}
