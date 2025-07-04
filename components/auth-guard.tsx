"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/login", "/auth/signup", "/auth/forgot-password"];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!loading) {
      // Redirect logic
      if (!isAuthenticated && !isPublicRoute) {
        router.push("/auth/login");
      } else if (isAuthenticated && isPublicRoute) {
        router.push("/");
      }
    }
  }, [loading, isAuthenticated, isPublicRoute, pathname, router]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-4">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <Heart className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">MeCare</h2>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show welcome screen for unauthenticated users on protected routes
  if (!loading && !isAuthenticated && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <Card className="shadow-lg border-0 bg-gradient-to-r from-rose-500 to-pink-500 text-white">
            <CardContent className="p-8 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Welcome to MeCare</h1>
              <p className="text-rose-100">
                Your personal period tracking companion
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-gray-800 text-center">
                Get Started
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/auth/signup")}
                  className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium">
                  Create Account
                </Button>
                <Button
                  onClick={() => router.push("/auth/login")}
                  variant="outline"
                  className="w-full h-12 border-rose-200 text-rose-600 hover:bg-rose-50">
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-500">
            <p>Track your cycle • Log symptoms • Get insights</p>
          </div>
        </div>
      </div>
    );
  }

  // Render children for authenticated users or public routes
  return <>{children}</>;
}
