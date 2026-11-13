import type { NextConfig } from 'next';
const config: NextConfig = {
  reactStrictMode: true,
  // Browser tests use an isolated production build, without dev hot reload.
  ...(process.env.QLHV_E2E === 'true' ? { distDir: '.next-e2e' } : {}),
};
export default config;
