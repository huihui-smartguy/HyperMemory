/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // standalone 模式：构建产物包含 .next/standalone/，适合最小化 Docker 镜像部署。
  // 详见 docs/DEPLOYMENT.md
  output: 'standalone',
  transpilePackages: ['@ant-design/icons', 'antd', '@antv/g6'],
  experimental: {
    optimizePackageImports: ['antd', 'echarts-for-react'],
  },
};

export default nextConfig;
