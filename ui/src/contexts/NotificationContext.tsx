import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import toast from 'react-hot-toast';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useNetworkVariable } from '../networkConfig';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  history: HistoryEntry[];
  balance: string;
  connect: (email: string) => void;
  disconnect: () => void;
  isConnected: boolean;
  addNotification: (notification: NotificationInput) => void;
  addHistoryEntry: (entry: HistoryEntryInput) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  giftId?: string;
  lixiId?: string;
  amount?: string;
  timestamp: number;
  read?: boolean;
  txDigest?: string;
}

interface NotificationInput {
  type: string;
  title: string;
  message: string;
  giftId?: string;
  lixiId?: string;
  amount?: string;
  timestamp?: number;
  txDigest?: string;
}

interface HistoryEntry {
  id: string;
  title: string;
  amount: string;
  direction: 'debit' | 'credit' | 'refund';
  timestamp: number;
}

interface HistoryEntryInput {
  title: string;
  amount: string;
  direction: 'debit' | 'credit' | 'refund';
  timestamp?: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { user } = useAuth();
  const packageId = useNetworkVariable('helloWorldPackageId');
  
  // Load notifications and history from localStorage
  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error('Failed to load notifications from localStorage', err);
    }
    return [];
  };
  
  const loadHistory = () => {
    try {
      const stored = localStorage.getItem('history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error('Failed to load history from localStorage', err);
    }
    return [];
  };
  
  const [notifications, setNotifications] = useState<Notification[]>(loadNotifications());
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory());
  const [balance, setBalance] = useState('0');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Persist seen event keys to avoid duplicates across reloads
  const loadSeenKeys = () => {
    try {
      const stored = localStorage.getItem('seenEvents');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (err) {
      console.error('Failed to load seenEvents from localStorage', err);
    }
    return new Set<string>();
  };

  const persistSeenKeys = (set: Set<string>) => {
    try {
      // Limit size to prevent unbounded growth
      const arr = Array.from(set).slice(-500);
      localStorage.setItem('seenEvents', JSON.stringify(arr));
    } catch (err) {
      console.error('Failed to persist seenEvents to localStorage', err);
    }
  };

  const seenEventsRef = useRef<Set<string>>(loadSeenKeys());

  const connect = (email: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      
      // Register with email
      websocket.send(JSON.stringify({
        type: 'register',
        email,
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const notification: Notification = {
          ...JSON.parse(event.data),
          id: Math.random().toString(36),
          read: false,
        };
        
        console.log('📩 New notification:', notification);
        
        // Add to notifications list
        setNotifications(prev => [
          notification,
          ...prev.slice(0, 49),
        ]);

        // Show toast
        if (notification.type === 'gift_received') {
          toast.success(notification.title, {
            duration: 5000,
            icon: '🎁',
            style: {
              background: '#ff4b4b',
              color: '#fff',
            },
          });
        } else if (notification.type === 'lixi_available') {
          toast.success(notification.title, {
            duration: 5000,
            icon: '🧧',
          });
        }
      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
    };

    websocket.onclose = () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
      
      // Attempt reconnect after 5 seconds
      setTimeout(() => {
        if (email) {
          connect(email);
        }
      }, 5000);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
    }
  };

  const addNotification = (notification: NotificationInput) => {
    const payload: Notification = {
      id: Math.random().toString(36),
      timestamp: notification.timestamp ?? Date.now(),
      read: false,
      ...notification,
    };
    
    // Mark manual notification's txDigest as seen to prevent duplicate from events
    if (notification.txDigest) {
      seenEventsRef.current.add(`${notification.txDigest}-manual`);
      persistSeenKeys(seenEventsRef.current);
    }
    
    setNotifications(prev => {
      const updated = [payload, ...prev.slice(0, 49)];
      const sorted = updated.sort((a, b) => b.timestamp - a.timestamp);
      // Persist to localStorage
      try {
        localStorage.setItem('notifications', JSON.stringify(sorted));
      } catch (err) {
        console.error('Failed to persist notifications', err);
      }
      return sorted;
    });
  };

  const addHistoryEntry = (entry: HistoryEntryInput) => {
    const payload: HistoryEntry = {
      id: Math.random().toString(36),
      timestamp: entry.timestamp ?? Date.now(),
      ...entry,
    };
    setHistory(prev => {
      const updated = [payload, ...prev.slice(0, 99)];
      const sorted = updated.sort((a, b) => b.timestamp - a.timestamp);
      // Persist to localStorage
      try {
        localStorage.setItem('history', JSON.stringify(sorted));
      } catch (err) {
        console.error('Failed to persist history', err);
      }
      return sorted;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => (n.id === id ? { ...n, read: true } : n));
      try {
        localStorage.setItem('notifications', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to persist notifications', err);
      }
      return updated;
    });
  };

  const markAllRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      try {
        localStorage.setItem('notifications', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to persist notifications', err);
      }
      return updated;
    });
  };

  useEffect(() => {
    if (!currentAccount) {
      setBalance('0');
      return;
    }

    let active = true;

    const refreshBalance = async () => {
      try {
        const result = await suiClient.getBalance({
          owner: currentAccount.address,
          coinType: '0x2::sui::SUI',
        });
        if (!active) return;
        const balanceSui = (Number(result.totalBalance) / 1_000_000_000).toFixed(4);
        setBalance(balanceSui);
      } catch (error) {
        console.error('Failed to fetch balance', error);
      }
    };

    refreshBalance();
    const interval = setInterval(refreshBalance, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [currentAccount, suiClient]);

  useEffect(() => {
    if (!currentAccount && !user?.email) {
      return;
    }

    let cancelled = false;
    setIsConnected(true);

    const address = currentAccount?.address;
    const email = user?.email;

    const handleEvent = (event: any) => {
      const manualKey = `${event.id?.txDigest}-manual`;
      if (seenEventsRef.current.has(manualKey)) {
        return;
      }

      const key = `${event.id?.txDigest}-${event.id?.eventSeq}`;
      if (seenEventsRef.current.has(key)) {
        return;
      }
      seenEventsRef.current.add(key);
      persistSeenKeys(seenEventsRef.current);

      const type = event.type || '';
      const data = event.parsedJson || {};
      const eventTimestamp = event.timestampMs ? Number(event.timestampMs) : Date.now();

      const amountToSui = (amount?: string | number) =>
        amount ? (Number(amount) / 1_000_000_000).toFixed(4) : '0.0000';

      if (type.includes('GiftCreatedEvent')) {
        const amount = amountToSui(data.amount);
        const giftId = data.gift_id || '';
        
        console.log('🎁 GiftCreatedEvent received:', {
          recipient_email: data.recipient_email,
          current_user_email: email,
          will_notify_recipient: email && data.recipient_email === email,
          sender: data.sender,
          current_address: address,
        });
        
        // Thông báo cho người gửi
        if (data.sender === address) {
          addNotification({
            type: 'gift_sent',
            title: '✅ Đã tạo quà thành công',
            message: `Gửi ${amount} SUI đến ${data.recipient_email}. Nhấp để xem chi tiết.`,
            giftId: giftId,
            amount,
            timestamp: eventTimestamp,
          });
          addHistoryEntry({
            title: 'Gửi quà',
            amount: `-${amount} SUI`,
            direction: 'debit',
            timestamp: eventTimestamp,
          });
        }
        
        // Thông báo cho người nhận khi quà được tạo
        if (email && data.recipient_email === email) {
          console.log('✅ ADDING NOTIFICATION FOR RECIPIENT:', email);
          addNotification({
            type: 'gift_received',
            title: '🎁 Bạn có quà mới!',
            message: `Có người gửi ${amount} SUI cho bạn. Nhấp để nhận ngay!`,
            giftId: giftId,
            amount,
            timestamp: eventTimestamp,
          });
          toast('🎁 Bạn nhận được quà mới!', {
            icon: '🎉',
            duration: 6000,
          });
        } else {
          console.log('❌ NO NOTIFICATION - Email mismatch or not logged in', {
            user_email: email,
            recipient_email: data.recipient_email,
            match: email === data.recipient_email,
          });
        }
      }

      if (type.includes('GiftOpenedEvent')) {
        const amount = amountToSui(data.amount);
        
        // Thông báo cho người gửi
        if (data.sender === address) {
          addNotification({
            type: 'gift_opened',
            title: '🎉 Quà đã được nhận',
            message: `Người nhận đã mở quà ${amount} SUI của bạn!`,
            giftId: data.gift_id,
            amount,
            timestamp: eventTimestamp,
          });
          addHistoryEntry({
            title: 'Quà đã nhận',
            amount: `-${amount} SUI`,
            direction: 'debit',
            timestamp: eventTimestamp,
          });
          // Toast cho người gửi với animation
          toast.success('🎉 Quà của bạn đã được nhận!', {
            icon: '✅',
            duration: 5000,
            style: {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 'bold',
            },
          });
        }
        
        if (data.recipient === address || (email && data.recipient_email === email)) {
          addNotification({
            type: 'gift_received',
            title: '🎁 Bạn nhận được quà',
            message: `Bạn đã nhận ${amount} SUI.`,
            giftId: data.gift_id,
            amount,
            timestamp: eventTimestamp,
          });
          addHistoryEntry({
            title: 'Nhận quà',
            amount: `+${amount} SUI`,
            direction: 'credit',
            timestamp: eventTimestamp,
          });
          // Toast cho người nhận
          toast.success(`Bạn đã nhận ${amount} SUI!`, {
            icon: '🎁',
            duration: 5000,
          });
        }
      }

      if (type.includes('GiftRejectedEvent')) {
        const amount = data.amount ? amountToSui(data.amount) : '0';
        
        // Thông báo cho người gửi
        if (data.sender === address) {
          addNotification({
            type: 'gift_rejected',
            title: '↩️ Quà đã được hoàn lại',
            message: `Người nhận đã từ chối. Bạn đã nhận lại ${amount} SUI.`,
            giftId: data.gift_id,
            amount,
            timestamp: eventTimestamp,
          });
          addHistoryEntry({
            title: 'Hoàn quà',
            amount: `+${amount} SUI`,
            direction: 'refund',
            timestamp: eventTimestamp,
          });
          // Toast với style đặc biệt
          toast('↩️ Quà đã được hoàn lại', {
            icon: '🔄',
            duration: 5000,
            style: {
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              fontWeight: 'bold',
            },
          });
        }
      }

      if (type.includes('GiftRefundedEvent') && data.sender === address) {
        const amount = amountToSui(data.amount);
        addNotification({
          type: 'gift_refunded',
          title: 'Quà đã hoàn tiền',
          message: `Đã hoàn lại ${amount} SUI vào ví.`,
          giftId: data.gift_id,
          amount,
          timestamp: eventTimestamp,
        });
        addHistoryEntry({
          title: 'Hoàn tiền quà',
          amount: `+${amount} SUI`,
          direction: 'refund',
          timestamp: eventTimestamp,
        });
      }

      if (type.includes('LixiCreatedEvent') && data.creator === address) {
        const amount = amountToSui(data.total_amount);
        addNotification({
          type: 'lixi_created',
          title: 'Đã tạo bao lì xì',
          message: `Đã trừ ${amount} SUI để tạo bao lì xì.`,
          lixiId: data.lixi_id,
          amount,
          timestamp: eventTimestamp,
        });
        addHistoryEntry({
          title: 'Tạo lì xì',
          amount: `-${amount} SUI`,
          direction: 'debit',
          timestamp: eventTimestamp,
        });
      }

      if (type.includes('LixiClaimedEvent')) {
        const amount = amountToSui(data.amount);
        
        if (data.claimer === address || (email && data.claimer_email === email)) {
          addNotification({
            type: 'lixi_claimed',
            title: '🧧 Bạn đã nhận lì xì',
            message: `Bạn nhận ${amount} SUI.`,
            lixiId: data.lixi_id,
            amount,
            timestamp: eventTimestamp,
          });
          addHistoryEntry({
            title: 'Nhận lì xì',
            amount: `+${amount} SUI`,
            direction: 'credit',
            timestamp: eventTimestamp,
          });
          // Toast cho người nhận
          toast.success(`Chúc mừng! Bạn nhận được ${amount} SUI`, {
            icon: '🧧',
            duration: 5000,
          });
        }

        if (data.creator === address) {
          const claimerLabel = data.claimer_email || `${data.claimer?.slice(0, 6)}...${data.claimer?.slice(-4)}` || 'Người nhận';
          addNotification({
            type: 'lixi_claimed_creator',
            title: '🎉 Có người nhận lì xì',
            message: `${claimerLabel} đã nhận ${amount} SUI.`,
            lixiId: data.lixi_id,
            amount,
            timestamp: eventTimestamp,
          });
          // Toast cho người tạo
          toast(`${claimerLabel} đã nhận lì xì!`, {
            icon: '🎉',
            duration: 4000,
          });
        }
      }

      if (type.includes('LixiRefundedEvent') && data.creator === address) {
        const amount = amountToSui(data.refunded_amount);
        addNotification({
          type: 'lixi_refunded',
          title: 'Hoàn lại lì xì',
          message: `Đã hoàn lại ${amount} SUI vào ví.`,
          lixiId: data.lixi_id,
          amount,
          timestamp: eventTimestamp,
        });
        addHistoryEntry({
          title: 'Hoàn tiền lì xì',
          amount: `+${amount} SUI`,
          direction: 'refund',
          timestamp: eventTimestamp,
        });
      }

      if (type.includes('LixiLockedEvent') && data.creator === address) {
        addNotification({
          type: 'lixi_locked',
          title: 'Đã khoá lì xì',
          message: 'Bao lì xì đã được khoá.',
          lixiId: data.lixi_id,
          timestamp: eventTimestamp,
        });
        toast.success('Đã khóa bao lì xì!', {
          icon: '🔒',
          duration: 3000,
        });
      }

      if (type.includes('LixiCompletedEvent') && data.creator === address) {
        addNotification({
          type: 'lixi_completed',
          title: '🎊 Bao lì xì đã hoàn tất',
          message: `Đã có ${data.total_claimers} người nhận hết lì xì!`,
          lixiId: data.lixi_id,
          timestamp: eventTimestamp,
        });
        toast.success(`Lì xì đã được ${data.total_claimers} người nhận!`, {
          icon: '🎊',
          duration: 5000,
        });
      }
    };

    const queryEvents = async () => {
      if (cancelled || !packageId) return;
      try {
        const eventTypes = [
          `${packageId}::gifting::GiftCreatedEvent`,
          `${packageId}::gifting::GiftOpenedEvent`,
          `${packageId}::gifting::GiftRejectedEvent`,
          `${packageId}::gifting::GiftRefundedEvent`,
          `${packageId}::sui_lixi::LixiCreatedEvent`,
          `${packageId}::sui_lixi::LixiClaimedEvent`,
          `${packageId}::sui_lixi::LixiLockedEvent`,
          `${packageId}::sui_lixi::LixiCompletedEvent`,
          `${packageId}::sui_lixi::LixiRefundedEvent`,
        ];

        for (const eventType of eventTypes) {
          const events = await suiClient.queryEvents({
            query: { MoveEventType: eventType },
            limit: 20,
            order: 'descending',
          });
          events.data.forEach(handleEvent);
        }
      } catch (error) {
        console.error('Failed to query events', error);
      }
    };

    queryEvents();
    const interval = setInterval(queryEvents, 12000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentAccount, user?.email, packageId, suiClient]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        history,
        balance,
        connect,
        disconnect,
        isConnected,
        addNotification,
        addHistoryEntry,
        markAsRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
