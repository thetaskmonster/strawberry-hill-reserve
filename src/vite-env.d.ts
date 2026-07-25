/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Full URL of the Worker checkout endpoint. Empty = checkout not wired yet.
  readonly VITE_CHECKOUT_ENDPOINT?: string;
  // Stripe publishable key (pk_...). Optional; only needed if a future flow uses
  // Stripe.js on the client. Never a secret key.
  readonly VITE_STRIPE_PK?: string;
  // Existing build-time switches.
  readonly VITE_HASH_ROUTER?: string;
  readonly VITE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
