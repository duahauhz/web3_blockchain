import { useSuiClientQuery, useCurrentAccount } from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { Box, Button, Container, Flex, Heading, Text, Card, Badge } from "@radix-ui/themes";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Gift, Mail, User, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import ClipLoader from "react-spinners/ClipLoader";

interface GiftManageProps {
  onBack: () => void;
}

export function GiftManage({ onBack }: GiftManageProps) {
  const currentAccount = useCurrentAccount();

  const [giftId, setGiftId] = useState("");

  // Tự động lấy Gift ID từ URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('id');
    if (idFromUrl) {
      setGiftId(idFromUrl);
    }
  }, []);

  const { data, isPending, error: queryError, refetch } = useSuiClientQuery(
    "getObject",
    {
      id: giftId,
      options: {
        showContent: true,
        showOwner: true,
      },
    },
    {
      enabled: !!giftId,
    }
  );

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
  const suiAmount = giftData?.content?.fields?.balance
    ? (parseInt(giftData.content.fields.balance) / 1_000_000_000).toFixed(4)
    : "0";

  const isCreator = giftData?.sender === currentAccount?.address;
  const giftStatus = giftData?.is_opened 
    ? { label: "Đã nhận", color: "green", icon: <CheckCircle size={20} /> }
    : parseInt(suiAmount) > 0
    ? { label: "Chờ nhận", color: "orange", icon: <Clock size={20} /> }
    : { label: "Đã trả lại", color: "red", icon: <XCircle size={20} /> };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const shareLink = `${window.location.origin}${window.location.pathname}#/claim?id=${giftId}`;

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "2rem 1rem",
      }}
    >
      <Container size="2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Flex direction="column" gap="5">
            {/* Header */}
            <Flex justify="between" align="center">
              <Button
                variant="soft"
                onClick={onBack}
                style={{
                  cursor: "pointer",
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  backdropFilter: "blur(10px)",
                }}
              >
                <ArrowLeft size={20} />
                Quay lại
              </Button>
              <Heading size="6" style={{ color: "white" }}>
                <Gift size={28} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
                Quản lý hộp quà
              </Heading>
              <Box style={{ width: "100px" }} />
            </Flex>

            {/* Main Content */}
            {!giftId ? (
              <Card style={{ background: "white", padding: "2rem", textAlign: "center" }}>
                <Text size="4" style={{ color: "#666" }}>
                  Không tìm thấy Gift ID trong URL
                </Text>
              </Card>
            ) : isPending ? (
              <Flex justify="center" align="center" style={{ minHeight: "300px" }}>
                <ClipLoader size={50} color="white" />
              </Flex>
            ) : queryError || !giftData ? (
              <Card style={{ background: "white", padding: "2rem", textAlign: "center" }}>
                <Text size="4" style={{ color: "#c00" }}>
                  ⚠️ Không tìm thấy quà hoặc quà không hợp lệ!
                </Text>
                <Button
                  size="3"
                  variant="soft"
                  onClick={() => onBack()}
                  style={{ marginTop: "1rem" }}
                >
                  Quay lại
                </Button>
              </Card>
            ) : !isCreator ? (
              <Card style={{ background: "white", padding: "2rem", textAlign: "center" }}>
                <Text size="4" style={{ color: "#c00" }}>
                  ⚠️ Bạn không phải người tạo quà này!
                </Text>
                <Button
                  size="3"
                  variant="soft"
                  onClick={() => onBack()}
                  style={{ marginTop: "1rem" }}
                >
                  Quay lại
                </Button>
              </Card>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Card
                  style={{
                    background: "white",
                    padding: "2rem",
                    borderRadius: "20px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                  }}
                >
                  <Flex direction="column" gap="4">
                    {/* Status Badge */}
                    <Flex justify="between" align="center">
                      <Heading size="5" style={{ color: "#333" }}>
                        Thông tin hộp quà
                      </Heading>
                      <Badge color={giftStatus.color as any} size="3" style={{ padding: "8px 16px" }}>
                        {giftStatus.icon}
                        <Text ml="2" weight="bold">{giftStatus.label}</Text>
                      </Badge>
                    </Flex>

                    {/* Gift Details */}
                    <Flex direction="column" gap="3" style={{ marginTop: "1rem" }}>
                      {/* Amount */}
                      <Box
                        p="4"
                        style={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          borderRadius: "12px",
                          textAlign: "center",
                        }}
                      >
                        <Text size="2" style={{ color: "rgba(255,255,255,0.8)", display: "block" }}>
                          Số tiền
                        </Text>
                        <Text size="8" weight="bold" style={{ color: "white", display: "block", marginTop: "4px" }}>
                          {suiAmount} SUI
                        </Text>
                      </Box>

                      {/* Recipient Email */}
                      <Box
                        p="3"
                        style={{
                          background: "#f8f9fa",
                          borderRadius: "10px",
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <Flex align="center" gap="2">
                          <Mail size={18} style={{ color: "#667eea" }} />
                          <Text size="2" weight="bold" style={{ color: "#666" }}>
                            Người nhận:
                          </Text>
                        </Flex>
                        <Text size="3" style={{ color: "#333", marginTop: "8px", wordBreak: "break-all" }}>
                          {giftData.recipient_email || "Không có email"}
                        </Text>
                      </Box>

                      {/* Message */}
                      <Box
                        p="3"
                        style={{
                          background: "#f8f9fa",
                          borderRadius: "10px",
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <Flex align="center" gap="2">
                          <Package size={18} style={{ color: "#667eea" }} />
                          <Text size="2" weight="bold" style={{ color: "#666" }}>
                            Lời nhắn:
                          </Text>
                        </Flex>
                        <Text size="3" style={{ color: "#333", marginTop: "8px" }}>
                          {giftData.message || "Không có lời nhắn"}
                        </Text>
                      </Box>

                      {/* Gift ID */}
                      <Box
                        p="3"
                        style={{
                          background: "#f8f9fa",
                          borderRadius: "10px",
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <Flex align="center" gap="2">
                          <User size={18} style={{ color: "#667eea" }} />
                          <Text size="2" weight="bold" style={{ color: "#666" }}>
                            Gift ID:
                          </Text>
                        </Flex>
                        <Flex gap="2" align="center" style={{ marginTop: "8px" }}>
                          <Text size="2" style={{ color: "#666", fontFamily: "monospace", wordBreak: "break-all", flex: 1 }}>
                            {giftId}
                          </Text>
                          <Button
                            size="1"
                            variant="soft"
                            onClick={() => {
                              copyToClipboard(giftId);
                            }}
                          >
                            Copy
                          </Button>
                        </Flex>
                      </Box>

                      {/* Share Link */}
                      {!giftData.is_opened && parseInt(suiAmount) > 0 && (
                        <Box
                          p="3"
                          style={{
                            background: "rgba(102, 126, 234, 0.1)",
                            borderRadius: "10px",
                            border: "2px solid #667eea",
                          }}
                        >
                          <Flex align="center" gap="2">
                            <Gift size={18} style={{ color: "#667eea" }} />
                            <Text size="2" weight="bold" style={{ color: "#667eea" }}>
                              Link nhận quà:
                            </Text>
                          </Flex>
                          <Flex gap="2" align="center" style={{ marginTop: "8px" }}>
                            <Text size="2" style={{ color: "#667eea", fontFamily: "monospace", wordBreak: "break-all", flex: 1 }}>
                              {shareLink}
                            </Text>
                            <Button
                              size="1"
                              style={{
                                background: "#667eea",
                                color: "white",
                              }}
                              onClick={() => {
                                copyToClipboard(shareLink);
                              }}
                            >
                              Copy Link
                            </Button>
                          </Flex>
                        </Box>
                      )}
                    </Flex>

                    {/* Refresh Button */}
                    <Button
                      size="3"
                      variant="soft"
                      onClick={() => refetch()}
                      style={{
                        marginTop: "1rem",
                        cursor: "pointer",
                      }}
                    >
                      🔄 Làm mới
                    </Button>
                  </Flex>
                </Card>
              </motion.div>
            )}
          </Flex>
        </motion.div>
      </Container>
    </Box>
  );
}
