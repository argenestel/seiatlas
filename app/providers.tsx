"use client";

import "@sei-js/sei-global-wallet/eip6963";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { ConnectKitProvider } from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sei, seiTestnet } from "wagmi/chains";

const wagmiConfig = createConfig({
  chains: [sei, seiTestnet],
  transports: {
    [sei.id]: http(),
    [seiTestnet.id]: http(),
  },
  connectors: [injected()],
  ssr: true,
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          options={{
            hideNoWalletCTA: false,
          }}
          theme="midnight"
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


