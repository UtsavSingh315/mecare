import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificationsProvider } from "@/contexts/notifications-context";
import { Toaster } from "@/components/ui/sonner";
import { ClientLayout } from "@/components/client-layout";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap", // Improve font loading performance
  preload: true,
});

export const metadata: Metadata = {
  title: "MeCare - Period Tracker",
  description:
    "A beautiful and intelligent period tracking app for modern women",
  manifest: "/manifest.json",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌸</text></svg>",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#f43f5e",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Health Tracker",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <NotificationsProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </NotificationsProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
