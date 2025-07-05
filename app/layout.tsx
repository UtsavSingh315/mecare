import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navigation } from "@/components/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MeCare - Period Tracker",
  description:
    "A beautiful and intelligent period tracking app for modern women",
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
          <AuthGuard>
            <main className="pb-20 min-h-screen">{children}</main>
            <Navigation />
          </AuthGuard>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
