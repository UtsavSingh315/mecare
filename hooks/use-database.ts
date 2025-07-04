"use client";

import { useState, useEffect } from "react";

interface DatabaseStatus {
  connected: boolean;
  loading: boolean;
  error: string | null;
}

export function useDatabaseStatus(): DatabaseStatus {
  const [status, setStatus] = useState<DatabaseStatus>({
    connected: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function checkConnection() {
      try {
        const response = await fetch("/api/health");
        const data = await response.json();

        setStatus({
          connected: data.status === "healthy",
          loading: false,
          error:
            data.status === "healthy" ? null : "Database connection failed",
        });
      } catch (error) {
        setStatus({
          connected: false,
          loading: false,
          error: "Failed to check database status",
        });
      }
    }

    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  return status;
}

// Hook for making API calls with error handling
export function useApiCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = async (url: string, options?: RequestInit) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "API call failed");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { apiCall, loading, error, setError };
}
