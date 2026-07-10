import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // 紹介協力制度: 静的移植したLP（public/lp/ipsf/index.html）をディレクトリURLで配信
      { source: "/lp/ipsf", destination: "/lp/ipsf/index.html" },
      { source: "/lp/ipsf/", destination: "/lp/ipsf/index.html" },
    ];
  },
};

export default nextConfig;
