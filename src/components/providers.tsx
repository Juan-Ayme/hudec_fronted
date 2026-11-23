"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import { reintentar } from "@/features/bi/shared/useBIQuery";
import { SucursalProvider } from "@/components/sucursal-context";
import { AuthProvider } from "@/components/auth-context";
import { CompanyProvider } from "@/components/company-context";

const config: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 300_000, // 5 min
      refetchOnWindowFocus: false,
      // Una sola vez y solo ante 502/503/504 (ver `reintentar`): un 4xx no cambia
      // y un 500 o un corte de tiempo en un informe pesado solo multiplica la carga.
      retry: reintentar,
      retryDelay: 3000,
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
