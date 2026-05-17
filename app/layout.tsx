import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

import { AuthProvider } from "@/components/auth-provider";
import { PrivacyProvider } from "@/contexts/PrivacyContext";

import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "BemoEdge",
  description: "A simple but powerful platform that helps forex traders track performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-white`}>
        <AuthProvider>
          <PrivacyProvider>
            {children}
            <Toaster position="bottom-right" toastOptions={{
              style: {
                background: '#0f0f0f',
                color: '#ffffff',
                border: '1px solid #1f1f1f',
              }
            }} />
          </PrivacyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
