"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Calendar, PlusCircle, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: PlusCircle, label: "Log", href: "/log" },
  { icon: BarChart3, label: "Insights", href: "/insights" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Don't show navigation on auth pages or if not authenticated
  const authPages = ["/auth/login", "/auth/signup", "/auth/forgot-password"];
  const isAuthPage = authPages.includes(pathname);

  if (isAuthPage || !isAuthenticated) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-button ${
                isActive ? "active" : "text-gray-400 hover:text-gray-600"
              }`}>
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
