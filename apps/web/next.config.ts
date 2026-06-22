import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@shipflow/auth", "@shipflow/db", "@workspace/ui"],
}

export default nextConfig
