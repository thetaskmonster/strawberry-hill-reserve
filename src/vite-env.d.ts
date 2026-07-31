/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Full URL of the Worker checkout endpoint. Empty = checkout not wired yet.
  readonly VITE_CHECKOUT_ENDPOINT?: string;
  // Stripe publishable key (pk_...). Optional; only needed if a future flow uses
  // Stripe.js on the client. Never a secret key.
  readonly VITE_STRIPE_PK?: string;
  // Shared guard token sent to the checkout Worker as X-Berrova-Guard. Bundled
  // client-side, so it is visible in the shipped JS and is not a real secret.
  readonly VITE_CHECKOUT_GUARD_TOKEN?: string;
  // Existing build-time switches.
  readonly VITE_HASH_ROUTER?: string;
  readonly VITE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
