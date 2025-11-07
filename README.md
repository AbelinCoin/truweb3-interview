This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Create a `.env.local` file in the project root and set the RPC + chain id. The
addresses for Sepolia (11155111) and Polygon (137) are preloaded via
configuration, so you only need to override them when pointing to another
deployment.

```
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_CHAIN_ID=11155111

# Optional overrides (only needed if you are not using the published defaults)
# NEXT_PUBLIC_UNIVERSAL_ROUTER=
# NEXT_PUBLIC_POOL_MANAGER=
# NEXT_PUBLIC_STATE_VIEW=
# NEXT_PUBLIC_POSITION_MANAGER=
# NEXT_PUBLIC_QUOTER=
# NEXT_PUBLIC_PERMIT2=
# NEXT_PUBLIC_WETH=
# NEXT_PUBLIC_USDC=
```

To switch to Polygon mainnet, update the chain id and RPC URL:

```
NEXT_PUBLIC_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_CHAIN_ID=137
```

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
