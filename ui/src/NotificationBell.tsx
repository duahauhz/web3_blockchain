import { useState } from 'react';
import { Box, Button, Flex, Text, Popover } from '@radix-ui/themes';
import { Bell, Gift, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from './contexts/NotificationContext';
import { useAuth } from './contexts/AuthContext';

export function NotificationBell() {
  const { notifications, isConnected, markAsRead, markAllRead } = useNotifications();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger>
        <Button
          variant="soft"
          size="3"
          style={{
            position: 'relative',
            cursor: 'pointer',
            background: 'rgba(255, 107, 53, 0.1)',
            border: '2px solid rgba(255, 107, 53, 0.3)',
            color: '#ff6b35',
          }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ff0000',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(255, 0, 0, 0.4)',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </Button>
      </Popover.Trigger>

      <Popover.Content
        style={{
          width: '400px',
          maxWidth: '90vw',
          padding: 0,
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        <Box style={{
          padding: '16px',
          borderBottom: '2px solid #f0f0f0',
          background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
        }}>
          <Flex justify="between" align="center">
            <Text size="4" weight="bold" style={{ color: 'white' }}>
              🔔 Thông báo
            </Text>
            <Flex align="center" gap="2">
              <Button
                variant="ghost"
                size="1"
                onClick={() => markAllRead()}
                style={{ color: 'white', cursor: 'pointer' }}
              >
                Đọc hết
              </Button>
              {isConnected ? (
                <Box style={{
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'white',
                }}>
                  ● Live
                </Box>
              ) : (
                <Box style={{
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'white',
                }}>
                  ○ Offline
                </Box>
              )}
              <Button
                variant="ghost"
                size="1"
                onClick={() => setIsOpen(false)}
                style={{ color: 'white', cursor: 'pointer' }}
              >
                <X size={16} />
              </Button>
            </Flex>
          </Flex>
        </Box>

        <Box style={{
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          {notifications.length === 0 ? (
            <Box style={{
              padding: '40px 20px',
              textAlign: 'center',
            }}>
              <Bell size={48} style={{ color: '#ccc', marginBottom: '16px' }} />
              <Text size="3" style={{ color: '#999', display: 'block' }}>
                Chưa có thông báo
              </Text>
              {!user && (
                <Text size="2" style={{ color: '#ccc', display: 'block', marginTop: '8px' }}>
                  Đăng nhập để nhận thông báo real-time
                </Text>
              )}
            </Box>
          ) : (
            <AnimatePresence>
              {notifications.map((notif: any) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    background: notif.read ? 'white' : 'rgba(255, 107, 53, 0.05)',
                  }}
                  whileHover={{ background: 'rgba(255, 107, 53, 0.1)' }}
                  onClick={() => {
                    markAsRead(notif.id);
                    setIsOpen(false);
                    
                    // Force navigation - thêm timestamp để trigger hashchange mọi lúc
                    const timestamp = Date.now();
                    
                    // Logic routing dựa trên type
                    switch (notif.type) {
                      case 'gift_received':
                        // Người nhận: đi đến trang claim quà (có nút Nhận và Trả lại)
                        if (notif.giftId) {
                          window.location.hash = `/claim?id=${notif.giftId}&t=${timestamp}`;
                        }
                        break;
                      
                      case 'gift_sent':
                        // Người gửi: đi đến trang quản lý quà
                        if (notif.giftId) {
                          window.location.hash = `/gift-manage?id=${notif.giftId}&t=${timestamp}`;
                        }
                        break;
                      
                      case 'gift_opened':
                      case 'gift_rejected':
                      case 'gift_refunded':
                        // Người gửi: xem lịch sử giao dịch
                        window.location.hash = `/transactions?t=${timestamp}`;
                        break;
                      
                      case 'lixi_claimed':
                        // Người nhận lì xì: xem lịch sử (đã claim rồi)
                        window.location.hash = `/transactions?t=${timestamp}`;
                        break;
                      
                      case 'lixi_created':
                      case 'lixi_claimed_creator':
                      case 'lixi_locked':
                      case 'lixi_refunded':
                      case 'lixi_completed':
                        // Người tạo lì xì: đi đến trang quản lý
                        if (notif.lixiId) {
                          window.location.hash = `/lixi-manage?id=${notif.lixiId}&t=${timestamp}`;
                        }
                        break;
                      
                      default:
                        window.location.hash = `/transactions?t=${timestamp}`;
                    }
                  }}
                >
                  <Flex gap="3" align="start">
                    <Box style={{
                      flexShrink: 0,
                      padding: '8px',
                      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {notif.type === 'gift_received' ? (
                        <Gift size={20} color="white" />
                      ) : (
                        <span style={{ fontSize: '20px' }}>🧧</span>
                      )}
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>
                        {notif.title}
                      </Text>
                      <Text size="2" style={{ color: '#666', display: 'block' }}>
                        {notif.message}
                      </Text>
                      <Text size="1" style={{ color: '#999', display: 'block', marginTop: '4px' }}>
                        {new Date(notif.timestamp).toLocaleTimeString('vi-VN')}
                      </Text>
                    </Box>
                  </Flex>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </Box>

        {user && (
          <Box style={{
            padding: '12px',
            background: '#f9f9f9',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center',
          }}>
            <Text size="2" style={{ color: '#666' }}>
              Đã kết nối: {user.email}
            </Text>
          </Box>
        )}
      </Popover.Content>
    </Popover.Root>
  );
}
