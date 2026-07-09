"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { SucursalProvider } from "@/components/sucursal-context";
import { AuthProvider } from "@/components/auth-context";
import { CompanyProvider } from "@/components/company-context";

const config: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 300_000, // 5 min
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // No reintentar si la API no responde o devuelve 4xx.
        if (error instanceof ApiError) {
          if (error.status === 0 || (error.status >= 400 && error.status < 500))
            return false;
        }
        return failureCount < 2;
      },
    },
  },
};

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CompanyProvider>
        <SucursalProvider>{children}</SucursalProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient(config));

  return (
    <QueryClientProvider client={client}>
      <AppProviders>{children}</AppProviders>
    </QueryClientProvider>
  );
}
