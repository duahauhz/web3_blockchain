import { Box, Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { motion } from "framer-motion";
import { Copy, Info } from "lucide-react";
import { useState } from "react";

interface TestDataProps {
  onClose: () => void;
}

export function TestData({ onClose }: TestDataProps) {
  const [copied, setCopied] = useState<string>("");

  const testAccounts = [
    {
      name: "Test Account 1",
      address: "0x1df86dff70080b62d6c1ff103893392a4cdbb14c1dcd9ffff00394f5f8d655af",
      description: "Tài khoản test chính",
    },
    {
      name: "Test Account 2",
      address: "0x2df86dff70080b62d6c1ff103893392a4cdbb14c1dcd9ffff00394f5f8d655af",
      description: "Tài khoản test nhận quà",
    },
  ];

  const testGifts = [
    {
      id: "0x815ec36065c9d4199adbe48ff152581668ffe0d8edcb344585aa1839f3e9c15f",
      amount: "0.5 SUI",
      message: "Chúc mừng sinh nhật! 🎉",
      status: "Chưa mở",
    },
    {
      id: "0x915ec36065c9d4199adbe48ff152581668ffe0d8edcb344585aa1839f3e9c15f",
      amount: "1.0 SUI",
      message: "Happy New Year! 🎊",
      status: "Đã mở",
    },
  ];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <Box
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        backdropFilter: "blur(10px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "900px", width: "100%", maxHeight: "90vh", overflow: "auto" }}
      >
        <Box
          p="8"
          style={{
            background: "white",
            borderRadius: "25px",
            boxShadow: "0 30px 100px rgba(255, 107, 53, 0.5)",
            border: "3px solid #ff6b35",
          }}
        >
          <Flex justify="between" align="center" mb="6">
            <Heading size="7" style={{ color: "#ff6b35", fontWeight: 900 }}>
              📋 Dữ liệu Test
            </Heading>
            <Button
              variant="soft"
              onClick={onClose}
              style={{
                background: "rgba(255, 107, 53, 0.1)",
                color: "#ff6b35",
                fontWeight: 700,
              }}
            >
              Đóng
            </Button>
          </Flex>

          {/* Package Info */}
          <Box
            p="5"
            mb="6"
            style={{
              background: "linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(247, 147, 30, 0.1) 100%)",
              borderRadius: "15px",
              border: "2px solid rgba(255, 107, 53, 0.3)",
            }}
          >
            <Flex align="center" gap="2" mb="3">
              <Info size={24} color="#ff6b35" />
              <Heading size="4" style={{ color: "#ff6b35", fontWeight: 800 }}>
                Thông tin Package
              </Heading>
            </Flex>
            <Box mb="3">
              <Text size="2" weight="bold" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>
                Package ID:
              </Text>
              <Flex gap="2" align="center">
                <Box
                  p="2"
                  style={{
                    background: "white",
                    borderRadius: "8px",
                    flex: 1,
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    wordBreak: "break-all",
                    border: "1px solid #ddd",
                  }}
                >
                  0x815ec36065c9d4199adbe48ff152581668ffe0d8edcb344585aa1839f3e9c15f
                </Box>
                <Button
                  size="2"
                  onClick={() => handleCopy("0x815ec36065c9d4199adbe48ff152581668ffe0d8edcb344585aa1839f3e9c15f", "package")}
                  style={{
                    background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                    color: "white",
                    border: "none",
                  }}
                >
                  <Copy size={16} />
                  {copied === "package" ? "✓" : ""}
                </Button>
              </Flex>
            </Box>
            <Text size="2" style={{ color: "#666" }}>
              Network: <strong>Sui Testnet</strong>
            </Text>
          </Box>

          {/* Test Accounts */}
          <Box mb="6">
            <Heading size="4" mb="4" style={{ color: "#ff6b35", fontWeight: 800 }}>
              🔑 Tài khoản Test
            </Heading>
            <Flex direction="column" gap="3">
              {testAccounts.map((account, i) => (
                <Box
                  key={i}
                  p="4"
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "12px",
                    border: "2px solid rgba(255, 107, 53, 0.2)",
                  }}
                >
                  <Flex justify="between" align="center" mb="2">
                    <Text size="3" weight="bold" style={{ color: "#ff6b35" }}>
                      {account.name}
                    </Text>
                    <Button
                      size="1"
                      onClick={() => handleCopy(account.address, `account-${i}`)}
                      style={{
                        background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                        color: "white",
                        border: "none",
                        fontSize: "0.75rem",
                      }}
                    >
                      <Copy size={12} />
                      {copied === `account-${i}` ? "✓" : "Copy"}
                    </Button>
                  </Flex>
                  <Text size="1" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>
                    {account.description}
                  </Text>
                  <Text
                    size="1"
                    style={{
                      fontFamily: "monospace",
                      color: "#999",
                      wordBreak: "break-all",
                    }}
                  >
                    {account.address}
                  </Text>
                </Box>
              ))}
            </Flex>
          </Box>

          {/* Test Gifts */}
          <Box mb="6">
            <Heading size="4" mb="4" style={{ color: "#ff6b35", fontWeight: 800 }}>
              🎁 Gift ID Test
            </Heading>
            <Flex direction="column" gap="3">
              {testGifts.map((gift, i) => (
                <Box
                  key={i}
                  p="4"
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "12px",
                    border: "2px solid rgba(255, 107, 53, 0.2)",
                  }}
                >
                  <Flex justify="between" align="center" mb="2">
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="bold" style={{ color: "#ff6b35" }}>
                        {gift.amount}
                      </Text>
                      <Text size="1" style={{ color: "#666" }}>
                        {gift.message}
                      </Text>
                    </Flex>
                    <Flex direction="column" align="end" gap="1">
                      <Text
                        size="1"
                        style={{
                          background: gift.status === "Chưa mở" ? "#4caf50" : "#999",
                          color: "white",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "6px",
                          fontWeight: 600,
                        }}
                      >
                        {gift.status}
                      </Text>
                      <Button
                        size="1"
                        onClick={() => handleCopy(gift.id, `gift-${i}`)}
                        style={{
                          background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                          color: "white",
                          border: "none",
                          fontSize: "0.75rem",
                        }}
                      >
                        <Copy size={12} />
                        {copied === `gift-${i}` ? "✓" : "Copy ID"}
                      </Button>
                    </Flex>
                  </Flex>
                  <Text
                    size="1"
                    style={{
                      fontFamily: "monospace",
                      color: "#999",
                      wordBreak: "break-all",
                    }}
                  >
                    {gift.id}
                  </Text>
                </Box>
              ))}
            </Flex>
          </Box>

          {/* Instructions */}
          <Box
            p="4"
            style={{
              background: "rgba(255, 107, 53, 0.05)",
              borderRadius: "12px",
              border: "2px dashed #ff6b35",
            }}
          >
            <Heading size="3" mb="3" style={{ color: "#ff6b35", fontWeight: 700 }}>
              💡 Hướng dẫn Test
            </Heading>
            <Flex direction="column" gap="2">
              <Text size="2" style={{ color: "#666" }}>
                1. <strong>Tạo quà:</strong> Copy địa chỉ test account để điền vào "Người nhận"
              </Text>
              <Text size="2" style={{ color: "#666" }}>
                2. <strong>Nhận quà:</strong> Copy Gift ID test để mở quà
              </Text>
              <Text size="2" style={{ color: "#666" }}>
                3. <strong>Lấy SUI:</strong> Sử dụng faucet để lấy Testnet SUI
              </Text>
              <Text size="2" style={{ color: "#666" }}>
                4. <strong>Kết nối ví:</strong> Đảm bảo đã connect Sui Wallet
              </Text>
            </Flex>
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}
