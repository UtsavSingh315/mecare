"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/loading";

// Dynamically import components for better loading performance
const Navigation = dynamic(() => import("@/components/navigation").then(mod => ({ default: mod.Navigation })), {
  ssr: false,
  loading: () => <div className="h-16 bg-white border-t border-gray-200"></div>,
});

const AuthGuard = dynamic(() => import("@/components/auth-guard").then(mod => ({ default: mod.AuthGuard })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center">
      <LoadingSpinner message="Loading app..." size="lg" />
    </div>
  ),
});

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <main className="pb-20 min-h-screen">{children}</main>
      <Navigation />
    </AuthGuard>
  );
}
