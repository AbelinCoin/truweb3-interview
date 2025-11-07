# Uniswap V4 DApp – Cursor Setup Prompts

Below are three prompts to be used **sequentially** in Cursor.  
They cover the **project setup**, **UI development**, and **blockchain logic** implementation.  
The app should use **Next.js, TypeScript, Tailwind CSS, Web3-React**, and the **Uniswap V4 SDK**, with a **modern, crypto-minimalist design** and **animated UI using animate-ui**.  
Use a **Stars Background** as the global layout style.

---

## 🧱 Prompt 1 – Project Setup

Create a **Next.js project** using **TypeScript**, **Tailwind CSS**, **Prettier**, and **ESLint**.  
Install and configure **Web3-React** for wallet connection.  
Add all **Uniswap V4 SDK** dependencies:  
`@uniswap/v4-sdk`, `@uniswap/sdk-core`, `@uniswap/universal-router-sdk`.  

Set up environment variables in `.env` for the **Sepolia testnet** with the following addresses:

NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_UNIVERSAL_ROUTER=0x3A9D48A8DA508d5D9BD4e2059c32d9BfA6F3F6B2
NEXT_PUBLIC_POOL_MANAGER=0xE03A1074193f2FC9AfaA0c5a59C1467cE112b0C3
NEXT_PUBLIC_STATE_VIEW=0xe1dd9c3B278f9608A04b165ED833F5549E4E4002
NEXT_PUBLIC_POSITION_MANAGER=0x429ba7011b7e01D1B0E205C36DdfcF2e6adF6f9D
NEXT_PUBLIC_QUOTER=0x61b3f205bE2Daa800Fd891F17D3D7D4fE6a0D728
NEXT_PUBLIC_PERMIT2=0x000000000022D473030F116dDEE9F6B43aC78BA3
NEXT_PUBLIC_WETH=0xdd13E55209Fd76AfE204dBda4007C227904f0a81
NEXT_PUBLIC_USDC=0x65aFADD39029741B3b8f0756952C74678c9cEC93

Make sure the project supports **Vercel deployment**, includes Prettier and Lint configs, and has a proper folder structure (`components/`, `hooks/`, `lib/`, `pages/`, `styles/`, `types/`).  
Initialize a clean and production-ready setup.

---

## 🎨 Prompt 2 – UI and Components

Build a **modern, crypto-minimalist UI** using **Tailwind CSS** and **animate-ui**.  
Add a **Stars Background** animation as a global layout.  

Create two main tabs:
- **Swap**
- **Liquidity**

### Swap Tab
- Token selection inputs (ETH, USDC)
- Input for swap amount
- Display of estimated output
- “Swap” button with loading animation
- Connection state from Web3-React (disable swap if disconnected)

### Liquidity Tab
- Inputs for ETH and USDC
- Toggle for full-range liquidity
- Slippage tolerance field
- “Add Liquidity” button
- Display of pending, confirmed, and error states

Include reusable components:
- `TokenInput`
- `WalletStatus`
- `SwapForm`
- `LiquidityForm`
- `TransactionToast`

Each interactive element should have **animated transitions** using `animate-ui` (hover, click, modal, toast).  
Follow a consistent, clean, minimalist design with crypto-like motion cues and clear typography.

---

## ⚙️ Prompt 3 – Blockchain Logic

Implement the **Uniswap V4 logic** using `ethers.js`, `viem`, and the **Uniswap SDK** packages.

### Swaps
- Fetch swap quotes using the `Quoter` contract.
- Build and execute a **UniversalRouter transaction** using:
  - `SWAP_EXACT_IN_SINGLE`
  - `SETTLE_ALL`
  - `TAKE_ALL`
- Handle **Permit2 approvals** before swap execution.
- Support both ETH and ERC20 tokens.
- Update UI with transaction hash, pending, and success states.

### Liquidity
- Read pool data from `StateView` and construct a `Pool` + `Position` object.
- Use `Position.fromAmounts` to calculate liquidity parameters.
- Generate calldata via `V4PositionManager.addCallParameters`.
- Execute a **multicall** to `PositionManager`.
- Display slippage-adjusted expected outputs and confirmation state.
- Handle deadlines, ETH wrapping/unwrapping, and user feedback.

Ensure the code uses **TypeScript types** for all entities, leverages **React hooks** for state management, and follows **clean modular logic** separation (`useSwap()`, `useLiquidity()`, etc.).  
Show real-time transaction status updates in the UI.

---

✅ **Goal:**  
Deliver a working ETH–USDC swap + liquidity interface for Uniswap V4 on Sepolia, fully functional, 