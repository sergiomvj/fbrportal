/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera um servidor Node.js autocontido em .next/standalone
  // necessário para o build Docker multi-stage funcionar corretamente
  output: 'standalone',
  transpilePackages: ['@fbr/auth', '@fbr/portal-bridge', '@fbr/ui'],
};

export default nextConfig;
