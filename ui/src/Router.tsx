import { useEffect } from "react";
import { HomePage } from "./HomePage";
import { CreateGift } from "./CreateGift";
import { ClaimGift } from "./ClaimGift";
import { CreateLixi } from "./CreateLixi";
import { ClaimLixi } from "./ClaimLixi";
import { LixiManage } from "./LixiManage";
import { Transactions } from "./Transactions";
import { motion, AnimatePresence } from "framer-motion";

type Page = 'home' | 'create' | 'claim' | 'create-lixi' | 'claim-lixi' | 'lixi-manage' | 'transactions' | 'success';
type GiftType = 'gift' | 'lixi';

interface RouterProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onGiftCreated: (id: string, type: GiftType) => void;
}

export function Router({ currentPage, setCurrentPage, onGiftCreated }: RouterProps) {
  // Check URL on mount to handle direct navigation
  useEffect(() => {
    const syncRoute = () => {
      const hash = window.location.hash;
      
      // Check for specific routes first - allow direct links
      if (hash.includes('/lixi-manage')) {
        setCurrentPage('lixi-manage');
      } else if (hash.includes('/transactions')) {
        setCurrentPage('transactions');
      } else if (hash.includes('/claim-lixi')) {
        setCurrentPage('claim-lixi');
      } else if (hash.includes('/claim')) {
        setCurrentPage('claim');
      } else if (hash.includes('/create-lixi')) {
        setCurrentPage('create-lixi');
      } else if (hash.includes('/create')) {
        setCurrentPage('create');
      } else {
        // No valid route - go home
        setCurrentPage('home');
        window.location.hash = '';
      }
    };

    // Run on mount to handle initial URL (including direct links)
    syncRoute();
    
    window.addEventListener('hashchange', syncRoute);
    
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('load', syncRoute);
    };
  }, [setCurrentPage]);

  const pageVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  };

  const pageTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <motion.div
            key="home"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <HomePage onNavigate={setCurrentPage} />
          </motion.div>
        );
      case 'create':
        return (
          <motion.div
            key="create"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <CreateGift
              onBack={() => setCurrentPage('home')}
              onCreated={(id, type) => onGiftCreated(id, type)}
            />
          </motion.div>
        );
      case 'claim':
        return (
          <motion.div
            key="claim"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <ClaimGift onBack={() => setCurrentPage('home')} />
          </motion.div>
        );
      case 'create-lixi':
        return (
          <motion.div
            key="create-lixi"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <CreateLixi
              onBack={() => setCurrentPage('home')}
              onCreated={(id, type) => onGiftCreated(id, type)}
            />
          </motion.div>
        );
      case 'claim-lixi':
        return (
          <motion.div
            key="claim-lixi"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <ClaimLixi onBack={() => setCurrentPage('home')} />
          </motion.div>
        );
      case 'lixi-manage':
        return (
          <motion.div
            key="lixi-manage"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <LixiManage onBack={() => setCurrentPage('home')} />
          </motion.div>
        );
      case 'transactions':
        return (
          <motion.div
            key="transactions"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <Transactions onBack={() => setCurrentPage('home')} />
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="default"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <HomePage onNavigate={setCurrentPage} />
          </motion.div>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      {renderPage()}
    </AnimatePresence>
  );
}
