import { useEffect, useMemo, useState } from "react";
import { Box, Button, Container, Flex, Heading, Text, Badge } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { motion } from "framer-motion";
import { Lock, RefreshCw, Share2, Clock, Users, Wallet, Copy, Check, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

interface LixiManageProps {
  onBack: () => void;
}

export function LixiManage({ onBack }: LixiManageProps) {
  const packageId = useNetworkVariable("helloWorldPackageId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [lixiId, setLixiId] = useState("");
  const [lixiData, setLixiData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [claimers, setClaimers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let idFromUrl = params.get("id");
    if (!idFromUrl && window.location.hash) {
      const hashQuery = window.location.hash.split("?")[1];
      if (hashQuery) {
        const hashParams = new URLSearchParams(hashQuery);
        idFromUrl = hashParams.get("id");
      }
    }
    if (idFromUrl) {
      setLixiId(idFromUrl);
    }
  }, []);

  const isCreator = useMemo(() => {
    if (!currentAccount || !lixiData) return false;
    return lixiData.creator === currentAccount.address;
  }, [currentAccount, lixiData]);

  const refreshLixi = async () => {
    if (!lixiId) return;
    setLoading(true);
    setError("");

    try {
      const obj = await suiClient.getObject({
        id: lixiId,
        options: { showContent: true, showOwner: true },
      });

      const content = obj.data?.content;
      if (!content || content.dataType !== "moveObject") {
        setError("Không tìm thấy bao lì xì.");
        setLoading(false);
        return;
      }

      const fields = (content.fields as any) || {};
      setLixiData(fields);

      if (fields.expiry_timestamp) {
        const expiry = Number(fields.expiry_timestamp);
        const now = Date.now();
        if (expiry <= now) {
          setTimeLeft("Đã hết hạn");
        } else {
          const diff = expiry - now;
          const hours = Math.floor(diff / 3_600_000);
          const minutes = Math.floor((diff % 3_600_000) / 60_000);
          setTimeLeft(`${hours}h ${minutes}m`);
        }
      } else {
        setTimeLeft("");
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải bao lì xì.");
    } finally {
      setLoading(false);
    }
  };

  const loadClaimers = async () => {
    if (!packageId || !lixiId) return;
    try {
      const events = await suiClient.queryEvents({
        query: { MoveEventType: `${packageId}::sui_lixi::LixiClaimedEvent` },
        limit: 50,
        order: "descending",
      });

      const filtered = events.data.filter((event) => {
        const data = event.parsedJson as any;
        return data?.lixi_id === lixiId;
      });

      setClaimers(
        filtered.map((event) => {
          const data = event.parsedJson as any;
          return {
            claimer: data?.claimer,
            email: data?.claimer_email,
            amount: data?.amount ? (Number(data.amount) / 1_000_000_000).toFixed(4) : "0.0000",
            timestamp: event.timestampMs ? Number(event.timestampMs) : Date.now(),
          };
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (lixiId) {
      refreshLixi();
      loadClaimers();
      const interval = setInterval(() => {
        refreshLixi();
        loadClaimers();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [lixiId]);

  const handleLock = () => {
    if (!isCreator || !lixiId) return;
    setWaiting(true);
    setError("");

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::sui_lixi::lock_lixi`,
      arguments: [tx.object(lixiId), tx.object("0x6")],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          suiClient
            .waitForTransaction({
              digest: result.digest,
              options: { showEffects: true, showEvents: true },
            })
            .then((txResult) => {
              if (txResult.effects?.status?.status !== "success") {
                setError("Khoá lì xì thất bại. Vui lòng thử lại!");
                setWaiting(false);
                return;
              }
              toast.success("Đã khóa bao lì xì thành công!", {
                icon: "🔒",
                duration: 3000,
              });
              refreshLixi();
              loadClaimers();
              setWaiting(false);
            })
            .catch(() => {
              setError("Khoá lì xì thất bại. Vui lòng thử lại!");
              setWaiting(false);
            });
        },
        onError: () => {
          setError("Khoá lì xì thất bại. Vui lòng thử lại!");
          setWaiting(false);
        },
      }
    );
  };

  const handleReclaim = () => {
    if (!isCreator || !lixiId) return;
    setWaiting(true);
    setError("");

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::sui_lixi::reclaim_expired_lixi`,
      arguments: [tx.object(lixiId), tx.object("0x6")],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          suiClient
            .waitForTransaction({
              digest: result.digest,
              options: { showEffects: true, showEvents: true },
            })
            .then((txResult) => {
              if (txResult.effects?.status?.status !== "success") {
                setError("Hoàn lại thất bại. Vui lòng thử lại!");
                setWaiting(false);
                return;
              }

              refreshLixi();
              loadClaimers();
              setWaiting(false);
            })
            .catch(() => {
              setError("Hoàn lại thất bại. Vui lòng thử lại!");
              setWaiting(false);
            });
        },
        onError: () => {
          setError("Hoàn lại thất bại. Vui lòng thử lại!");
          setWaiting(false);
        },
      }
    );
  };

  const totalAmount = lixiData?.total_amount
    ? (Number(lixiData.total_amount) / 1_000_000_000).toFixed(4)
    : "0.0000";
  const remainingAmount = lixiData?.remaining_amount
    ? (Number(lixiData.remaining_amount) / 1_000_000_000).toFixed(4)
    : "0.0000";
  const expiryTimestamp = lixiData?.expiry_timestamp ? Number(lixiData.expiry_timestamp) : 0;
  const isExpired = expiryTimestamp > 0 && expiryTimestamp <= Date.now();
  const claimedCount = lixiData?.claimed_count || 0;
  const maxRecipients = lixiData?.max_recipients || 0;
  const isActive = lixiData?.is_active;
  const distributionMode = lixiData?.distribution_mode === 0 ? "Chia đều" : "May mắn";
  const message = lixiData?.message || "";
  const claimLink = `${window.location.origin}/#/claim-lixi?id=${lixiId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(claimLink);
    setCopied(true);
    toast.success("Đã copy link nhận lì xì!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shortenAddress = (addr: string) => {
    if (!addr) return "--";
    if (addr.length < 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #ffffff 0%, #fef9f6 100%)",
        position: "relative",
        overflow: "hidden",
        padding: "56px 20px",
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
      <Container size="4" style={{ position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="soft"
            size="3"
            onClick={onBack}
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "32px",
            padding: "32px",
            border: "1px solid rgba(255, 167, 123, 0.25)",
            boxShadow: "0 30px 80px rgba(255, 166, 122, 0.25)",
          }}
        >
          <Flex direction="column" gap="5">
            {/* Header */}
            <Flex justify="between" align="center" wrap="wrap" gap="3">
              <Box>
                <Heading size="7" style={{ color: "#ff6b35", marginBottom: "8px" }}>
                  🧧 Theo dõi bao lì xì
                </Heading>
                {message && (
                  <Text size="3" style={{ color: "#666", fontStyle: "italic" }}>
                    "{message}"
                  </Text>
                )}
              </Box>
              {isActive !== undefined && (
                <Badge size="3" color={isActive ? "green" : "gray"} variant="soft" style={{ padding: "8px 16px" }}>
                  {isActive ? "🟢 Đang hoạt động" : "🔒 Đã khóa"}
                </Badge>
              )}
            </Flex>

            {!lixiId && (
              <Box style={{ padding: "20px", background: "rgba(255, 107, 53, 0.1)", borderRadius: "12px" }}>
                <Text>❌ Không tìm thấy ID bao lì xì.</Text>
              </Box>
            )}

            {error && (
              <Box style={{ padding: "16px", background: "rgba(220, 38, 38, 0.1)", borderRadius: "12px", border: "1px solid rgba(220, 38, 38, 0.3)" }}>
                <Text style={{ color: "#dc2626", fontWeight: 600 }}>⚠️ {error}</Text>
              </Box>
            )}

            {/* Stats Cards */}
            <Flex gap="4" wrap="wrap">
              <Box style={{ flex: "1 1 280px", background: "#fff", borderRadius: "20px", padding: "24px", border: "2px solid rgba(255, 167, 123, 0.3)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                <Flex align="center" gap="2" style={{ marginBottom: "12px" }}>
                  <Wallet size={20} color="#ff6b35" />
                  <Text size="2" weight="bold" style={{ color: "#ff6b35" }}>Tổng tiền</Text>
                </Flex>
                <Heading size="6" style={{ color: "#1a1a1a", marginBottom: "4px" }}>{totalAmount} SUI</Heading>
                <Text size="2" style={{ color: remainingAmount === "0.0000" ? "#dc2626" : "#16a34a" }}>
                  Còn lại: <strong>{remainingAmount} SUI</strong>
                </Text>
              </Box>
              
              <Box style={{ flex: "1 1 280px", background: "#fff", borderRadius: "20px", padding: "24px", border: "2px solid rgba(255, 167, 123, 0.3)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                <Flex align="center" gap="2" style={{ marginBottom: "12px" }}>
                  <Users size={20} color="#ff6b35" />
                  <Text size="2" weight="bold" style={{ color: "#ff6b35" }}>Người đã nhận</Text>
                </Flex>
                <Heading size="6" style={{ color: "#1a1a1a", marginBottom: "4px" }}>
                  {claimedCount}/{maxRecipients}
                </Heading>
                <Text size="2" style={{ color: "#6b7280" }}>
                  Chế độ: <strong>{distributionMode}</strong>
                </Text>
              </Box>
              
              <Box style={{ flex: "1 1 280px", background: "#fff", borderRadius: "20px", padding: "24px", border: "2px solid rgba(255, 167, 123, 0.3)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                <Flex align="center" gap="2" style={{ marginBottom: "12px" }}>
                  <Clock size={20} color="#ff6b35" />
                  <Text size="2" weight="bold" style={{ color: "#ff6b35" }}>Thời gian</Text>
                </Flex>
                <Heading size="6" style={{ color: isExpired ? "#dc2626" : "#16a34a", marginBottom: "4px" }}>
                  {timeLeft || "Đang tải..."}
                </Heading>
                <Text size="1" style={{ color: "#999", wordBreak: "break-all" }}>
                  ID: {lixiId ? shortenAddress(lixiId) : "--"}
                </Text>
              </Box>
            </Flex>

            {/* Share Link Section */}
            <Box style={{ background: "linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%)", borderRadius: "20px", padding: "24px", border: "2px dashed rgba(255, 107, 53, 0.4)" }}>
              <Flex align="center" gap="2" style={{ marginBottom: "12px" }}>
                <Share2 size={20} color="#ff6b35" />
                <Text size="3" weight="bold" style={{ color: "#ff6b35" }}>Chia sẻ link nhận lì xì</Text>
              </Flex>
              <Flex gap="3" align="center" wrap="wrap">
                <Box style={{ flex: "1 1 300px", background: "white", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255, 107, 53, 0.2)", wordBreak: "break-all", fontSize: "14px", color: "#666" }}>
                  {claimLink}
                </Box>
                <Button
                  size="3"
                  onClick={handleCopyLink}
                  style={{
                    background: copied ? "#16a34a" : "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                    color: "white",
                    cursor: "pointer",
                    minWidth: "140px",
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={18} /> Đã copy!
                    </>
                  ) : (
                    <>
                      <Copy size={18} /> Copy link
                    </>
                  )}
                </Button>
              </Flex>
            </Box>

            {/* Creator Actions */}
            {isCreator && (
              <Box style={{ background: "rgba(255, 107, 53, 0.05)", borderRadius: "20px", padding: "24px", border: "1px solid rgba(255, 107, 53, 0.2)" }}>
                <Text size="3" weight="bold" style={{ color: "#ff6b35", marginBottom: "16px", display: "block" }}>
                  ⚙️ Quản lý bao lì xì
                </Text>
                <Flex gap="3" wrap="wrap">
                  {isActive === true && (
                    <Button
                      size="3"
                      onClick={handleLock}
                      disabled={waiting}
                      style={{
                        background: waiting ? "#ccc" : "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                        color: "white",
                        cursor: waiting ? "not-allowed" : "pointer",
                      }}
                    >
                      <Lock size={18} />
                      {waiting ? "Đang xử lý..." : "Khóa lì xì ngay"}
                    </Button>
                  )}
                  
                  {(isExpired || !isActive) && Number(remainingAmount) > 0 && (
                    <Button
                      size="3"
                      onClick={handleReclaim}
                      disabled={waiting}
                      variant="soft"
                      style={{
                        borderColor: "rgba(255, 107, 53, 0.4)",
                        color: "#ff6b35",
                        cursor: waiting ? "not-allowed" : "pointer",
                        background: waiting ? "#f5f5f5" : "white",
                      }}
                    >
                      <RefreshCw size={18} />
                      {waiting ? "Đang hoàn..." : `Hoàn lại ${remainingAmount} SUI`}
                    </Button>
                  )}
                </Flex>
                <Text size="2" style={{ color: "#999", marginTop: "12px", display: "block" }}>
                  💡 Khóa lì xì để ngăn người khác nhận. Hoàn tiền khi đã khóa hoặc hết hạn.
                </Text>
              </Box>
            )}

            {!isCreator && lixiData && (
              <Box style={{ background: "rgba(59, 130, 246, 0.1)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                <Text size="2" style={{ color: "#2563eb" }}>
                  ℹ️ Bạn đang xem bao lì xì do người khác tạo. Chỉ người tạo mới có thể khóa/hoàn tiền.
                </Text>
              </Box>
            )}

            {/* Claimers History */}
            <Box style={{ background: "#fff", borderRadius: "20px", padding: "24px", border: "1px solid rgba(255, 167, 123, 0.25)" }}>
              <Flex justify="between" align="center" style={{ marginBottom: "16px" }}>
                <Heading size="4" style={{ color: "#ff6b35" }}>
                  📜 Lịch sử người nhận ({claimers.length})
                </Heading>
                {loading && (
                  <Text size="2" style={{ color: "#999" }}>⏳ Đang tải...</Text>
                )}
              </Flex>
              
              {claimers.length === 0 && !loading ? (
                <Box style={{ padding: "40px 20px", textAlign: "center", background: "rgba(255, 107, 53, 0.05)", borderRadius: "16px" }}>
                  <Text size="3" style={{ color: "#999" }}>
                    🎁 Chưa có ai nhận lì xì. Chia sẻ link để bắt đầu!
                  </Text>
                </Box>
              ) : (
                <Flex direction="column" gap="3">
                  {claimers.map((claimer, index) => (
                    <motion.div
                      key={`${claimer.claimer}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Flex justify="between" align="center" style={{
                        padding: "16px",
                        borderRadius: "16px",
                        background: "linear-gradient(135deg, rgba(255, 107, 53, 0.08) 0%, rgba(247, 147, 30, 0.08) 100%)",
                        border: "1px solid rgba(255, 107, 53, 0.15)",
                      }}>
                        <Box style={{ flex: 1 }}>
                          <Flex align="center" gap="2" style={{ marginBottom: "4px" }}>
                            <Text size="1" style={{ 
                              background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                              color: "white",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontWeight: "bold"
                            }}>
                              #{claimers.length - index}
                            </Text>
                            <Text size="3" weight="bold" style={{ color: "#1a1a1a" }}>
                              {claimer.email || shortenAddress(claimer.claimer)}
                            </Text>
                          </Flex>
                          {claimer.email && (
                            <Text size="1" style={{ color: "#999", fontFamily: "monospace" }}>
                              {shortenAddress(claimer.claimer)}
                            </Text>
                          )}
                          <Text size="1" style={{ color: "#999", marginTop: "4px" }}>
                            {new Date(claimer.timestamp).toLocaleString("vi-VN")}
                          </Text>
                        </Box>
                        <Box style={{ textAlign: "right" }}>
                          <Text size="4" weight="bold" style={{ 
                            color: "#16a34a",
                            display: "block",
                            marginBottom: "2px"
                          }}>
                            +{claimer.amount} SUI
                          </Text>
                          <Text size="1" style={{ color: "#999" }}>
                            Đã nhận
                          </Text>
                        </Box>
                      </Flex>
                    </motion.div>
                  ))}
                </Flex>
              )}
            </Box>
          </Flex>
        </motion.div>
      </Container>
    </Box>
  );
}
