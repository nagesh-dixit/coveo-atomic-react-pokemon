## Getting Started

Create `.env.local` from `.env.example` and set the Coveo organization ID, browser-safe search token, and analytics tracking ID. The search token is used in browser-side search requests, so it must only grant the intended search permissions.

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to use the Headless SSR Pokemondb search. The hosted Coveo search-page embed remains available at `/search` as a backup.
