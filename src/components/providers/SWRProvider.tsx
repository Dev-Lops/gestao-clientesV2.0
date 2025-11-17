'use client';

import { ReactNode } from 'react';
import { toast } from 'sonner';
import { SWRConfig } from 'swr';

// Fetcher padrão para SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('Erro ao carregar dados');
    // @ts-expect-error - adicionar info ao error
    error.info = await res.json();
    // @ts-expect-error - adicionar status ao error
    error.status = res.status;
    throw error;
  }

  return res.json();
};

interface SWRProviderProps {
  children: ReactNode;
}

export default function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: true,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        dedupingInterval: 2000,
        focusThrottleInterval: 5000,
        onError: (error) => {
          console.error('SWR Error:', error);
          toast.error(error?.message || 'Erro ao carregar dados');
        },
        onSuccess: () => {
          // Opcional: log de sucesso
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
