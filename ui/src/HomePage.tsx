import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { motion } from "framer-motion";
import { Gift, Sparkles, Zap, Shield, Users, TrendingUp, Github, Twitter, Mail } from "lucide-react";

interface HomePageProps {
  onNavigate: (page: 'create' | 'claim') => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const currentAccount = useCurrentAccount();

  return (
    <Box style={{ 
      minHeight: "100vh",
      background: "linear-gradient(to bottom, #ffffff 0%, #fef9f6 100%)",
      position: "relative",
      overflow: "hidden"
    }}>
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

      {/* Navigation */}
      <Flex
        position="sticky" px="6" py="4" justify="between" align="center"
        style={{
          borderBottom: "2px solid rgba(255, 107, 53, 0.3)",
          backdropFilter: "blur(20px)",
          background: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 4px 30px rgba(255, 107, 53, 0.1)",
          zIndex: 100,
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Flex align="center" gap="3">
            <Box style={{
              background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
              padding: "0.5rem", borderRadius: "12px", display: "flex",
              boxShadow: "0 4px 15px rgba(255, 107, 53, 0.3)",
            }}>
              <Gift size={32} color="white" />
            </Box>
            <Box>
              <Heading size="6" style={{ color: "#ff6b35", fontWeight: 800, marginBottom: "-4px" }}>
                SuiGift
              </Heading>
              <Text size="1" style={{ color: "#f7931e", fontWeight: 600 }}>
                by Chain-Linkers
              </Text>
            </Box>
          </Flex>
        </motion.div>

        <Flex gap="3" align="center">
          {currentAccount && (
            <Button
              variant="soft" size="3"
              onClick={() => window.open(`https://faucet.sui.io/?address=${currentAccount.address}`, '_blank')}
              style={{
                background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                color: "white", border: "none", fontWeight: 600,
                boxShadow: "0 4px 15px rgba(255, 107, 53, 0.3)",
              }}
            >
              <Sparkles size={18} />
              Lấy Testnet SUI
            </Button>
          )}
          <ConnectButton />
        </Flex>
      </Flex>

      {/* Hero Section */}
      <Container size="4">
        <Flex direction="column" align="center" justify="center" style={{ minHeight: "80vh", paddingTop: "3rem" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: "center", maxWidth: "1000px", width: "100%" }}
          >
            {/* Simplified Icon */}
            <Box style={{
              display: "inline-flex", padding: "2rem",
              background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
              borderRadius: "25px",
              boxShadow: "0 20px 60px rgba(255, 107, 53, 0.3)",
              marginBottom: "2rem",
            }}>
              <Gift size={70} color="white" strokeWidth={2.5} />
            </Box>

            <Heading size="9" mb="4" style={{ 
              color: "#1a1a1a", fontWeight: 900,
              lineHeight: 1.2, 
              fontSize: "3.5rem",
            }}>
              Tặng quà kỹ thuật số{" "}
              <span style={{
                background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                trong nháy mắt
              </span>
            </Heading>

            <Text size="5" style={{ 
              color: "#888", lineHeight: 1.8, fontWeight: 500,
              maxWidth: "600px", 
              margin: "0 auto",
              marginBottom: "3rem",
              fontSize: "1.1rem",
              fontStyle: "italic",
              opacity: 0.85,
              display: "block",
            }}>
              Gửi SUI token như một món quà đặc biệt trên blockchain Sui
            </Text>

            {/* Main CTA Buttons */}
            {currentAccount ? (
              <Flex gap="4" justify="center" wrap="wrap" style={{ marginBottom: "3rem" }}>
                <motion.div 
                  whileHover={{ scale: 1.05, y: -3 }} 
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button size="4" onClick={() => onNavigate('create')} style={{
                    background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                    color: "white", padding: "2rem 4rem",
                    fontSize: "1.3rem", fontWeight: 800, borderRadius: "20px",
                    cursor: "pointer",
                    boxShadow: "0 15px 40px rgba(255, 107, 53, 0.35)",
                    border: "none",
                    position: "relative",
                    overflow: "hidden",
                    letterSpacing: "0.5px",
                  }}>
                    <Flex align="center" gap="3">
                      <Gift size={32} />
                      Tạo hộp quà
                    </Flex>
                  </Button>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05, y: -3 }} 
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button size="4" onClick={() => onNavigate('claim')} style={{
                    background: "white",
                    color: "#ff6b35", padding: "2rem 4rem",
                    fontSize: "1.3rem", fontWeight: 800, borderRadius: "20px",
                    cursor: "pointer", border: "3px solid #ff6b35",
                    boxShadow: "0 15px 40px rgba(255, 107, 53, 0.2)",
                    letterSpacing: "0.5px",
                  }}>
                    <Flex align="center" gap="3">
                      <Sparkles size={32} />
                      Nhận quà
                    </Flex>
                  </Button>
                </motion.div>
              </Flex>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <Box p="6" style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "20px", border: "2px solid rgba(255, 107, 53, 0.2)",
                  maxWidth: "450px", margin: "0 auto",
                  boxShadow: "0 15px 50px rgba(0, 0, 0, 0.08)",
                }}>
                  <Text size="4" mb="4" weight="bold" style={{ color: "#333", textAlign: "center", display: "block" }}>
                    Kết nối ví để bắt đầu 🚀
                  </Text>
                  <Flex justify="center">
                    <ConnectButton />
                  </Flex>
                </Box>
              </motion.div>
            )}

            {/* Feature Highlights - Compact */}
            <Flex gap="6" justify="center" wrap="wrap" style={{ maxWidth: "900px", margin: "0 auto" }}>
              {[
                { icon: Zap, text: "Siêu nhanh", desc: "2-3 giây" },
                { icon: Shield, text: "An toàn", desc: "Blockchain Sui" },
                { icon: Gift, text: "Dễ dàng", desc: "Vài click" }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -5,
                    boxShadow: "0 20px 50px rgba(255, 107, 53, 0.25)"
                  }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.2 + i * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  style={{ 
                    flex: "1 1 220px", 
                    minWidth: "200px",
                    boxShadow: "0 10px 30px rgba(255, 107, 53, 0.15)"
                  }}
                >
                  <Flex direction="column" align="center" gap="3" style={{
                    padding: "2rem 1.5rem",
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)",
                    borderRadius: "20px",
                    border: "2px solid rgba(255, 107, 53, 0.2)",
                    boxShadow: "0 10px 30px rgba(255, 107, 53, 0.15)",
                    backdropFilter: "blur(10px)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    {/* Subtle gradient overlay on hover */}
                    <motion.div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(247, 147, 30, 0.05) 100%)",
                        opacity: 0,
                      }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    
                    <Box style={{
                      background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                      padding: "1rem",
                      borderRadius: "15px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 20px rgba(255, 107, 53, 0.3)",
                      position: "relative",
                      zIndex: 1,
                    }}>
                      <feature.icon size={36} color="white" strokeWidth={2.5} />
                    </Box>
                    
                    <Box style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                      <Text size="4" weight="bold" style={{ color: "#1a1a1a", display: "block", marginBottom: "0.25rem" }}>
                        {feature.text}
                      </Text>
                      <Text size="2" style={{ color: "#666", display: "block" }}>
                        {feature.desc}
                      </Text>
                    </Box>
                  </Flex>
                </motion.div>
              ))}
            </Flex>
          </motion.div>

          {/* Stats - Moved up and simplified */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ marginTop: "4rem" }}
          >
            <Flex gap="8" justify="center" wrap="wrap">
              {[
                { label: "Quà đã gửi", value: "1,234+", icon: Gift },
                { label: "Người dùng", value: "567+", icon: Users },
                { label: "SUI chuyển", value: "89.5K", icon: TrendingUp },
              ].map((stat, i) => (
                <Flex key={i} direction="column" align="center" gap="1">
                  <Text size="6" weight="bold" style={{ color: "#ff6b35" }}>
                    {stat.value}
                  </Text>
                  <Text size="2" style={{ color: "#999" }}>
                    {stat.label}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </motion.div>
        </Flex>
      </Container>

      {/* Footer */}
      <Box mt="9" py="8" style={{
        background: "rgba(255, 255, 255, 0.95)",
        borderTop: "3px solid rgba(255, 107, 53, 0.3)",
        backdropFilter: "blur(20px)",
      }}>
        <Container size="4">
          <Flex direction="column" gap="6">
            <Flex justify="between" wrap="wrap" gap="6">
              <Box style={{ flex: "1 1 300px" }}>
                <Flex align="center" gap="2" mb="3">
                  <Box style={{
                    background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                    padding: "0.5rem", borderRadius: "10px",
                  }}>
                    <Gift size={24} color="white" />
                  </Box>
                  <Heading size="5" style={{ color: "#ff6b35", fontWeight: 800 }}>
                    SuiGift
                  </Heading>
                </Flex>
                <Text size="2" style={{ color: "#666", lineHeight: 1.6 }}>
                  Nền tảng tặng quà kỹ thuật số đầu tiên trên Sui Blockchain.
                  Được phát triển bởi đội ngũ Chain-Linkers với sự đam mê blockchain và công nghệ.
                </Text>
              </Box>

              <Box style={{ flex: "1 1 200px" }}>
                <Heading size="3" mb="3" style={{ color: "#ff6b35", fontWeight: 700 }}>
                  Liên kết
                </Heading>
                <Flex direction="column" gap="2">
                  {["Tài liệu", "API", "Hỗ trợ", "Blog"].map((link) => (
                    <Text key={link} size="2" style={{ color: "#666", cursor: "pointer" }}>
                      • {link}
                    </Text>
                  ))}
                </Flex>
              </Box>

              <Box style={{ flex: "1 1 200px" }}>
                <Heading size="3" mb="3" style={{ color: "#ff6b35", fontWeight: 700 }}>
                  Chain-Linkers Team
                </Heading>
                <Text size="2" mb="2" style={{ color: "#666" }}>
                  Đội ngũ phát triển blockchain từ Việt Nam
                </Text>
                <Flex gap="3" mt="3">
                  {[Github, Twitter, Mail].map((Icon, i) => (
                    <Box key={i} style={{
                      background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                      padding: "0.5rem", borderRadius: "8px", cursor: "pointer",
                    }}>
                      <Icon size={20} color="white" />
                    </Box>
                  ))}
                </Flex>
              </Box>
            </Flex>

            <Flex justify="between" align="center" wrap="wrap" gap="3" pt="5" style={{
              borderTop: "2px solid rgba(255, 107, 53, 0.2)",
            }}>
              <Text size="2" style={{ color: "#666" }}>
                © 2026 SuiGift by Chain-Linkers. All rights reserved.
              </Text>
              <Flex gap="4">
                <Text size="2" style={{ color: "#666", cursor: "pointer" }}>Privacy Policy</Text>
                <Text size="2" style={{ color: "#666", cursor: "pointer" }}>Terms of Service</Text>
              </Flex>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
