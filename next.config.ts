import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile to plain static files in ./out (no Node server needed to run the result).
  output: "export",
  // The image optimizer needs a server; this site only uses plain <img>.
  images: { unoptimized: true },
};

export default nextConfig;
