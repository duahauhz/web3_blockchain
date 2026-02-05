import { Box, Container, Heading, Text, Flex, Button, Code } from "@radix-ui/themes";
import { useAuth } from "./contexts/AuthContext";
import { useState, useEffect } from "react";

export function DebugAuth() {
  const { login } = useAuth();
  const [config, setConfig] = useState({
    origin: '',
    redirect_uri: '',
    client_id: '',
  });

  useEffect(() => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;
    
    setConfig({
      origin: window.location.origin,
      redirect_uri: REDIRECT_URI,
      client_id: GOOGLE_CLIENT_ID || '❌ CHƯA CẤU HÌNH',
    });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('✅ Đã copy!');
  };

  return (
    <Box style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "2rem",
    }}>
      <Container size="2">
        <Box style={{
          background: "white",
          borderRadius: "20px",
          padding: "2rem",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}>
          <Heading size="6" mb="4" style={{ color: "#ff6b35" }}>
            🔐 Debug Google OAuth Configuration
          </Heading>

          <Flex direction="column" gap="4">
            {/* Client ID */}
            <Box>
              <Text size="2" weight="bold" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>
                1️⃣ VITE_GOOGLE_CLIENT_ID:
              </Text>
              <Box style={{
                background: config.client_id.includes('❌') ? '#fff5f5' : '#f0f9ff',
                padding: "1rem",
                borderRadius: "8px",
                border: `2px solid ${config.client_id.includes('❌') ? '#fecaca' : '#bfdbfe'}`,
              }}>
                <Code style={{ fontSize: "0.9rem", wordBreak: "break-all" }}>
                  {config.client_id}
                </Code>
              </Box>
              {config.client_id.includes('❌') && (
                <Text size="2" style={{ color: "#dc2626", marginTop: "0.5rem", display: "block" }}>
                  ⚠️ Chưa có Client ID trong file .env!
                </Text>
              )}
            </Box>

            {/* Origin */}
            <Box>
              <Text size="2" weight="bold" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>
                2️⃣ Origin (JavaScript origins):
              </Text>
              <Flex gap="2">
                <Box style={{
                  background: "#f0f9ff",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "2px solid #bfdbfe",
                  flex: 1,
                }}>
                  <Code style={{ fontSize: "0.9rem" }}>
                    {config.origin}
                  </Code>
                </Box>
                <Button
                  size="2"
                  onClick={() => copyToClipboard(config.origin)}
                  style={{
                    background: "#ff6b35",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  📋 Copy
                </Button>
              </Flex>
            </Box>

            {/* Redirect URI */}
            <Box>
              <Text size="2" weight="bold" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>
                3️⃣ Redirect URI (QUAN TRỌNG NHẤT):
              </Text>
              <Flex gap="2">
                <Box style={{
                  background: "#fef3c7",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "3px solid #fbbf24",
                  flex: 1,
                }}>
                  <Code style={{ fontSize: "0.9rem", fontWeight: "bold" }}>
                    {config.redirect_uri}
                  </Code>
                </Box>
                <Button
                  size="2"
                  onClick={() => copyToClipboard(config.redirect_uri)}
                  style={{
                    background: "#fbbf24",
                    color: "#78350f",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  📋 Copy
                </Button>
              </Flex>
              <Text size="2" style={{ color: "#b45309", marginTop: "0.5rem", display: "block", fontWeight: 600 }}>
                ⚠️ ĐÂY LÀ URI BẠN CẦN THÊM VÀO GOOGLE CONSOLE!
              </Text>
            </Box>

            {/* Instructions */}
            <Box mt="4" p="4" style={{
              background: "#f0fdf4",
              borderRadius: "12px",
              border: "2px solid #86efac",
            }}>
              <Heading size="4" mb="3" style={{ color: "#16a34a" }}>
                📝 Các bước sửa lỗi:
              </Heading>
              
              <Flex direction="column" gap="3">
                <Box>
                  <Text size="2" weight="bold" style={{ color: "#15803d" }}>
                    Bước 1: Mở Google Cloud Console
                  </Text>
                  <Button
                    size="2"
                    mt="1"
                    onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                    style={{
                      background: "#16a34a",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    🔗 Mở Google Console
                  </Button>
                </Box>

                <Box>
                  <Text size="2" weight="bold" style={{ color: "#15803d" }}>
                    Bước 2: Click vào OAuth Client ID đã tạo
                  </Text>
                </Box>

                <Box>
                  <Text size="2" weight="bold" style={{ color: "#15803d" }}>
                    Bước 3: Thêm vào "Authorized JavaScript origins"
                  </Text>
                  <Box mt="1" p="2" style={{ background: "white", borderRadius: "6px" }}>
                    <Code>{config.origin}</Code>
                  </Box>
                </Box>

                <Box>
                  <Text size="2" weight="bold" style={{ color: "#15803d" }}>
                    Bước 4: Thêm vào "Authorized redirect URIs"
                  </Text>
                  <Box mt="1" p="2" style={{ background: "#fef3c7", borderRadius: "6px", border: "2px solid #fbbf24" }}>
                    <Code style={{ fontWeight: "bold" }}>{config.redirect_uri}</Code>
                  </Box>
                </Box>

                <Box>
                  <Text size="2" weight="bold" style={{ color: "#15803d" }}>
                    Bước 5: Click "Save"
                  </Text>
                  <Text size="2" style={{ color: "#16a34a", marginTop: "0.5rem" }}>
                    Đợi 1-2 phút để Google cập nhật
                  </Text>
                </Box>

                <Box>
                  <Text size="2" weight="bold" style={{ color: "#15803d" }}>
                    Bước 6: Thử đăng nhập
                  </Text>
                  <Button
                    size="3"
                    mt="2"
                    onClick={login}
                    disabled={config.client_id.includes('❌')}
                    style={{
                      background: config.client_id.includes('❌') 
                        ? "#ccc" 
                        : "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                      color: "white",
                      cursor: config.client_id.includes('❌') ? "not-allowed" : "pointer",
                      width: "100%",
                    }}
                  >
                    🔑 Test Đăng nhập Google
                  </Button>
                </Box>
              </Flex>
            </Box>

            {/* Common Issues */}
            <Box mt="2" p="3" style={{
              background: "#fef2f2",
              borderRadius: "8px",
              border: "1px solid #fecaca",
            }}>
              <Text size="2" weight="bold" style={{ color: "#dc2626", display: "block", marginBottom: "0.5rem" }}>
                ⚠️ Các lỗi thường gặp:
              </Text>
              <Flex direction="column" gap="2">
                <Text size="2" style={{ color: "#991b1b" }}>
                  • <strong>redirect_uri_mismatch</strong>: URI chưa được thêm vào Google Console
                </Text>
                <Text size="2" style={{ color: "#991b1b" }}>
                  • <strong>URI khác port</strong>: Dev server có thể chạy ở 5173/5174/5175 → thêm cả 3!
                </Text>
                <Text size="2" style={{ color: "#991b1b" }}>
                  • <strong>Sai chính tả</strong>: Phải copy y chang, không thêm/bớt ký tự
                </Text>
              </Flex>
            </Box>
          </Flex>
        </Box>
      </Container>
    </Box>
  );
}
