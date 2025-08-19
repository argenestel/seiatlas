"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPublicClient, http } from "viem";
import { seiTestnet } from "wagmi/chains";
import { useWalletClient } from "wagmi";

interface ContractPanelProps {
  abi: any[] | null;
  address: string | null;
}

type AbiFunction = {
  name: string;
  type: string;
  stateMutability?: string;
  inputs?: { name: string; type: string; internalType?: string }[];
};

function signatureOf(fn: AbiFunction): string {
  const types = (fn.inputs || []).map((i) => i.type).join(",");
  return `${fn.name}(${types})`;
}

export default function ContractPanel({ abi, address }: ContractPanelProps) {
  const publicClient = useMemo(() => createPublicClient({ chain: seiTestnet, transport: http() }), []);
  const { data: walletClient } = useWalletClient();

  const [contractAddress, setContractAddress] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"read" | "write">("read");
  const [selectedSignature, setSelectedSignature] = useState<string>("");
  const [argValues, setArgValues] = useState<Record<number, string>>({});
  const [result, setResult] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");

  useEffect(() => {
    const initial = address || (typeof window !== 'undefined' ? window.localStorage.getItem('seiatlas.contract.address') || '' : '');
    setContractAddress(initial);
  }, [address]);

  useEffect(() => {
    try { if (contractAddress) window.localStorage.setItem('seiatlas.contract.address', contractAddress); } catch {}
  }, [contractAddress]);

  const readFns = useMemo(() => (abi || []).filter((f: AbiFunction) => f.type === 'function' && f.stateMutability === 'view'), [abi]);
  const writeFns = useMemo(() => (abi || []).filter((f: AbiFunction) => f.type === 'function' && f.stateMutability !== 'view'), [abi]);
  const functions = activeTab === 'read' ? readFns : writeFns;
  const currentFn: AbiFunction | undefined = useMemo(() => functions.find((f) => signatureOf(f) === selectedSignature), [functions, selectedSignature]);

  const setArg = (idx: number, value: string) => setArgValues((prev) => ({ ...prev, [idx]: value }));

  const buildArgs = (): any[] => {
    if (!currentFn || !currentFn.inputs) return [];
    return currentFn.inputs.map((inp, idx) => {
      const raw = argValues[idx] ?? '';
      if (/^u?int/.test(inp.type)) return raw;
      if (inp.type === 'bool') return raw === 'true';
      if (inp.type === 'address') return raw as `0x${string}`;
      if (inp.type.includes('[') || inp.type === 'tuple') { try { return JSON.parse(raw); } catch { return raw; } }
      return raw;
    });
  };

  const callRead = async () => {
    if (!currentFn || !contractAddress) return;
    try {
      const data = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: abi as any,
        functionName: currentFn.name as any,
        args: buildArgs(),
      });
      setResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setResult(`Error: ${e?.message || e}`);
    }
  };

  const callWrite = async () => {
    if (!currentFn || !contractAddress || !walletClient) return;
    try {
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: abi as any,
        functionName: currentFn.name as any,
        args: buildArgs(),
      });
      setTxHash(hash);
    } catch (e: any) {
      setTxHash(`Error: ${e?.message || e}`);
    }
  };

  return (
    <div style={{ width: 380, minWidth: 320, maxWidth: 420, borderLeft: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', gap: 12, padding: 12, background: '#0a0a0a', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, color: '#e5e7eb' }}>Contract</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => { setActiveTab('read'); setSelectedSignature(''); setArgValues({}); setResult(''); setTxHash(''); }} style={{ background: activeTab==='read' ? '#1f1f1f' : 'transparent', color: '#e5e7eb', border: '1px solid #2a2a2a', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Read</button>
          <button onClick={() => { setActiveTab('write'); setSelectedSignature(''); setArgValues({}); setResult(''); setTxHash(''); }} style={{ background: activeTab==='write' ? '#1f1f1f' : 'transparent', color: '#e5e7eb', border: '1px solid #2a2a2a', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Write</button>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Contract Address</div>
        <input value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} placeholder="0x..."
               style={{ width: '100%', background: '#121212', color: '#e5e7eb', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px' }} />
      </div>
      {(!abi || (abi || []).length === 0) ? (
        <div style={{ color: '#9ca3af' }}>Deploy a contract or provide an ABI to interact.</div>
      ) : (
        <>
          <div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{activeTab === 'read' ? 'Read function' : 'Write function'}</div>
            <select value={selectedSignature} onChange={(e) => { setSelectedSignature(e.target.value); setArgValues({}); setResult(''); setTxHash(''); }}
                    style={{ width: '100%', maxWidth: '100%', padding: 10, background: '#121212', color: '#e5e7eb', border: '1px solid #2a2a2a', borderRadius: 8 }}>
              <option value="">Select function</option>
              {functions.map((f: any) => (
                <option value={signatureOf(f)} key={signatureOf(f)}>{signatureOf(f)}</option>
              ))}
            </select>
          </div>
          {currentFn && (
            <div style={{ border: '1px solid #2a2a2a', borderRadius: 10, padding: 10, background: '#121212', overflow: 'hidden' }}>
              {(currentFn.inputs || []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {currentFn.inputs!.map((inp, idx) => {
                    const isBool = inp.type === 'bool';
                    const isNumber = /^u?int/.test(inp.type);
                    const isAddress = inp.type === 'address';
                    const isComplex = inp.type.includes('[') || inp.type === 'tuple';
                    return (
                      <div key={idx}>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{inp.name || `arg${idx}`} <span style={{ opacity: .6 }}>({inp.type})</span></div>
                        {isBool ? (
                          <select value={argValues[idx] ?? ''} onChange={(e) => setArg(idx, e.target.value)} style={{ width: '100%', maxWidth: '100%', padding: 10, background: '#0f0f0f', color: '#e5e7eb', border: '1px solid #2a2a2a', borderRadius: 8 }}>
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : (
                          <input
                            value={argValues[idx] ?? ''}
                            onChange={(e) => setArg(idx, e.target.value)}
                            placeholder={isComplex ? 'JSON value' : (isAddress ? '0x...' : (isNumber ? 'number / uint256' : 'value'))}
                            style={{ width: '100%', maxWidth: '100%', padding: 10, background: '#0f0f0f', color: '#e5e7eb', border: '1px solid #2a2a2a', borderRadius: 8, boxSizing: 'border-box' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: '#9ca3af' }}>No inputs</div>
              )}
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {activeTab === 'read' ? (
                  <button onClick={callRead} style={{ background: '#1f1f1f', color: '#e5e7eb', border: '1px solid #2a2a2a', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Call</button>
                ) : (
                  <button onClick={callWrite} style={{ background: '#1f1f1f', color: '#e5e7eb', border: '1px solid #2a2a2a', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Send Tx</button>
                )}
              </div>
            </div>
          )}
          {result && (
            <div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>Result</div>
              <pre style={{ marginTop: 6 }}>{result}</pre>
            </div>
          )}
          {txHash && (
            <div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>Transaction</div>
              <pre style={{ marginTop: 6 }}>{txHash}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}


