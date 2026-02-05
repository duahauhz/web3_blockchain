import React from "react";
import ReactDOM from "react-dom/client";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";
import "./styles/global.css";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import { Toaster } from "react-hot-toast";
import App from "./App.tsx";
import { networkConfig } from "./networkConfig.ts";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { NotificationProvider } from "./contexts/NotificationContext.tsx";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme appearance="light">
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider autoConnect>
            <AuthProvider>
              <NotificationProvider>
                <App />
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 5000,
                    style: {
                      background: '#fff',
                      color: '#333',
                      padding: '16px',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    },
                  }}
                />
              </NotificationProvider>
            </AuthProvider>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </Theme>
  </React.StrictMode>,
);
