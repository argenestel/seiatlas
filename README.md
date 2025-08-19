# seiatlas

A chat-first smart contract IDE for Sei EVM testnet. Generate, edit, compile, deploy, and interact with contracts in one place.

## Features

- Chat-driven code generation with markdown code blocks and file path hints
- Multi-file tool: create/rename/delete/open files, tabbed editor (Monaco)
- Solidity compile API using `solc`
- Wallet connect via ConnectKit + Wagmi + Viem for Sei testnet
- Deploy contracts and interact on a right-side Contract Panel (read/write)
- Persisted state: chat history, sidebar state, files, open tabs, active file, contract address
- Monochrome dark UI with Roboto/Roboto Mono fonts

## Quick start

1. Install deps

```bash
bun install
```

2. Configure env

- Create `.env` and set your Gemini API key:

```bash
NEXT_PUBLIC_GEMINI_KEY=your_google_generative_ai_key
```

3. Run

```bash
bun dev
```

Open `http://localhost:3000`.

## Wallet & chains

- Uses ConnectKit + Wagmi + Viem. Chains: `sei`, `seiTestnet`.
- Make sure your wallet is on Sei Testnet. The header has a “Switch to Sei Testnet” button.

## How to use

1. Use the left sidebar Chat tab. Ask for contracts like:

```text
Create a HelloWorld contract
path: ./contracts/HelloWorld.sol
```

The AI returns a fenced code block. The app writes it to the hinted `path` or to the active file.

2. Edit files in the main editor. Tabs manage open files.

3. Deploy

- Click Deploy (top right) once connected.
- The compiler accepts the active filename.
- After deployment, we attempt to fetch the receipt and fill the contract address.

4. Interact

- Use the right Contract Panel: enter/edit contract address, pick Read/Write, select a function, fill inputs, then Call/Send Tx.

## API endpoints

- `POST /api/chat` → LangChain + Gemini. System prompt enforces markdown + `path:` hints.
- `POST /api/compile` → `{ code, filename }` compiles with `solc`, returns `{ abi, bytecode }`.

## Tech stack

- Next.js App Router, React 19, TypeScript
- Monaco editor
- LangChain + Google Generative AI (Gemini)
- ConnectKit, Wagmi, Viem
- Tailwind v4 (postcss) + custom CSS

## Notes

- Some providers delay receipts; if the contract address doesn’t auto-populate after deploy, paste it manually in the Contract Panel, or refresh.
- For write function args: numbers are strings to avoid overflow; arrays/tuples as JSON.

## Scripts

```bash
bun dev    # dev server
bun build  # production build
bun start  # start production
```
