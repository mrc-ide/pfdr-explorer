import '@fontsource-variable/source-sans-3';
import '@fontsource-variable/source-sans-3/wght-italic.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Showcase } from './Showcase';
import '../styles/tokens.css';
import '../styles/base.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Showcase />
  </StrictMode>
);
