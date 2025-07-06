"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ 
  message = "Loading...", 
  size = "md",
  className = ""
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 className={`animate-spin text-rose-500 mb-4 ${sizeClasses[size]}`} />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
}

export function PageLoader({ message = "Loading page..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center">
      <LoadingSpinner message={message} size="lg" />
    </div>
  );
}

export function CardLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
      <LoadingSpinner message={message} size="md" />
    </div>
  );
}
