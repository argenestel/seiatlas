"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface ChatProps {
  activeFile: string;
  onCodeChange: (newCode: string) => void;
  onCreateFile: (path: string, content?: string) => void;
  onUpdateFile: (path: string, content: string) => void;
  onOpenFile: (path: string) => void;
}

function extractFirstCodeBlock(markdown: string): { language: string | null; code: string | null } {
  const match = markdown.match(/```(\w+)?\n[\s\S]*?```/);
  if (!match) return { language: null, code: null };
  const [full] = match;
  const langMatch = full.match(/```(\w+)?/);
  const language = langMatch && langMatch[1] ? langMatch[1] : null;
  const code = full.replace(/```(\w+)?\n/, '').replace(/```$/, '').trim();
  return { language, code };
}

function extractFilePath(markdown: string): string | null {
  // Look for a hint like: path: ./contracts/MyContract.sol
  const pathMatch = markdown.match(/(?:path|file|filepath)\s*:\s*([^\n]+)/i);
  return pathMatch ? pathMatch[1].trim() : null;
}

const Chat: React.FC<ChatProps> = ({ activeFile, onCodeChange, onCreateFile, onUpdateFile, onOpenFile }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    try { const raw = window.localStorage.getItem('seiatlas.chat'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const quotes = useMemo(() => ["Working on code …"], []);

  useEffect(() => {
    if (!isThinking) return;
    const id = setInterval(() => setQuoteIdx((i) => (i + 1) % quotes.length), 2000);
    return () => clearInterval(id);
  }, [isThinking, quotes.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    try { window.localStorage.setItem('seiatlas.chat', JSON.stringify(messages)); } catch {}
  }, [messages]);

  const autoResize = () => {
    if (!textAreaRef.current) return;
    textAreaRef.current.style.height = '0px';
    const next = Math.min(textAreaRef.current.scrollHeight, 160);
    textAreaRef.current.style.height = next + 'px';
  };

  useEffect(() => { autoResize(); }, [input]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');

    setIsThinking(true);
    const response = await fetch(`/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: input }),
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.response as string;
      setMessages([...newMessages, { sender: 'ai', text: aiResponse }]);

      const hintedPath = extractFilePath(aiResponse);
      const { code } = extractFirstCodeBlock(aiResponse);
      if (code) {
        const targetPath = hintedPath || activeFile;
        if (hintedPath) {
          onCreateFile(hintedPath, code);
          onOpenFile(hintedPath);
        } else {
          onCodeChange(code);
          onUpdateFile(targetPath, code);
        }
      }
    } else {
      const errorData = await response.json();
      setMessages([...newMessages, { sender: 'ai', text: `Error: ${errorData.error}` }]);
    }
    setIsThinking(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div ref={scrollRef} style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#0a0a0a' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '10px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
            <div style={{ background: msg.sender === 'user' ? '#121212' : '#121212', color: '#e5e7eb', padding: '14px 16px', borderRadius: 12, display: 'inline-block', maxWidth: '90%', border: '1px solid #2a2a2a' }}>
              {msg.sender === 'user' ? (
                <span style={{ whiteSpace: 'pre-wrap', color: '#e5e7eb' }}>{msg.text}</span>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {msg.text}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {isThinking && (
          <div style={{ marginBottom: '10px', textAlign: 'left' }}>
            <div style={{ background: '#121212', color: '#e5e7eb', padding: '12px 14px', borderRadius: 12, display: 'inline-block', border: '1px solid #2a2a2a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="typing-dots" style={{ display: 'flex', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 6, background: '#6b7280', display: 'inline-block', animation: 'blink 1s infinite' }} />
                  <span style={{ width: 6, height: 6, borderRadius: 6, background: '#6b7280', display: 'inline-block', animation: 'blink 1s infinite 0.2s' }} />
                  <span style={{ width: 6, height: 6, borderRadius: 6, background: '#6b7280', display: 'inline-block', animation: 'blink 1s infinite 0.4s' }} />
                </div>
                <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>{quotes[quoteIdx]}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '16px', borderTop: '1px solid #2a2a2a', background: '#0a0a0a' }}>
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <div style={{ background: '#0e0e0e', border: '1px solid #2a2a2a', borderRadius: 14, padding: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <button onClick={() => setInput('Create a HelloWorld contract\npath: ./contracts/HelloWorld.sol')} style={{ background: '#141414', color: '#e5e7eb', border: '1px solid #2a2a2a', padding: '8px 10px', borderRadius: 999, cursor: 'pointer', fontSize: 12 }}>HelloWorld</button>
              <button onClick={() => setInput('Add a setter to update the message in HelloWorld')} style={{ background: '#141414', color: '#e5e7eb', border: '1px solid #2a2a2a', padding: '8px 10px', borderRadius: 999, cursor: 'pointer', fontSize: 12 }}>Add setter</button>
              <button onClick={() => setInput('Create a counter contract with increment and read\npath: ./contracts/Counter.sol')} style={{ background: '#141414', color: '#e5e7eb', border: '1px solid #2a2a2a', padding: '8px 10px', borderRadius: 999, cursor: 'pointer', fontSize: 12 }}>Counter</button>
              <button onClick={() => setInput('Generate Foundry tests for HelloWorld in ./test/HelloWorld.t.sol')} style={{ background: '#141414', color: '#e5e7eb', border: '1px solid #2a2a2a', padding: '8px 10px', borderRadius: 999, cursor: 'pointer', fontSize: 12 }}>Add tests</button>
            </div>
            <div>
              <textarea
                ref={textAreaRef}
                rows={1}
                placeholder="Describe what you want: e.g., ‘Create HelloWorld contract (path: ./contracts/HelloWorld.sol) with a setter and getter’. Use Shift+Enter for newline."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                onInput={autoResize}
                style={{ width: '90%', resize: 'none', background: '#121212', border: '1px solid #2a2a2a', color: '#e5e7eb', padding: '12px 14px', borderRadius: 10, lineHeight: 1.4, maxHeight: 160, overflowY: 'auto' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Shift+Enter for newline — Enter to send</div>
              <button onClick={handleSend} style={{ background: '#1f1f1f', color: '#e5e7eb', border: '1px solid #2a2a2a', padding: '10px 16px', cursor: 'pointer', borderRadius: 10 }}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;