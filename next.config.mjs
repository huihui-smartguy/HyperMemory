/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ant-design/icons', 'antd', '@antv/g6'],
  experimental: {
    optimizePackageImports: ['antd', 'echarts-for-react'],
  },
};

export default nextConfig;
