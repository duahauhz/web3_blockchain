import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Transaction } from "@mysten/sui/transactions";
import {
  useSignAndExecuteTransaction,
  useSuiClient,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  TextField,
  Select,
  Separator,
  TextArea,
} from "@radix-ui/themes";
import {
  Gift,
  ArrowLeft,
  Wallet,
  Users,
  Clock,
  MessageCircle,
  Sparkles,
  Shield,
  Ticket,
  Plus,
  X,
} from "lucide-react";
import ClipLoader from "react-spinners/ClipLoader";
import confetti from "canvas-confetti";
import { useNetworkVariable } from "./networkConfig";
import { useAuth } from "./contexts/AuthContext";
import { useNotifications } from "./contexts/NotificationContext";
import toast from "react-hot-toast";

interface CreateLixiProps {
  onBack: () => void;
  onCreated: (id: string, type: "lixi") => void;
}

export function CreateLixi({ onBack, onCreated }: CreateLixiProps) {
  const packageId = useNetworkVariable("helloWorldPackageId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { user } = useAuth();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { addNotification, addHistoryEntry } = useNotifications();

  const [totalAmount, setTotalAmount] = useState("");
  const [maxRecipients, setMaxRecipients] = useState("10");
  const [distributionMode, setDistributionMode] = useState("0");
  const [minAmount, setMinAmount] = useState("0.01");
  const [maxAmount, setMaxAmount] = useState("1");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");  // Mật khẩu bảo vệ
  const [protectionMode, setProtectionMode] = useState("0"); // 0=none, 1=password, 2=nft
  const [nftRecipients, setNftRecipients] = useState<string[]>([""]); // Danh sách địa chỉ ví cho NFT ticket
  const [expiryHours, setExpiryHours] = useState("24");
  const [waitingForTxn, setWaitingForTxn] = useState(false);
  const [error, setError] = useState("");

  const toMist = (value: string) => {
    const numericValue = parseFloat(value || "0");
    if (Number.isNaN(numericValue) || numericValue <= 0) {
      return 0n;
    }
    return BigInt(Math.floor(numericValue * 1_000_000_000));
  };

  const formatSui = (amountInMist: bigint) => Number(amountInMist) / 1_000_000_000;

  // Helper functions for NFT recipients
  const addNftRecipient = () => {
    setNftRecipients([...nftRecipients, ""]);
  };

  const removeNftRecipient = (index: number) => {
    if (nftRecipients.length > 1) {
      const newRecipients = nftRecipients.filter((_, i) => i !== index);
      setNftRecipients(newRecipients);
    }
  };

  const updateNftRecipient = (index: number, value: string) => {
    const newRecipients = [...nftRecipients];
    newRecipients[index] = value;
    setNftRecipients(newRecipients);
  };

  const isValidSuiAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  };

  const handleCreateLixi = async () => {
    if (!totalAmount || !maxRecipients || !message) {
      setError("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    const amountNum = parseFloat(totalAmount);
    const recipientsNum = parseInt(maxRecipients, 10);
    const expiryNum = parseInt(expiryHours, 10);

    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setError("Số lượng SUI không hợp lệ!");
      return;
    }

    if (
      Number.isNaN(recipientsNum) ||
      recipientsNum <= 0 ||
      recipientsNum > 100
    ) {
      setError("Số người nhận phải từ 1-100!");
      return;
    }

    if (distributionMode === "1") {
      const minNum = parseFloat(minAmount);
      const maxNum = parseFloat(maxAmount);

      if (
        Number.isNaN(minNum) ||
        Number.isNaN(maxNum) ||
        minNum <= 0 ||
        maxNum < minNum
      ) {
        setError("Giới hạn tiền không hợp lệ!");
        return;
      }

      if (amountNum < minNum * recipientsNum) {
        setError(
          `Tổng tiền phải >= ${minNum * recipientsNum} SUI (${recipientsNum} người × ${minNum} SUI)`
        );
        return;
      }
    }

    // Validate NFT mode - check addresses
    if (protectionMode === "2") {
      const validAddresses = nftRecipients.filter(addr => addr.trim() !== "");
      if (validAddresses.length === 0) {
        setError("Vui lòng nhập ít nhất 1 địa chỉ ví để gửi NFT Ticket!");
        return;
      }
      
      const invalidAddresses = validAddresses.filter(addr => !isValidSuiAddress(addr.trim()));
      if (invalidAddresses.length > 0) {
        setError(`Địa chỉ ví không hợp lệ: ${invalidAddresses.join(", ")}\nĐịa chỉ Sui phải bắt đầu bằng 0x và có 64 ký tự hex`);
        return;
      }

      // Check duplicates
      const uniqueAddresses = new Set(validAddresses.map(a => a.trim().toLowerCase()));
      if (uniqueAddresses.size !== validAddresses.length) {
        setError("Có địa chỉ ví bị trùng lặp!");
        return;
      }
    }

    if (!currentAccount) {
      setError("Vui lòng kết nối ví Sui trước khi tạo lì xì!");
      return;
    }

    setError("");
    setWaitingForTxn(true);

    try {
      const amountInMist = toMist(totalAmount);
      const minInMist = distributionMode === "1" ? toMist(minAmount) : 0n;
      const maxInMist = distributionMode === "1" ? toMist(maxAmount) : 0n;

      const balance = await suiClient.getBalance({
        owner: currentAccount.address,
        coinType: "0x2::sui::SUI",
      });

      const totalBalance = BigInt(balance.totalBalance);
      const requiredAmount = amountInMist;
      const gasBuffer = 100_000_000n;

      if (requiredAmount === 0n) {
        setError("Số lượng SUI không hợp lệ!");
        setWaitingForTxn(false);
        return;
      }

      if (totalBalance < requiredAmount + gasBuffer) {
        const neededSui = formatSui(requiredAmount + gasBuffer).toFixed(3);
        const currentSui = formatSui(totalBalance).toFixed(3);
        setError(
          `Ví cần ít nhất ${neededSui} SUI (đang có ${currentSui} SUI). Hãy nạp thêm để tạo lì xì!`
        );
        setWaitingForTxn(false);
        return;
      }

      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [requiredAmount]);
      const creatorEmail =
        user?.email || `${currentAccount.address.slice(0, 8)}@wallet.sui`;

      // Choose function based on protection mode
      if (protectionMode === "2") {
        // NFT Ticket mode
        const validAddresses = nftRecipients.filter(addr => addr.trim() !== "").map(a => a.trim());
        const ticketImageUrl = "https://i.imgur.com/7Z9YQZX.png"; // Default ticket image
        
        tx.moveCall({
          target: `${packageId}::sui_lixi::create_lixi_with_nft`,
          arguments: [
            coin,
            tx.pure.string(creatorEmail),
            tx.pure.u64(validAddresses.length), // max_recipients = number of NFT tickets
            tx.pure.u8(parseInt(distributionMode, 10)),
            tx.pure.u64(minInMist),
            tx.pure.u64(maxInMist),
            tx.pure.string(message),
            tx.pure.vector("address", validAddresses),
            tx.pure.string(ticketImageUrl),  // Thêm ticket image URL
            tx.pure.u64(expiryNum),
            tx.object("0x6"),
          ],
        });
      } else {
        // No protection or Password mode
        tx.moveCall({
          target: `${packageId}::sui_lixi::create_lixi`,
          arguments: [
            coin,
            tx.pure.string(creatorEmail),
            tx.pure.u64(recipientsNum),
            tx.pure.u8(parseInt(distributionMode, 10)),
            tx.pure.u64(minInMist),
            tx.pure.u64(maxInMist),
            tx.pure.string(message),
            tx.pure.string(protectionMode === "1" ? password : ""),  // Password only if mode is 1
            tx.pure.u64(expiryNum),
            tx.object("0x6"),
          ],
        });
      }

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("✅ Transaction submitted:", result.digest);

            suiClient
              .waitForTransaction({
                digest: result.digest,
                options: {
                  showEffects: true,
                  showObjectChanges: true,
                  showEvents: true,
                  showInput: true,
                  showBalanceChanges: true,
                },
              })
              .then((txResult) => {
                console.log(
                  "📋 Full Transaction result:",
                  JSON.stringify(txResult, null, 2)
                );
                console.log("📋 Effects:", txResult.effects);
                console.log("📋 Object changes:", txResult.objectChanges);
                console.log("📋 Events:", txResult.events);

                if (txResult.effects?.status?.status !== "success") {
                  console.error("❌ Transaction failed:", txResult.effects?.status);
                  setError(
                    `Transaction failed: ${JSON.stringify(
                      txResult.effects?.status
                    )}`
                  );
                  setWaitingForTxn(false);
                  return;
                }

                const createdObjects = txResult.objectChanges?.filter(
                  (obj: any) => obj.type === "created"
                );

                console.log("🔍 Created objects:", createdObjects);

                if (createdObjects && createdObjects.length > 0) {
                  const sharedObj = createdObjects.find(
                    (obj: any) =>
                      obj.owner &&
                      typeof obj.owner === "object" &&
                      "Shared" in obj.owner
                  );

                  const lixiId = sharedObj
                    ? (sharedObj as any).objectId
                    : (createdObjects[0] as any).objectId;

                  console.log("✅ Lì xì đã tạo thành công!");
                  console.log("Lixi ID:", lixiId);
                  console.log("Digest:", txResult.digest);
                  
                  // Add immediate notification
                  addNotification({
                    type: 'lixi_created',
                    title: 'Đã tạo bao lì xì',
                    message: `Đã trừ ${totalAmount} SUI để tạo bao lì xì.`,
                    lixiId: lixiId,
                    amount: totalAmount,
                    txDigest: txResult.digest,
                  });
                  addHistoryEntry({
                    title: 'Tạo lì xì',
                    amount: `-${totalAmount} SUI`,
                    direction: 'debit',
                  });
                  
                  toast.success(`🧧 Đã tạo lì xì ${totalAmount} SUI!`, {
                    duration: 4000,
                  });
                  
                  confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                  });
                  onCreated(lixiId, "lixi");
                } else {
                  console.error("❌ Không tìm thấy object được tạo trong transaction!");
                  console.log(
                    "All object changes:",
                    JSON.stringify(txResult.objectChanges, null, 2)
                  );
                  setError("Không thể tạo lì xì. Vui lòng thử lại!");
                }
                setWaitingForTxn(false);
              })
              .catch((err) => {
                console.error(err);
                setError("Giao dịch thất bại!");
                setWaitingForTxn(false);
              });
          },
          onError: (err: any) => {
            console.error(err);
            let errorMessage = "Có lỗi xảy ra. ";

            if (err.message && err.message.includes("Insufficient")) {
              errorMessage = "❌ Ví không đủ SUI!";
            } else if (err.message) {
              errorMessage += err.message;
            }

            setError(errorMessage);
            setWaitingForTxn(false);
          },
        }
      );
    } catch (err) {
      console.error(err);
      setError("Không thể kiểm tra số dư ví. Vui lòng thử lại!");
      setWaitingForTxn(false);
    }
  };

  const getProtectionLabel = () => {
    switch (protectionMode) {
      case "1": return "🔒 Mật khẩu";
      case "2": return "🎫 NFT Ticket";
      default: return "🌐 Công khai";
    }
  };

  const previewStats = [
    {
      label: "Tổng tiền",
      value: totalAmount ? `${totalAmount} SUI` : "Chưa nhập",
    },
    {
      label: "Người nhận",
      value: protectionMode === "2" 
        ? `${nftRecipients.filter(a => a.trim()).length} ticket` 
        : (maxRecipients ? `${maxRecipients} người` : "Chưa nhập"),
    },
    {
      label: "Thời hạn",
      value: expiryHours ? `${expiryHours} giờ` : "Chưa đặt",
    },
    {
      label: "Bảo mật",
      value: getProtectionLabel(),
    },
  ];

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fff7f2 0%, #ffe9db 100%)",
        padding: "56px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {[...Array(14)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
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
        animate={{ y: [0, -18, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "16%",
          left: "6%",
          fontSize: "72px",
          opacity: 0.18,
          pointerEvents: "none",
        }}
      >
        🧧
      </motion.div>
      <motion.div
        aria-hidden
        animate={{ y: [0, 20, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: "18%",
          right: "6%",
          fontSize: "64px",
          opacity: 0.18,
          pointerEvents: "none",
        }}
      >
        💰
      </motion.div>
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 1.1 }}
        style={{
          position: "absolute",
          inset: "-220px -200px auto auto",
          width: "520px",
          height: "520px",
          background: "radial-gradient(circle at 30% 30%, rgba(255, 107, 53, 0.2), transparent 60%)",
          filter: "blur(2px)",
        }}
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 1.2 }}
        style={{
          position: "absolute",
          inset: "auto auto -260px -220px",
          width: "520px",
          height: "520px",
          background: "radial-gradient(circle at 40% 40%, rgba(255, 180, 120, 0.22), transparent 62%)",
          filter: "blur(6px)",
        }}
      />
      <Container size="4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            onClick={onBack}
            variant="soft"
            size="3"
            style={{
              color: "#ff6b35",
              background: "rgba(255, 107, 53, 0.1)",
              marginBottom: "24px",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={20} />
            Quay lại
          </Button>

          <motion.div
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
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
                aria-hidden
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  top: "-120px",
                  right: "-120px",
                  width: "240px",
                  height: "240px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 30% 30%, rgba(255, 196, 153, 0.45), transparent 60%)",
                  filter: "blur(6px)",
                }}
              />
              <motion.div
                aria-hidden
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                style={{
                  position: "absolute",
                  bottom: "-100px",
                  left: "-80px",
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 40% 40%, rgba(255, 214, 180, 0.5), transparent 60%)",
                  filter: "blur(6px)",
                }}
              />

              <Flex align="center" gap="2" style={{ marginBottom: "1.25rem" }}>
                <Box
                  style={{
                    background: "rgba(255, 107, 53, 0.1)",
                    borderRadius: "999px",
                    padding: "0.45rem 1.1rem",
                    letterSpacing: "0.08em",
                    color: "#ff6b35",
                    fontWeight: 600,
                  }}
                >
                  Mùa lễ 2026
                </Box>
                <Box
                  style={{
                    background: "rgba(255, 107, 53, 0.08)",
                    borderRadius: "999px",
                    padding: "0.45rem 0.9rem",
                    fontWeight: 500,
                    color: "#ff6b35",
                  }}
                >
                  🎊 Bao lì xì số hóa
                </Box>
              </Flex>

              <Heading size="6" style={{ lineHeight: 1.2 }}>
                Chia sẻ may mắn cùng đồng đội
              </Heading>
              <Text
                size="3"
                style={{ marginTop: "0.75rem", lineHeight: 1.6, color: "#6b7280" }}
              >
                Dễ dàng tạo bao lì xì số, chọn chia đều hoặc may mắn và gửi link
                đến mọi người trong ví Sui.
              </Text>

              <Flex wrap="wrap" gap="2" style={{ marginTop: "1.25rem" }}>
                {[
                  { icon: "🧧", title: "Chia đều & may mắn" },
                  { icon: "⏱️", title: "Hẹn giờ đóng bao" },
                  { icon: "🔒", title: "Theo dõi minh bạch" },
                ].map((badge) => (
                  <motion.div
                    key={badge.title}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      background: "rgba(255, 107, 53, 0.08)",
                      borderRadius: "12px",
                      padding: "0.65rem 0.9rem",
                      color: "#9a3412",
                    }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    whileHover={{ y: -2, boxShadow: "0 10px 18px rgba(255, 166, 122, 0.25)" }}
                  >
                    <span style={{ fontSize: "1.35rem" }}>{badge.icon}</span>
                    <Text size="2" weight="medium" style={{ letterSpacing: "0.01em" }}>
                      {badge.title}
                    </Text>
                  </motion.div>
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
                <Text weight="bold" style={{ color: "#9a3412" }}>
                  Gợi ý nhanh
                </Text>
                <Text size="2" style={{ color: "#9a3412" }}>
                  Chừa tối thiểu 0.1 SUI phí gas để giao dịch mượt hơn.
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
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.45 }}
              >
                <Flex direction="column" gap="4">
                  <Box>
                    <Flex align="center" gap="3" style={{ marginBottom: "1.1rem" }}>
                      <div
                        style={{
                          fontSize: "56px",
                          background:
                            "linear-gradient(135deg, rgba(255, 107, 53, 0.12) 0%, rgba(247, 147, 30, 0.2) 100%)",
                          borderRadius: "18px",
                          padding: "1rem",
                        }}
                      >
                        🧧
                      </div>
                      <Box>
                        <Heading
                          size="6"
                          style={{ color: "#ff6b35", marginBottom: "0.35rem" }}
                        >
                          Tạo bao lì xì mới
                        </Heading>
                        <Text size="2" style={{ color: "#6f6f6f", lineHeight: 1.6 }}>
                          Điền thông tin chi tiết để phát hành phong bao đến mọi người.
                          Bạn luôn có thể điều chỉnh lại trước khi ký giao dịch.
                        </Text>
                      </Box>
                    </Flex>
                  </Box>

                  <Flex wrap="wrap" gap="2">
                    {previewStats.map((stat) => (
                      <Box
                        key={stat.label}
                        style={{
                          padding: "0.7rem 0.95rem",
                          borderRadius: "14px",
                          background:
                            "linear-gradient(135deg, rgba(255, 107, 53, 0.08) 0%, rgba(255, 214, 168, 0.22) 100%)",
                          border: "1px solid rgba(255, 165, 120, 0.24)",
                          minWidth: "140px",
                        }}
                      >
                        <Text
                          size="2"
                          style={{
                            color: "#ff6b35",
                            fontWeight: 600,
                            letterSpacing: "0.02em",
                          }}
                        >
                          {stat.label}
                        </Text>
                        <Text
                          size="3"
                          style={{ marginTop: "6px", color: "#1f2937", fontWeight: 500 }}
                        >
                          {stat.value}
                        </Text>
                      </Box>
                    ))}
                  </Flex>

                  <Separator my="2" style={{ background: "rgba(255, 164, 120, 0.22)" }} />

                  <Box
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    <Box>
                      <Flex gap="2" align="center" style={{ marginBottom: "8px" }}>
                        <Wallet size={16} style={{ color: "#ff6b35" }} />
                        <Text weight="medium">Tổng tiền (SUI)</Text>
                      </Flex>
                      <TextField.Root
                        placeholder="0.00"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        type="number"
                        step="0.01"
                        size="3"
                      />
                    </Box>

                    <Box>
                      <Flex gap="2" align="center" style={{ marginBottom: "8px" }}>
                        <Users size={16} style={{ color: "#ff6b35" }} />
                        <Text weight="medium">Số người nhận tối đa</Text>
                      </Flex>
                      <TextField.Root
                        placeholder="10"
                        value={maxRecipients}
                        onChange={(e) => setMaxRecipients(e.target.value)}
                        type="number"
                        size="3"
                      />
                    </Box>

                    <Box>
                      <Flex gap="2" align="center" style={{ marginBottom: "8px" }}>
                        <Clock size={16} style={{ color: "#ff6b35" }} />
                        <Text weight="medium">Hết hạn sau (giờ)</Text>
                      </Flex>
                      <TextField.Root
                        placeholder="24"
                        value={expiryHours}
                        onChange={(e) => setExpiryHours(e.target.value)}
                        type="number"
                        size="3"
                      />
                    </Box>

                    <Box>
                      <Flex gap="2" align="center" style={{ marginBottom: "8px" }}>
                        <Sparkles size={16} style={{ color: "#ff6b35" }} />
                        <Text weight="medium">Chế độ chia</Text>
                      </Flex>
                      <Select.Root
                        value={distributionMode}
                        onValueChange={setDistributionMode}
                        size="3"
                      >
                        <Select.Trigger style={{ width: "100%" }} />
                        <Select.Content>
                          <Select.Item value="0">⚖️ Chia đều</Select.Item>
                          <Select.Item value="1">🎲 Random (May mắn)</Select.Item>
                        </Select.Content>
                      </Select.Root>

                      <AnimatePresence>
                        {distributionMode === "1" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ marginTop: "0.75rem" }}
                          >
                            <Flex gap="3" wrap="wrap">
                              <Box style={{ flex: "1 1 120px" }}>
                                <Text size="2" weight="medium">
                                  Tối thiểu (SUI)
                                </Text>
                                <TextField.Root
                                  placeholder="0.01"
                                  value={minAmount}
                                  onChange={(e) => setMinAmount(e.target.value)}
                                  type="number"
                                  step="0.01"
                                  size="3"
                                  style={{ marginTop: "8px" }}
                                />
                              </Box>
                              <Box style={{ flex: "1 1 120px" }}>
                                <Text size="2" weight="medium">
                                  Tối đa (SUI)
                                </Text>
                                <TextField.Root
                                  placeholder="1.00"
                                  value={maxAmount}
                                  onChange={(e) => setMaxAmount(e.target.value)}
                                  type="number"
                                  step="0.01"
                                  size="3"
                                  style={{ marginTop: "8px" }}
                                />
                              </Box>
                            </Flex>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </Box>

                  <Separator my="2" style={{ background: "rgba(255, 164, 120, 0.22)" }} />

                  <Box>
                    <Flex gap="2" align="center" style={{ marginBottom: "8px" }}>
                      <MessageCircle size={16} style={{ color: "#ff6b35" }} />
                      <Text weight="medium">Lời chúc</Text>
                    </Flex>
                    <TextArea
                      placeholder="Chúc mừng năm mới! 🎉"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      size="3"
                      style={{ minHeight: "90px" }}
                    />
                  </Box>

                  <Separator my="2" style={{ background: "rgba(255, 164, 120, 0.22)" }} />

                  {/* Protection Mode Selection */}
                  <Box>
                    <Flex gap="2" align="center" style={{ marginBottom: "12px" }}>
                      <Shield size={16} style={{ color: "#ff6b35" }} />
                      <Text weight="medium">Bảo mật lì xì</Text>
                    </Flex>
                    
                    <Flex gap="2" wrap="wrap">
                      {[
                        { value: "0", label: "🌐 Công khai", desc: "Ai có link đều claim được" },
                        { value: "1", label: "🔒 Mật khẩu", desc: "Cần mật khẩu để claim" },
                        { value: "2", label: "🎫 NFT Ticket", desc: "Chỉ người có ticket claim được" },
                      ].map((mode) => (
                        <motion.button
                          key={mode.value}
                          onClick={() => setProtectionMode(mode.value)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            flex: "1 1 150px",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            border: protectionMode === mode.value 
                              ? "2px solid #ff6b35" 
                              : "2px solid rgba(255, 164, 120, 0.3)",
                            background: protectionMode === mode.value 
                              ? "rgba(255, 107, 53, 0.1)" 
                              : "rgba(255, 255, 255, 0.5)",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <Text weight="bold" style={{ color: "#1f2937", display: "block" }}>
                            {mode.label}
                          </Text>
                          <Text size="1" style={{ color: "#666", marginTop: "4px", display: "block" }}>
                            {mode.desc}
                          </Text>
                        </motion.button>
                      ))}
                    </Flex>

                    {/* Password input for password mode */}
                    <AnimatePresence>
                      {protectionMode === "1" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ marginTop: "16px" }}
                        >
                          <Flex gap="2" align="center" style={{ marginBottom: "8px" }}>
                            <span style={{ fontSize: "16px" }}>🔑</span>
                            <Text weight="medium">Mật khẩu bảo vệ</Text>
                          </Flex>
                          <TextField.Root
                            type="password"
                            placeholder="Nhập mật khẩu cho lì xì"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            size="3"
                          />
                          <Text size="1" style={{ color: "#888", marginTop: "6px", display: "block" }}>
                            💡 Chia sẻ mật khẩu này cho người bạn muốn gửi lì xì
                          </Text>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* NFT Recipients for NFT mode */}
                    <AnimatePresence>
                      {protectionMode === "2" && (
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
                              <Text weight="bold" style={{ color: "#9a3412" }}>
                                Địa chỉ ví nhận NFT Ticket
                              </Text>
                            </Flex>
                            
                            <Text size="1" style={{ color: "#666", marginBottom: "12px", display: "block" }}>
                              🎫 Mỗi địa chỉ sẽ nhận 1 NFT Ticket để claim lì xì. Ticket sẽ bị đốt khi claim.
                            </Text>

                            <Flex direction="column" gap="2">
                              {nftRecipients.map((address, index) => (
                                <Flex key={index} gap="2" align="center">
                                  <TextField.Root
                                    placeholder="0x..."
                                    value={address}
                                    onChange={(e) => updateNftRecipient(index, e.target.value)}
                                    size="2"
                                    style={{ flex: 1, fontFamily: "monospace", fontSize: "12px" }}
                                  />
                                  {nftRecipients.length > 1 && (
                                    <Button
                                      variant="soft"
                                      size="1"
                                      onClick={() => removeNftRecipient(index)}
                                      style={{ 
                                        color: "#c0392b", 
                                        background: "rgba(192, 57, 43, 0.1)",
                                        padding: "6px",
                                      }}
                                    >
                                      <X size={14} />
                                    </Button>
                                  )}
                                  {address && !isValidSuiAddress(address.trim()) && (
                                    <Text size="1" style={{ color: "#c0392b" }}>❌</Text>
                                  )}
                                  {address && isValidSuiAddress(address.trim()) && (
                                    <Text size="1" style={{ color: "#27ae60" }}>✓</Text>
                                  )}
                                </Flex>
                              ))}
                            </Flex>

                            <Button
                              variant="soft"
                              size="2"
                              onClick={addNftRecipient}
                              style={{ 
                                marginTop: "12px",
                                color: "#ff6b35", 
                                background: "rgba(255, 107, 53, 0.1)",
                                width: "100%",
                              }}
                            >
                              <Plus size={16} />
                              Thêm địa chỉ ví
                            </Button>

                            <Flex 
                              justify="between" 
                              align="center" 
                              style={{ 
                                marginTop: "12px", 
                                padding: "8px 12px", 
                                background: "rgba(255, 107, 53, 0.08)", 
                                borderRadius: "8px" 
                              }}
                            >
                              <Text size="2" style={{ color: "#9a3412" }}>
                                Tổng NFT Tickets:
                              </Text>
                              <Text size="2" weight="bold" style={{ color: "#ff6b35" }}>
                                {nftRecipients.filter(a => isValidSuiAddress(a.trim())).length} ticket
                              </Text>
                            </Flex>
                          </Box>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Box>

                  {error && (
                    <Box
                      style={{
                        padding: "12px",
                        background: "rgba(255, 107, 53, 0.08)",
                        borderRadius: "12px",
                        border: "1px solid rgba(255, 107, 53, 0.2)",
                      }}
                    >
                      <Text size="2" style={{ color: "#c0392b", whiteSpace: "pre-line" }}>
                        {error}
                      </Text>
                    </Box>
                  )}

                  <Button
                    onClick={handleCreateLixi}
                    disabled={waitingForTxn || !currentAccount}
                    size="4"
                    style={{
                      background: "linear-gradient(135deg, #ff6b35 0%, #ff9444 100%)",
                      cursor: waitingForTxn ? "not-allowed" : "pointer",
                      fontSize: "18px",
                      padding: "24px",
                      marginTop: "12px",
                      boxShadow: waitingForTxn
                        ? "none"
                        : "0 20px 45px rgba(255, 122, 60, 0.35)",
                    }}
                  >
                    {waitingForTxn ? (
                      <Flex gap="2" align="center" justify="center">
                        <ClipLoader size={20} color="#fff" />
                        <span>Đang tạo lì xì...</span>
                      </Flex>
                    ) : (
                      <Flex gap="2" align="center" justify="center">
                        <Gift size={20} />
                        <span>Tạo Bao Lì Xì</span>
                      </Flex>
                    )}
                  </Button>
                </Flex>
              </motion.div>
            </Box>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
}
