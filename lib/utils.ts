import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities to prevent hydration mismatches
export function formatDate(
  date: string | Date,
  options?: {
    weekday?: "short" | "long";
    month?: "short" | "long" | "numeric";
    day?: "numeric";
    year?: "numeric";
  }
) {
  // Ensure we're working with a Date object
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Use a consistent format that works on both server and client
  if (options) {
    try {
      return dateObj.toLocaleDateString("en-US", options);
    } catch (error) {
      // Fallback if toLocaleDateString fails
      return dateObj.toDateString();
    }
  }

  return dateObj.toDateString();
}

export function formatDateShort(date: string | Date) {
  return formatDate(date, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
