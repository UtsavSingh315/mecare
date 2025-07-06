"use client";

import React, { createContext, useContext, useMemo, ReactNode } from "react";

// Performance optimized context wrapper
export function createOptimizedContext<T>() {
  const Context = createContext<T | undefined>(undefined);

  function useOptimizedContext() {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error("useOptimizedContext must be used within a Provider");
    }
    return context;
  }

  function Provider({ children, value }: { children: ReactNode; value: T }) {
    // Memoize the context value to prevent unnecessary re-renders
    const memoizedValue = useMemo(() => value, [value]);

    return (
      <Context.Provider value={memoizedValue}>
        {children}
      </Context.Provider>
    );
  }

  return { Provider, useContext: useOptimizedContext };
}

// Memoized component wrapper for expensive renders
export const MemoizedCard = React.memo(({ children, ...props }: any) => {
  return <div {...props}>{children}</div>;
});

// Performance wrapper for form components
export const OptimizedForm = React.memo(({ children, ...props }: any) => {
  return <form {...props}>{children}</form>;
});

MemoizedCard.displayName = "MemoizedCard";
OptimizedForm.displayName = "OptimizedForm";
