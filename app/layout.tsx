import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayout from "./client-layout";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { BankProvider } from "@/context/BankContext";
import AuthGuard from "@/components/AuthGuard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bank Admin Dashboard",
  description: "Bank Admin dashboard for Crepe platform",
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
                <ToastContainer
                  position="top-center"       
                  autoClose={4000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                  style={{
                    width: '90%',
                    maxWidth: '600px',
                    margin: '0 auto',
                    top: '20px'
                  }}
                  toastClassName="!w-full !max-w-none text-lg font-medium bg-white shadow-xl rounded-xl border border-gray-100 px-8 py-6 !mb-4"
                  progressClassName="!bg-blue-500"
                />
              </AuthGuard>
            </BankProvider>
          </WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}