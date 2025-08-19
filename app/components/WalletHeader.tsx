"use client";

import React from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { seiTestnet } from "wagmi/chains";

export default function WalletHeader() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {isConnected && chainId !== seiTestnet.id && (
        <button
          onClick={() => switchChain({ chainId: seiTestnet.id })}
          style={{
            background: "#1f1f1f",
            color: "#e5e7eb",
            border: "1px solid #2a2a2a",
            padding: "8px 12px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Switch to Sei Testnet
        </button>
      )}
      <ConnectKitButton />
    </div>
  );
}



