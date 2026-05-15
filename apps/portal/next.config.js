/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera um servidor Node.js autocontido em .next/standalone
  // necessário para o build Docker multi-stage funcionar corretamente
  output: 'standalone',
  transpilePackages: ['@fbr/auth', '@fbr/portal-bridge', '@fbr/ui'],
  eslint: {
    // Permite que o build termine mesmo com erros de lint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Também ignoramos erros de tipo durante o build para evitar quebras em produção por TS
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
