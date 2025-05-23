import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayout from "./client-layout";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { BankProvider } from "@/context/BankContext";
import AuthGuard from "@/components/AuthGuard";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crepe Dashboard",
  description: "Admin dashboard for Crepe platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <WebSocketProvider>
            <BankProvider>
              <AuthGuard>
                <ClientLayout>{children}</ClientLayout>
              </AuthGuard>
            </BankProvider>
          </WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}