import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/mobile.css";
import { ensureAmplifyConfigured } from "@/lib/amplifyClient";
import LayoutWrapper from "@/components/LayoutWrapper";
import NextAuthSessionProvider from "@/components/SessionProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundaryWrapper from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chinchilla HR Neo - Modern HR Portal",
  description: "Experience next-generation HR management with AI-enhanced workflows",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chinchilla HR Neo",
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
  // Configure Amplify client-side
  if (typeof window !== 'undefined') {
    ensureAmplifyConfigured();
  }
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundaryWrapper>
          <NextAuthSessionProvider>
            <AuthProvider>
              <NotificationProvider>
                <LayoutWrapper>{children}</LayoutWrapper>
              </NotificationProvider>
            </AuthProvider>
          </NextAuthSessionProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
