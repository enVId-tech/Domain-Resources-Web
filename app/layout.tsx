import type { Metadata, Viewport } from "next";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: "Domain Resources",
  description: "Links and resources for domain problems.",
  icons: { icon: "/envidtech.png" },
};

export const viewport: Viewport = {
  themeColor: "#070908",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
