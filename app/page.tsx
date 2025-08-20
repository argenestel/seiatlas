"use client";

import { useMemo, useState } from "react";
import { Hex } from "viem";
import { seiTestnet } from "wagmi/chains";
import { useAccount, useWalletClient } from "wagmi";
import CodeEditor from "./components/Editor";
import Chat from "./components/Chat";
import Tabs from "./components/Tabs";
import WalletHeader from "./components/WalletHeader";
import SidePanel from "./components/SidePanel";
import ContractPanel from "./components/ContractPanel";
import DeployModal from "./components/DeployModal";

export default function Home() {
  const [openFiles, setOpenFiles] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ["contract.sol"];
    try { const raw = window.localStorage.getItem('seiatlas.files.open'); return raw ? JSON.parse(raw) : ["contract.sol"]; } catch { return ["contract.sol"]; }
  });
  const [activeFile, setActiveFile] = useState<string>(() => {
    if (typeof window === 'undefined') return "contract.sol";
    return window.localStorage.getItem('seiatlas.files.active') || "contract.sol";
  });
  const [code, setCode] = useState<string>("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentTx, setDeploymentTx] = useState<string | null>(null);
  const [lastDeployed, setLastDeployed] = useState<{ address: string | null; abi: any[] | null }>({ address: null, abi: null });
  const [pendingDeploy, setPendingDeploy] = useState<{ abi: any[]; bytecode: string } | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [files, setFiles] = useState<{ path: string; content: string }[]>(() => {
    if (typeof window === 'undefined') return [{ path: 'contract.sol', content: '' }];
    try { const raw = window.localStorage.getItem('seiatlas.files'); return raw ? JSON.parse(raw) : [{ path: 'contract.sol', content: '' }]; } catch { return [{ path: 'contract.sol', content: '' }]; }
  });
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const openFile = (fileName: string) => {
    if (!openFiles.includes(fileName)) {
      setOpenFiles([...openFiles, fileName]);
    }
    setActiveFile(fileName);
  };

  const closeFile = (fileName: string) => {
    const newOpenFiles = openFiles.filter((file) => file !== fileName);
    setOpenFiles(newOpenFiles);
    if (activeFile === fileName) {
      setActiveFile(newOpenFiles[0] || "");
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setFiles((prev) => prev.map((f) => (f.path === activeFile ? { ...f, content: newCode } : f)));
  };

  // Persist file state
  
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem('seiatlas.files', JSON.stringify(files)); } catch {}
    try { window.localStorage.setItem('seiatlas.files.open', JSON.stringify(openFiles)); } catch {}
    try { if (activeFile) window.localStorage.setItem('seiatlas.files.active', activeFile); } catch {}
  }

  const createFile = (path: string, content = "") => {
    if (files.find((f) => f.path === path)) return;
    setFiles((prev) => [...prev, { path, content }]);
    setOpenFiles((prev) => (prev.includes(path) ? prev : [...prev, path]));
    setActiveFile(path);
    setCode(content);
  };

  const updateFile = (path: string, content: string) => {
    setFiles((prev) => prev.map((f) => (f.path === path ? { ...f, content } : f)));
    if (activeFile === path) setCode(content);
  };

  const renameFile = (oldPath: string, newPath: string) => {
    setFiles((prev) => prev.map((f) => (f.path === oldPath ? { ...f, path: newPath } : f)));
    setOpenFiles((prev) => prev.map((p) => (p === oldPath ? newPath : p)));
    if (activeFile === oldPath) setActiveFile(newPath);
  };

  const deleteFile = (path: string) => {
    setFiles((prev) => prev.filter((f) => f.path !== path));
    setOpenFiles((prev) => prev.filter((p) => p !== path));
    if (activeFile === path) {
      const next = openFiles.find((p) => p !== path) || (files[0]?.path ?? "");
      setActiveFile(next);
      const file = files.find((f) => f.path === next);
      setCode(file?.content || "");
    }
  };

  const deployContract = async () => {
    if (!isConnected || !walletClient) { alert("Please connect your wallet first."); return; }

    setIsDeploying(true);
    setDeploymentTx(null);

    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, filename: activeFile || "contract.sol" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Compilation failed:", errorData.errors);
        alert("Compilation failed. Check the console for details.");
        setIsDeploying(false);
        return;
      }

      const { abi, bytecode } = await response.json();
      const hasConstructor = Array.isArray(abi) && abi.some((i: any) => i.type === 'constructor' && (i.inputs?.length || 0) > 0);
      if (hasConstructor) {
        setPendingDeploy({ abi, bytecode });
        setShowDeployModal(true);
        return;
      }
      // No args required: deploy directly
      const txHash = await walletClient.deployContract({
        abi: abi as any,
        bytecode: ("0x" + bytecode) as Hex,
        chain: seiTestnet,
        args: [],
      });
      setDeploymentTx(txHash);
      try {
        const receipt = await (window as any).ethereum.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
        const contractAddress = receipt?.contractAddress || null;
        setLastDeployed({ address: contractAddress, abi });
      } catch {
        setLastDeployed({ address: null, abi });
      }
    } catch (error) {
      console.error("Deployment failed:", error);
      alert("Deployment failed. Check the console for details.");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <main style={{ display: "flex", height: "100vh" }}>
      <SidePanel
        files={files}
        activeFile={activeFile}
        onCreateFile={createFile}
        onUpdateFile={updateFile}
        onRenameFile={renameFile}
        onDeleteFile={deleteFile}
        onOpenFile={(path) => {
          setActiveFile(path);
          const f = files.find((x) => x.path === path);
          setCode(f?.content || "");
          if (!openFiles.includes(path)) setOpenFiles([...openFiles, path]);
        }}
        onCodeChange={handleCodeChange}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #2a2a2a", padding: 8, background: '#0a0a0a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/atlas.png" alt="seiatlas" style={{ height: 24, width: 'auto', display: 'block' }} />
            <Tabs
              openFiles={openFiles}
              activeFile={activeFile}
              onTabClick={(file) => {
                setActiveFile(file);
                const f = files.find((x) => x.path === file);
                setCode(f?.content || "");
              }}
              onTabClose={closeFile}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isConnected && (
              <button onClick={deployContract} disabled={isDeploying} style={{ background: '#1f1f1f', color: '#e5e7eb', border: '1px solid #2a2a2a', padding: '10px 20px', cursor: 'pointer', borderRadius: 8 }}>
                {isDeploying ? "Deploying..." : "Deploy"}
              </button>
            )}
            <WalletHeader />
          </div>
        </div>
        {deploymentTx && (
          <div style={{ padding: '10px', background: '#0a0a0a', color: '#e5e7eb', borderBottom: '1px solid #2a2a2a' }}>
            Deployment submitted. Tx hash: {deploymentTx}
          </div>
        )}
        <CodeEditor activeFile={activeFile} code={code} onCodeChange={handleCodeChange} />
      </div>
      <DeployModal
        open={showDeployModal && !!pendingDeploy}
        abi={pendingDeploy?.abi || []}
        bytecode={pendingDeploy?.bytecode || ''}
        onCancel={() => { setShowDeployModal(false); setPendingDeploy(null); }}
        onConfirm={async (args) => {
          if (!walletClient || !pendingDeploy) return;
          try {
            const txHash = await walletClient.deployContract({
              abi: pendingDeploy.abi as any,
              bytecode: ("0x" + pendingDeploy.bytecode) as Hex,
              chain: seiTestnet,
              args,
            });
            setDeploymentTx(txHash);
            setShowDeployModal(false);
            setPendingDeploy(null);
            try {
              const receipt = await (window as any).ethereum.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
              const contractAddress = receipt?.contractAddress || null;
              setLastDeployed({ address: contractAddress, abi: pendingDeploy.abi });
            } catch {
              setLastDeployed({ address: null, abi: pendingDeploy.abi });
            }
          } catch (e) {
            console.error(e);
            alert('Deployment failed. Check console.');
          }
        }}
      />
      <ContractPanel abi={lastDeployed.abi} address={lastDeployed.address} />
    </main>
  );
}
