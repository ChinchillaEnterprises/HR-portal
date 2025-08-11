import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/mobile.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chinchilla Flow - HR Portal",
  description: "Streamline your HR operations and manage your team efficiently",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chinchilla Flow",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
