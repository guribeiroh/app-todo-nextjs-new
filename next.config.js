/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Aumentar o timeout para o carregamento de chunks
    config.watchOptions = {
      ...config.watchOptions,
      aggregateTimeout: 300,
      poll: 1000,
    };
    
    // Ajustar configuração de chunks para melhorar performance
    if (!isServer) {
      // Reduzir o número de chunks para minimizar problemas de carregamento
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](@vercel|next|react|react-dom)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/](?!(@vercel|next|react|react-dom)[\\/])/,
            name: 'lib',
            priority: 30,
            minChunks: 2,
          },
        },
      };
    }
    
    return config;
  },
  // Aumentar o limite de tempo para geração de páginas
  staticPageGenerationTimeout: 180,
  poweredByHeader: false,
  // Adicionar configuração para tentar corrigir o problema de timeout
  experimental: {
    forceSwcTransforms: true,
    esmExternals: 'loose',
  }
};

// Exportação com configurações padrão do Next.js
module.exports = nextConfig; 