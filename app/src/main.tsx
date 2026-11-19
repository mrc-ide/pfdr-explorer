import '@fontsource-variable/source-sans-3'
import '@fontsource-variable/source-sans-3/wght-italic.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { createQueryClient } from './api/queryClient.ts'
import './styles/tokens.css'
import './styles/base.css'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={createQueryClient()}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
