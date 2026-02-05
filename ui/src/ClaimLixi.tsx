import {
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Box, Button, Container, Flex, Heading, Text, TextField, Select } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, ArrowLeft, Sparkles, Ticket } from "lucide-react";
import ClipLoader from "react-spinners/ClipLoader";
import confetti from "canvas-confetti";
import { useAuth } from "./contexts/AuthContext";

interface ClaimLixiProps {
  onBack: () => void;
}

export function ClaimLixi({ onBack }: ClaimLixiProps) {
  const packageId = useNetworkVariable("helloWorldPackageId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { user } = useAuth();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [lixiId, setLixiId] = useState("");
  const [searchedLixiId, setSearchedLixiId] = useState("");
  const [password, setPassword] = useState("");  // Mật khẩu để claim
  const [waitingForTxn, setWaitingForTxn] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const autoClaimedRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [userTickets, setUserTickets] = useState<any[]>([]); // NFT Tickets của user
  const [selectedTicketId, setSelectedTicketId] = useState(""); // Ticket được chọn
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Tự động điền Lixi ID từ URL query parameter (hỗ trợ hash route)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let idFromUrl = params.get('id');

    if (!idFromUrl && window.location.hash) {
      const hashQuery = window.location.hash.split('?')[1];
      if (hashQuery) {
        const hashParams = new URLSearchParams(hashQuery);
        idFromUrl = hashParams.get('id');
      }
    }

    if (idFromUrl) {
      setLixiId(idFromUrl);
      setSearchedLixiId(idFromUrl);
    }
  }, []);

  useEffect(() => {
    autoClaimedRef.current = false;
  }, [searchedLixiId]);

  const { data, isPending, refetch } = useSuiClientQuery(
    "getObject",
    {
      id: searchedLixiId,
      options: {
        showContent: true,
        showOwner: true,
      },
    },
    {
      enabled: searchedLixiId.length > 0,
    }
  );

  const lixiData = data?.data?.content?.dataType === "moveObject" 
    ? (data.data.content.fields as any) 
    : null;

  const totalAmount = lixiData?.total_amount 
    ? (parseInt(lixiData.total_amount) / 1_000_000_000).toFixed(4) 
    : "0";
  const remainingAmount = lixiData?.remaining_amount 
    ? (parseInt(lixiData.remaining_amount) / 1_000_000_000).toFixed(4) 
    : "0";
  const claimedCount = lixiData?.claimed_count || 0;
  const maxRecipients = lixiData?.max_recipients || 0;
  const message = lixiData?.message || "";
  const isActive = lixiData?.is_active || false;
  const distributionMode = lixiData?.distribution_mode === 0 ? "Chia đều" : "May mắn";
  const expiryTimestamp = lixiData?.expiry_timestamp ? Number(lixiData.expiry_timestamp) : 0;
  const creatorAddress = lixiData?.creator || "";
  const hasPassword = lixiData?.has_password || false;  // Kiểm tra có password không
  const protectionMode = Number(lixiData?.protection_mode ?? 0); // 0=none, 1=password, 2=nft - ensure it's a number

  // Fetch user's NFT tickets for this lixi
  useEffect(() => {
    const fetchUserTickets = async () => {
      if (!currentAccount || !searchedLixiId || protectionMode !== 2) {
        setUserTickets([]);
        return;
      }

      setLoadingTickets(true);
      try {
        // Fetch all LixiTicket NFTs owned by current user
        const ticketType = `${packageId}::lixi_ticket::LixiTicket`;
        const ownedObjects = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: ticketType,
          },
          options: {
            showContent: true,
          },
        });

        console.log("🎫 User owned LixiTickets:", ownedObjects.data);
        console.log("🔍 Looking for lixi_id:", searchedLixiId);

        // Filter tickets that belong to this lixi
        const matchingTickets = ownedObjects.data
          .filter((obj: any) => {
            if (obj.data?.content?.dataType !== "moveObject") return false;
            const fields = obj.data.content.fields as any;
            // lixi_id trong ticket có thể là string hoặc object với id property
            const ticketLixiId = typeof fields.lixi_id === 'string' 
              ? fields.lixi_id 
              : fields.lixi_id?.id || fields.lixi_id;
            console.log("🎫 Ticket lixi_id:", ticketLixiId, "vs", searchedLixiId);
            return ticketLixiId === searchedLixiId;
          })
          .map((obj: any) => {
            const objectId = obj.data?.objectId;  // This is the actual object ID we need
            const fields = obj.data?.content?.fields || {};
            console.log("🎫 Ticket objectId:", objectId);
            return {
              ...fields,
              objectId: objectId,  // Use objectId instead of id to avoid confusion with fields.id
            };
          });

        console.log("✅ Matching tickets:", matchingTickets);
        setUserTickets(matchingTickets);
        
        // Auto-select first ticket if available
        if (matchingTickets.length > 0 && !selectedTicketId) {
          setSelectedTicketId(matchingTickets[0].objectId);
        }
      } catch (err) {
        console.error("Error fetching tickets:", err);
        setUserTickets([]);
      } finally {
        setLoadingTickets(false);
      }
    };

    fetchUserTickets();
  }, [currentAccount, searchedLixiId, protectionMode, packageId, suiClient]);

  useEffect(() => {
    if (!expiryTimestamp) {
      setTimeLeft("");
      return;
    }

    const update = () => {
      const now = Date.now();
      const diff = expiryTimestamp - now;
      if (diff <= 0) {
        setTimeLeft("Đã hết hạn");
        return;
      }

      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [expiryTimestamp]);

  // Auto-claim chỉ khi KHÔNG có password VÀ KHÔNG phải NFT mode
  useEffect(() => {
    if (
      !searchedLixiId ||
      !currentAccount ||
      !lixiData ||
      isPending ||
      waitingForTxn ||
      claimed ||
      autoClaimedRef.current ||
      protectionMode !== 0  // KHÔNG auto-claim nếu có bảo mật (password hoặc NFT)
    ) {
      return;
    }

    if (!isActive) {
      return;
    }

    autoClaimedRef.current = true;
    handleClaimLixi();
  }, [searchedLixiId, currentAccount, lixiData, isPending, waitingForTxn, claimed, isActive, protectionMode]);

  const handleSearchLixi = () => {
    const trimmedId = lixiId.trim();
    if (!trimmedId) {
      setError("Vui lòng nhập Lixi ID!");
      return;
    }
    setError("");
    setSearchedLixiId(trimmedId);
  };

  const triggerFireworks = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#ff6b35', '#f7931e', '#ffd166'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#ff6b35', '#f7931e', '#ffd166'],
      });
    }, 250);
  };

  const handleClaimLixi = () => {
    if (!searchedLixiId) return;

    if (!currentAccount) {
      setError("Vui lòng kết nối ví Sui để nhận lì xì!");
      return;
    }

    // Kiểm tra password nếu cần
    if (protectionMode === 1 && !password.trim()) {
      setError("Lì xì này cần mật khẩu! Vui lòng nhập mật khẩu.");
      return;
    }

    // Kiểm tra NFT ticket nếu cần
    if (protectionMode === 2) {
      if (userTickets.length === 0) {
        setError("Bạn không có NFT Ticket để claim lì xì này!");
        return;
      }
      if (!selectedTicketId) {
        setError("Vui lòng chọn NFT Ticket để claim!");
        return;
      }
    }

    // Không bắt buộc phải đăng nhập Google
    // Nếu có thì dùng email, không thì dùng wallet address
    const claimerEmail = user?.email || `${currentAccount?.address.slice(0, 8)}@wallet.sui` || 'anonymous@sui.wallet';

    // Shake animation
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    setWaitingForTxn(true);
    setError("");

    const tx = new Transaction();

    console.log("🔐 Protection mode:", protectionMode, "Type:", typeof protectionMode);
    console.log("🎫 Selected ticket ID:", selectedTicketId);
    console.log("📦 Lixi ID:", searchedLixiId);

    if (protectionMode === 2) {
      // NFT Ticket mode - call claim_lixi_with_nft
      console.log("📤 Calling claim_lixi_with_nft...");
      tx.moveCall({
        target: `${packageId}::sui_lixi::claim_lixi_with_nft`,
        arguments: [
          tx.object(searchedLixiId),
          tx.object(selectedTicketId),  // NFT Ticket
          tx.pure.string(claimerEmail),
          tx.object("0x6"), // Clock
        ],
      });
    } else {
      // Password mode or public mode
      tx.moveCall({
        target: `${packageId}::sui_lixi::claim_lixi`,
        arguments: [
          tx.object(searchedLixiId),
          tx.pure.string(claimerEmail),
          tx.pure.string(password),  // Truyền password
          tx.object("0x6"), // Clock
        ],
      });
    }

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          suiClient
            .waitForTransaction({ 
              digest: result.digest,
              options: { showEffects: true, showBalanceChanges: true }
            })
            .then((txResult) => {
              // Get balance changes to determine claimed amount
              const balanceChanges = txResult.balanceChanges?.filter(
                (change: any) => change.owner?.AddressOwner === currentAccount?.address
              );
              
              if (balanceChanges && balanceChanges.length > 0) {
                const amount = Math.abs(parseInt(balanceChanges[0].amount)) / 1_000_000_000;
                setClaimedAmount(amount.toFixed(4));
              }

              setClaimed(true);
              triggerFireworks();
              setWaitingForTxn(false);
              
              // Refresh lixi data
              setTimeout(() => refetch(), 1000);
            })
            .catch((err) => {
              console.error(err);
              setError("Không thể mở lì xì!");
              setWaitingForTxn(false);
            });
        },
        onError: (err: any) => {
          console.error("❌ Claim error:", err);
          let errorMessage = "Có lỗi xảy ra. ";

          const message = err?.message || "";
          const moveAbortMatch = message.match(/MoveAbort\([^)]*,\s*(\d+)\)/);
          const moveAbortCode = moveAbortMatch ? Number(moveAbortMatch[1]) : null;

          console.log("Move abort code:", moveAbortCode);

          if (moveAbortCode === 1 || message.includes("ELixiExpired")) {
            errorMessage = "🕒 Lì xì đã hết hạn!";
          } else if (moveAbortCode === 7 || message.includes("ELixiLocked")) {
            errorMessage = "🔒 Lì xì đã bị khóa bởi người tạo!";
          } else if (moveAbortCode === 2 || message.includes("ELixiEmpty")) {
            errorMessage = "😔 Lì xì đã hết hoặc không còn chỗ!";
          } else if (moveAbortCode === 3 || message.includes("EAlreadyClaimed")) {
            errorMessage = "⚠️ Bạn đã nhận lì xì này rồi!";
          } else if (moveAbortCode === 9 || message.includes("EInvalidTicket")) {
            errorMessage = "🎫 NFT Ticket không hợp lệ hoặc không thuộc lì xì này!";
          } else if (message) {
            errorMessage += message;
          }

          setError(errorMessage);
          setWaitingForTxn(false);
        },
      }
    );
  };

  const handleReclaimLixi = () => {
    if (!searchedLixiId || !currentAccount) return;

    setWaitingForTxn(true);
    setError("");

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::sui_lixi::reclaim_expired_lixi`,
      arguments: [tx.object(searchedLixiId), tx.object("0x6")],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          suiClient
            .waitForTransaction({ digest: result.digest, options: { showEffects: true, showBalanceChanges: true } })
            .then(() => {
              setWaitingForTxn(false);
              setTimeout(() => refetch(), 1000);
            })
            .catch((err) => {
              console.error(err);
              setError("Không thể hoàn lại lì xì!");
              setWaitingForTxn(false);
            });
        },
        onError: (err: any) => {
          console.error(err);
          setError("Không thể hoàn lại lì xì!");
          setWaitingForTxn(false);
        },
      }
    );
  };

  return (
    <Box style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fff7f2 0%, #ffe9db 100%)",
      padding: "56px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {[...Array(14)].map((_, i) => (
        <motion.div
          key={`sparkle-claim-${i}`}
          animate={{
            x: [0, Math.random() * 140 - 70, 0],
            y: [0, Math.random() * 140 - 70, 0],
            opacity: [0.12, 0.3, 0.12],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.12,
          }}
          style={{
            position: "absolute",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: i % 2 === 0 ? "#ff6b35" : "#f7931e",
            boxShadow: `0 0 16px ${i % 2 === 0 ? "#ff6b35" : "#f7931e"}`,
            filter: "blur(0.4px)",
            pointerEvents: "none",
          }}
        />
      ))}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 1.2 }}
        style={{
          position: "absolute",
          inset: "-240px -180px auto auto",
          width: "520px",
          height: "520px",
          background: "radial-gradient(circle at 30% 30%, rgba(255,107,53,0.2), transparent 60%)",
          filter: "blur(2px)",
        }}
      />
      {/* Floating decorations */}
      <motion.div
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          fontSize: "80px",
          opacity: 0.2,
        }}
        animate={{
          y: [0, -20, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
      >
        🧧
      </motion.div>
      <motion.div
        style={{
          position: "absolute",
          top: "60%",
          right: "5%",
          fontSize: "60px",
          opacity: 0.2,
        }}
        animate={{
          y: [0, 20, 0],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
      >
        💰
      </motion.div>

      <Container size="4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={onBack}
            variant="soft"
            size="3"
            style={{
              color: "#ff6b35",
              background: "rgba(255, 107, 53, 0.1)",
              marginBottom: "20px",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={20} />
            Quay lại
          </Button>

          <Box
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "minmax(360px, 1fr) minmax(360px, 1fr)",
              gap: "2rem",
              alignItems: "start",
              background: "rgba(255, 255, 255, 0.8)",
              borderRadius: "36px",
              padding: "24px",
              border: "1px solid rgba(255, 167, 123, 0.25)",
              boxShadow: "0 30px 80px rgba(255, 166, 122, 0.25)",
            }}
          >
            <Box
              style={{
                width: "100%",
                maxWidth: "520px",
                background: "rgba(255, 255, 255, 0.92)",
                borderRadius: "28px",
                padding: "2.2rem",
                color: "#1f2937",
                boxShadow: "0 24px 60px rgba(255, 166, 122, 0.2)",
                border: "1px solid rgba(255, 167, 123, 0.3)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  bottom: "-70px",
                  right: "-40px",
                  width: "240px",
                  height: "240px",
                  borderRadius: "45%",
                  background: "rgba(255, 255, 255, 0.18)",
                  filter: "blur(1px)",
                }}
              />

              <Text size="2" weight="medium" style={{ letterSpacing: "0.28em", textTransform: "uppercase", opacity: 0.85, color: "#ff6b35" }}>
                Nhận lì xì
              </Text>
              <Heading size="6" style={{ marginTop: "1rem", lineHeight: 1.2 }}>
                Chúc mừng năm mới
              </Heading>
              <Text size="3" style={{ marginTop: "0.8rem", lineHeight: 1.6, color: "#6b7280" }}>
                Dán mã chia sẻ để xem trạng thái, mở phong bao và nhận phần thưởng ngay lập tức.
              </Text>

              <Flex wrap="wrap" gap="2" style={{ marginTop: "1.25rem" }}>
                {[{
                  icon: "🔎",
                  title: "Xem thông tin rõ ràng",
                }, {
                  icon: "✨",
                  title: "Hiệu ứng mở bao",
                }, {
                  icon: "💬",
                  title: "Gửi lời chúc",
                }].map((item) => (
                  <Box
                    key={item.title}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      background: "rgba(255, 107, 53, 0.08)",
                      borderRadius: "12px",
                      padding: "0.65rem 0.9rem",
                      color: "#9a3412",
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                    <Text size="2" weight="medium">
                      {item.title}
                    </Text>
                  </Box>
                ))}
              </Flex>

              <Box
                style={{
                  marginTop: "1.3rem",
                  padding: "0.8rem 1rem",
                  borderRadius: "14px",
                  background: "rgba(255, 107, 53, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                <Text weight="bold" style={{ color: "#9a3412" }}>Lưu ý nhanh</Text>
                <Text size="2" style={{ color: "#9a3412" }}>
                  Nếu bao đã hết hạn hoặc hết tiền, bạn vẫn xem được lịch sử để liên hệ người tạo.
                </Text>
              </Box>
            </Box>

            <Box
              style={{
                width: "100%",
                maxWidth: "520px",
                background: "linear-gradient(135deg, #fff1e6 0%, #ffe3d2 100%)",
                borderRadius: "28px",
                padding: "2.2rem",
                boxShadow: "0 25px 65px rgba(255, 166, 122, 0.25)",
                border: "1px solid rgba(255, 167, 123, 0.25)",
              }}
            >
              {!searchedLixiId ? (
                <Flex direction="column" gap="4">
                  <Box style={{ textAlign: "center" }}>
                    <motion.div
                      style={{ fontSize: "56px", marginBottom: "10px" }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🧧
                    </motion.div>
                    <Heading size="6" style={{ color: "#ff6b35" }}>
                      Nhập mã bao lì xì
                    </Heading>
                    <Text size="2" style={{ color: "#6f6f6f", marginTop: "8px" }}>
                      Dán mã được chia sẻ để kiểm tra phong bao và nhận phần của bạn.
                    </Text>
                  </Box>

                  <Box>
                    <Text weight="medium" style={{ marginBottom: "8px", display: "block" }}>
                      Lixi ID
                    </Text>
                    <TextField.Root
                      placeholder="0x..."
                      value={lixiId}
                      onChange={(e) => {
                        if (error) setError("");
                        setLixiId(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearchLixi();
                        }
                      }}
                      size="3"
                    />
                  </Box>

                  {error && (
                    <Box style={{
                      padding: "12px",
                      background: "rgba(255, 107, 53, 0.08)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 107, 53, 0.2)",
                    }}>
                      <Text size="2" style={{ color: "#c0392b" }}>{error}</Text>
                    </Box>
                  )}

                  <Button
                    onClick={handleSearchLixi}
                    disabled={isPending && Boolean(searchedLixiId)}
                    size="4"
                    style={{
                      background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                      fontSize: "18px",
                      padding: "24px",
                    }}
                  >
                    <Gift size={20} />
                    Tìm Bao Lì Xì
                  </Button>
                </Flex>
              ) : !claimed ? (
                <Flex direction="column" gap="3">
                  <motion.div
                    style={{
                      textAlign: "center",
                      cursor: isActive && !waitingForTxn ? "pointer" : "default",
                    }}
                    onClick={() => isActive && !waitingForTxn && handleClaimLixi()}
                    animate={isShaking ? {
                      rotate: [0, -5, 5, -5, 5, 0],
                      scale: [1, 1.05, 1, 1.05, 1],
                    } : {}}
                    transition={{ duration: 0.5 }}
                    whileHover={isActive ? { scale: 1.05 } : {}}
                  >
                    <div style={{ fontSize: "100px", marginBottom: "16px" }}>
                      {isActive ? "🧧" : "📭"}
                    </div>
                    <Text size="2" style={{ color: "#6f6f6f" }}>
                      {isActive ? "Chạm hoặc nhấp để mở" : "Bao lì xì đã đóng"}
                    </Text>
                  </motion.div>

                  <Box style={{ textAlign: "center" }}>
                    <Heading size="6" style={{ color: "#ff6b35" }}>
                      {message || "Chúc bạn may mắn!"}
                    </Heading>
                  </Box>

                  <Flex direction="column" gap="2" style={{
                    background: "#fff5ec",
                    padding: "18px",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 107, 53, 0.18)",
                  }}>
                    <Flex justify="between" align="center">
                      <Text size="2">💰 Tổng quỹ ban đầu</Text>
                      <Text size="3" weight="bold">{totalAmount} SUI</Text>
                    </Flex>
                    <Flex justify="between" align="center">
                      <Text size="2">💸 Số dư còn lại</Text>
                      <Text size="3" weight="bold" style={{ color: "#ff6b35" }}>
                        {remainingAmount} SUI
                      </Text>
                    </Flex>
                    <Flex justify="between" align="center">
                      <Text size="2">👥 Người đã nhận</Text>
                      <Text size="2" weight="bold">
                        {claimedCount}/{maxRecipients}
                      </Text>
                    </Flex>
                    <Flex justify="between" align="center">
                      <Text size="2">🎲 Chế độ</Text>
                      <Text size="2" weight="bold">{distributionMode}</Text>
                    </Flex>
                    <Flex justify="between" align="center">
                      <Text size="2">⚡ Trạng thái</Text>
                      <Text size="2" weight="bold" style={{ color: isActive ? "#14a44d" : "#888" }}>
                        {isActive ? "Đang hoạt động" : "Đã kết thúc"}
                      </Text>
                    </Flex>
                    <Flex justify="between" align="center">
                      <Text size="2">🔒 Bảo mật</Text>
                      <Text size="2" weight="bold" style={{ color: hasPassword ? "#ff6b35" : "#14a44d" }}>
                        {hasPassword ? "Cần mật khẩu" : "Công khai"}
                      </Text>
                    </Flex>
                    {timeLeft && (
                      <Flex justify="between" align="center">
                        <Text size="2">⏳ Còn lại</Text>
                        <Text size="2" weight="bold" style={{ color: "#ff6b35" }}>
                          {timeLeft}
                        </Text>
                      </Flex>
                    )}
                  </Flex>

                  {/* Password Input nếu lì xì cần mật khẩu */}
                  <AnimatePresence>
                    {protectionMode === 1 && isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginTop: "16px" }}
                      >
                        <Box
                          style={{
                            padding: "16px",
                            borderRadius: "14px",
                            background: "rgba(255, 107, 53, 0.05)",
                            border: "1px solid rgba(255, 165, 120, 0.24)",
                          }}
                        >
                          <Text size="2" weight="medium" style={{ marginBottom: "8px", display: "block" }}>
                            🔐 Nhập mật khẩu để nhận lì xì:
                          </Text>
                          <TextField.Root
                            type="password"
                            placeholder="Nhập mật khẩu..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            size="3"
                          />
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* NFT Ticket Selection nếu lì xì dùng NFT */}
                  <AnimatePresence>
                    {protectionMode === 2 && isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginTop: "16px" }}
                      >
                        <Box
                          style={{
                            padding: "16px",
                            borderRadius: "14px",
                            background: "linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(255, 180, 120, 0.1) 100%)",
                            border: "1px solid rgba(255, 165, 120, 0.24)",
                          }}
                        >
                          <Flex gap="2" align="center" style={{ marginBottom: "12px" }}>
                            <Ticket size={16} style={{ color: "#ff6b35" }} />
                            <Text size="2" weight="bold" style={{ color: "#9a3412" }}>
                              Cần NFT Ticket để claim lì xì này
                            </Text>
                          </Flex>

                          {loadingTickets ? (
                            <Flex align="center" justify="center" gap="2" style={{ padding: "20px" }}>
                              <ClipLoader size={16} color="#ff6b35" />
                              <Text size="2" style={{ color: "#666" }}>Đang tìm ticket của bạn...</Text>
                            </Flex>
                          ) : userTickets.length === 0 ? (
                            <Box
                              style={{
                                padding: "16px",
                                borderRadius: "12px",
                                background: "rgba(192, 57, 43, 0.08)",
                                border: "1px solid rgba(192, 57, 43, 0.2)",
                                textAlign: "center",
                              }}
                            >
                              <Text size="2" style={{ color: "#c0392b", display: "block" }}>
                                😔 Bạn không có NFT Ticket cho lì xì này
                              </Text>
                              <Text size="1" style={{ color: "#888", marginTop: "6px", display: "block" }}>
                                Liên hệ người tạo lì xì để nhận ticket
                              </Text>
                            </Box>
                          ) : (
                            <>
                              <Text size="2" style={{ color: "#666", marginBottom: "10px", display: "block" }}>
                                🎫 Bạn có {userTickets.length} ticket. Chọn ticket để claim:
                              </Text>
                              <Select.Root
                                value={selectedTicketId}
                                onValueChange={setSelectedTicketId}
                                size="3"
                              >
                                <Select.Trigger style={{ width: "100%" }} placeholder="Chọn NFT Ticket..." />
                                <Select.Content>
                                  {userTickets.map((ticket) => (
                                    <Select.Item key={ticket.objectId} value={ticket.objectId}>
                                      🎫 Ticket #{ticket.ticket_number}/{ticket.total_tickets}
                                    </Select.Item>
                                  ))}
                                </Select.Content>
                              </Select.Root>
                              
                              {selectedTicketId && (
                                <Box
                                  style={{
                                    marginTop: "12px",
                                    padding: "10px",
                                    borderRadius: "10px",
                                    background: "rgba(39, 174, 96, 0.08)",
                                    border: "1px solid rgba(39, 174, 96, 0.2)",
                                  }}
                                >
                                  <Text size="1" style={{ color: "#27ae60", display: "block" }}>
                                    ✓ Ticket sẽ bị đốt (burn) sau khi claim thành công
                                  </Text>
                                </Box>
                              )}
                            </>
                          )}
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <Box style={{
                      padding: "12px",
                      background: "rgba(255, 107, 53, 0.08)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 107, 53, 0.2)",
                    }}>
                      <Text size="2" style={{ color: "#c0392b" }}>{error}</Text>
                    </Box>
                  )}

                  <Button
                    onClick={handleClaimLixi}
                    disabled={
                      waitingForTxn || 
                      !isActive || 
                      !currentAccount ||
                      (protectionMode === 2 && userTickets.length === 0) ||
                      (protectionMode === 2 && !selectedTicketId)
                    }
                    size="4"
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)"
                        : "#d9d9d9",
                      fontSize: "18px",
                      padding: "24px",
                      cursor: isActive && currentAccount ? "pointer" : "not-allowed",
                    }}
                  >
                    {waitingForTxn ? (
                      <Flex gap="2" align="center" justify="center">
                        <ClipLoader size={20} color="#fff" />
                        <span>Đang mở...</span>
                      </Flex>
                    ) : isActive ? (
                      <Flex gap="2" align="center" justify="center">
                        <Sparkles size={20} />
                        <span>Mở bao lì xì</span>
                      </Flex>
                    ) : (
                      "Đã hết lượt"
                    )}
                  </Button>
                  {currentAccount?.address === creatorAddress && timeLeft === "Đã hết hạn" && Number(remainingAmount) > 0 && (
                    <Button
                      onClick={handleReclaimLixi}
                      disabled={waitingForTxn}
                      size="3"
                      variant="soft"
                      style={{
                        borderColor: "rgba(255, 107, 53, 0.4)",
                        color: "#ff6b35",
                      }}
                    >
                      Hoàn lại số dư còn lại
                    </Button>
                  )}
                </Flex>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Flex direction="column" gap="4" align="center" style={{ textAlign: "center" }}>
                    <motion.div
                      style={{ fontSize: "110px" }}
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360],
                      }}
                      transition={{ duration: 1 }}
                    >
                      🎉
                    </motion.div>
                    <Heading size="7" style={{ color: "#ff6b35" }}>
                      Chúc mừng bạn!
                    </Heading>
                    <Box style={{
                      background: "#fff5ec",
                      padding: "30px",
                      borderRadius: "18px",
                      border: "1px dashed rgba(255, 107, 53, 0.35)",
                    }}>
                      <Text size="3">Bạn đã nhận được</Text>
                      <Heading size="9" style={{ color: "#ff6b35", margin: "16px 0" }}>
                        {claimedAmount || "?"} SUI
                      </Heading>
                      <Text size="2" style={{ color: "#6f6f6f" }}>
                        💰 Tiền đã được chuyển vào ví của bạn
                      </Text>
                    </Box>
                    <Button
                      onClick={() => {
                        setSearchedLixiId("");
                        setClaimed(false);
                        setClaimedAmount("");
                        setLixiId("");
                      }}
                      size="3"
                      variant="soft"
                      style={{ borderColor: "rgba(255, 107, 53, 0.4)", color: "#ff6b35" }}
                    >
                      Mở lì xì khác
                    </Button>
                  </Flex>
                </motion.div>
              )}
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
