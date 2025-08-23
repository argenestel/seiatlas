"use client";

import React, { useEffect, useMemo, useState } from "react";

type AbiInput = { name?: string; type: string };
type AbiItem = { type: string; inputs?: AbiInput[] };

interface DeployModalProps {
  open: boolean;
  abi: any[];
  bytecode: string;
  onCancel: () => void;
  onConfirm: (args: any[]) => void;
}

function buildDefaultValues(inputs: AbiInput[]): Record<number, string> {
  const values: Record<number, string> = {};
  inputs.forEach((inp, idx) => {
    if (inp.type === "bool") values[idx] = "false";
    else values[idx] = "";
  });
  return values;
}

export default function DeployModal({ open, abi, bytecode, onCancel, onConfirm }: DeployModalProps) {
  const constructor = useMemo<AbiItem | undefined>(() => (abi || []).find((i: AbiItem) => i.type === "constructor"), [abi]);
  const inputs: AbiInput[] = constructor?.inputs || [];
  const [values, setValues] = useState<Record<number, string>>(() => buildDefaultValues(inputs));

  useEffect(() => {
    setValues(buildDefaultValues(inputs));
  }, [inputs.length]);

  const setValue = (idx: number, v: string) => setValues((prev) => ({ ...prev, [idx]: v }));

  const buildArgs = (): any[] => {
    return inputs.map((inp, idx) => {
      const raw = values[idx] ?? "";
      if (/^u?int/.test(inp.type)) {
        if (raw === "" || raw === undefined) return BigInt(0);
        try { return BigInt(raw); } catch { return raw; }
      }
      if (inp.type === "bool") return raw === "true";
      if (inp.type === "address") return raw as `0x${string}`;
      if (inp.type.includes("[") || inp.type === "tuple") {
        try { return JSON.parse(raw); } catch { return raw; }
      }
      return raw;
    });
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ width: '90%', maxWidth: 560, background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 12, color: '#e5e7eb' }}>
        <div style={{ padding: 14, borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>Constructor Parameters</div>
          <button onClick={onCancel} style={{ background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 14 }}>
          {inputs.length === 0 ? (
            <div style={{ color: '#9ca3af' }}>This contract has no constructor parameters.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {inputs.map((inp, idx) => {
                const isBool = inp.type === 'bool';
                const isNumber = /^u?int/.test(inp.type);
                const isAddress = inp.type === 'address';
                const isComplex = inp.type.includes('[') || inp.type === 'tuple';
                return (
                  <div key={idx}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{inp.name || `arg${idx}`} <span style={{ opacity: .6 }}>({inp.type})</span></div>
                    {isBool ? (
                      <select value={values[idx] ?? ''} onChange={(e) => setValue(idx, e.target.value)} style={{ width: '100%', padding: 10, background: '#0f0f0f', color: '#e5e7eb', border: '1px solid #2a2a2a', borderRadius: 8 }}>
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <input
                        value={values[idx] ?? ''}
                        onChange={(e) => setValue(idx, e.target.value)}
                        placeholder={isComplex ? 'JSON value' : (isAddress ? '0x...' : (isNumber ? 'number / uint256' : 'value'))}
                        style={{ width: '90%', margin: 10, padding: 10, background: '#0f0f0f', color: '#e5e7eb', border: '1px solid #2a2a2a', borderRadius: 8 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ padding: 14, borderTop: '1px solid #2a2a2a', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} style={{ background: '#161616', color: '#e5e7eb', border: '1px solid #2a2a2a', padding: '10px 14px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onConfirm(buildArgs())} style={{ background: '#1f1f1f', color: '#e5e7eb', border: '1px solid #2a2a2a', padding: '10px 14px', borderRadius: 8, cursor: 'pointer' }}>Deploy</button>
        </div>
      </div>
    </div>
  );
}


