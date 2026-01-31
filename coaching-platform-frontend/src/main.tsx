// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/styles/main.css'; 
import './index.css'
import { AuthProvider } from './contexts/AuthContext'; 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import NotificationContainer from './components/common/NotificationContainer.tsx';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (garbage collection time - renamed from cacheTime in v5)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1, // Reduce retries for faster failure handling
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> 
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
        <NotificationContainer />
        <App />
        </NotificationProvider>
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>,
);