import { Box, Container, Heading, Text, Flex, Code } from "@radix-ui/themes";
import { useAuth } from "./contexts/AuthContext";

export function TestEncoding() {
  const { user } = useAuth();

  return (
    <Box style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
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
            🔤 Test Font Encoding
          </Heading>

          <Flex direction="column" gap="4">
            {/* Test Vietnamese Characters */}
            <Box>
              <Text size="2" weight="bold" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>
                Test tiếng Việt cơ bản:
              </Text>
              <Box style={{
                background: "#f0fdf4",
                padding: "1rem",
                borderRadius: "8px",
                border: "2px solid #86efac",
              }}>
                <Text size="4" style={{ fontFamily: "system-ui, -apple-system" }}>
                  Đặng Văn Chiến
                </Text>
              </Box>
            </Box>

            {/* Test from localStorage */}
            <Box>
              <Text size="2" weight="bold" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>
                Dữ liệu từ localStorage:
              </Text>
              <Box style={{
                background: "#fef3c7",
                padding: "1rem",
                borderRadius: "8px",
                border: "2px solid #fbbf24",
              }}>
                <Code style={{ fontSize: "0.9rem", wordBreak: "break-all" }}>
                  {localStorage.getItem('google_user') || 'Chưa có dữ liệu'}
                </Code>
              </Box>
            </Box>

            {/* Test from React state */}
            {user && (
              <Box>
                <Text size="2" weight="bold" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>
                  Dữ liệu từ React state:
                </Text>
                <Box style={{
                  background: "#f0f9ff",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "2px solid #bfdbfe",
                }}>
                  <Flex direction="column" gap="2">
                    <Text size="4" weight="bold" style={{ fontFamily: "system-ui, -apple-system" }}>
                      {user.name}
                    </Text>
                    <Text size="2" style={{ color: "#666" }}>
                      {user.email}
                    </Text>
                  </Flex>
                </Box>
              </Box>
            )}

            {/* Character code test */}
            {user && (
              <Box>
                <Text size="2" weight="bold" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>
                  Mã ký tự (Character codes):
                </Text>
                <Box style={{
                  background: "#fef2f2",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "2px solid #fecaca",
                }}>
                  <Code style={{ fontSize: "0.8rem", wordBreak: "break-all", whiteSpace: "pre-wrap" }}>
                    {user.name.split('').map((char, i) => 
                      `${char} (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`
                    ).join(' | ')}
                  </Code>
                </Box>
              </Box>
            )}

            {/* Expected result */}
            <Box>
              <Text size="2" weight="bold" style={{ color: "#666", display: "block", marginBottom: "0.5rem" }}>
                Kết quả mong đợi:
              </Text>
              <Box style={{
                background: "#f0fdf4",
                padding: "1rem",
                borderRadius: "8px",
                border: "3px solid #16a34a",
              }}>
                <Flex direction="column" gap="2">
                  <Text size="4" weight="bold" style={{ color: "#16a34a", fontFamily: "system-ui, -apple-system" }}>
                    ✅ Đặng Văn Chiến
                  </Text>
                  <Text size="2" style={{ color: "#15803d" }}>
                    Các ký tự: Đ, ă, ế, ế phải hiển thị đúng
                  </Text>
                </Flex>
              </Box>
            </Box>
          </Flex>
        </Box>
      </Container>
    </Box>
  );
}
