import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navigation } from "@/components/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificationsProvider } from "@/contexts/notifications-context";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

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
            <AuthGuard>
              <main className="pb-20 min-h-screen">{children}</main>
              <Navigation />
            </AuthGuard>
          </NotificationsProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
