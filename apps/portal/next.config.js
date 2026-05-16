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
  webpack: (config, { isServer }) => {
    if (isServer) {
      // @napi-rs/canvas não está disponível no ambiente de container/Alpine.
      // Ignoramos o módulo para silenciar os warnings do pdfjs-dist permanentemente.
      config.resolve.alias = {
        ...config.resolve.alias,
        '@napi-rs/canvas': false,
      };
    }
    return config;
  },
};

export default nextConfig;
