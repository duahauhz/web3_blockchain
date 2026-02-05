import { useMemo, useState } from "react";
import { Box, Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { motion } from "framer-motion";
import { useNotifications } from "./contexts/NotificationContext";
import { ArrowLeft } from "lucide-react";

interface TransactionsProps {
  onBack: () => void;
}

type FilterType = "all" | "debit" | "credit" | "refund";

export function Transactions({ onBack }: TransactionsProps) {
  const { history, balance } = useNotifications();
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return history;
    return history.filter((item) => item.direction === filter);
  }, [history, filter]);

  const totals = useMemo(() => {
    const sum = { debit: 0, credit: 0, refund: 0 };
    history.forEach((item) => {
      const value = parseFloat(item.amount.replace(/[^0-9.-]/g, "")) || 0;
      if (item.direction === "debit") sum.debit += value;
      if (item.direction === "credit") sum.credit += value;
      if (item.direction === "refund") sum.refund += value;
    });
    return sum;
  }, [history]);

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fff7f2 0%, #ffe9db 100%)",
        padding: "56px 20px",
      }}
    >
      <Container size="4">
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
            maxWidth: "1100px",
            margin: "0 auto",
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "32px",
            padding: "28px",
            border: "1px solid rgba(255, 167, 123, 0.25)",
            boxShadow: "0 30px 80px rgba(255, 166, 122, 0.25)",
          }}
        >
          <Flex direction="column" gap="4">
            <Heading size="6" style={{ color: "#ff6b35" }}>
              Lịch sử giao dịch
            </Heading>

            <Flex gap="4" wrap="wrap">
              <Box style={{ flex: "1 1 280px", background: "#fff", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255, 167, 123, 0.25)" }}>
                <Text size="2" style={{ color: "#ff6b35" }}>Số dư hiện tại</Text>
                <Heading size="5">{balance} SUI</Heading>
              </Box>
              <Box style={{ flex: "1 1 280px", background: "#fff", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255, 167, 123, 0.25)" }}>
                <Text size="2" style={{ color: "#ff6b35" }}>Đã chi</Text>
                <Heading size="5">{totals.debit.toFixed(4)} SUI</Heading>
              </Box>
              <Box style={{ flex: "1 1 280px", background: "#fff", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255, 167, 123, 0.25)" }}>
                <Text size="2" style={{ color: "#ff6b35" }}>Đã nhận/hoàn</Text>
                <Heading size="5">{(totals.credit + totals.refund).toFixed(4)} SUI</Heading>
              </Box>
            </Flex>

            <Flex gap="2" wrap="wrap">
              {([
                { label: "Tất cả", value: "all" },
                { label: "Chi", value: "debit" },
                { label: "Nhận", value: "credit" },
                { label: "Hoàn", value: "refund" },
              ] as { label: string; value: FilterType }[]).map((option) => (
                <Button
                  key={option.value}
                  variant={filter === option.value ? "solid" : "soft"}
                  onClick={() => setFilter(option.value)}
                  style={
                    filter === option.value
                      ? {
                          background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
                          color: "white",
                        }
                      : { color: "#ff6b35" }
                  }
                >
                  {option.label}
                </Button>
              ))}
            </Flex>

            <Box style={{ background: "#fff", borderRadius: "20px", padding: "20px", border: "1px solid rgba(255, 167, 123, 0.25)" }}>
              {filtered.length === 0 ? (
                <Text>Chưa có giao dịch.</Text>
              ) : (
                <Flex direction="column" gap="2">
                  {filtered.map((item) => (
                    <Flex
                      key={item.id}
                      justify="between"
                      align="center"
                      style={{
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "rgba(255, 107, 53, 0.08)",
                      }}
                    >
                      <Box>
                        <Text size="2" weight="bold">
                          {item.title}
                        </Text>
                        <Text size="1" style={{ color: "#6b7280" }}>
                          {new Date(item.timestamp).toLocaleString("vi-VN")}
                        </Text>
                      </Box>
                      <Text
                        size="2"
                        weight="bold"
                        style={{
                          color:
                            item.direction === "debit"
                              ? "#dc2626"
                              : item.direction === "refund"
                              ? "#2563eb"
                              : "#16a34a",
                        }}
                      >
                        {item.amount}
                      </Text>
                    </Flex>
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
