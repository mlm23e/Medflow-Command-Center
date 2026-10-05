import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import getTheme from './theme.js';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

function Root() {
  const [mode, setMode] = useState(() => (
    localStorage.getItem('medflow-theme') === 'light' ? 'light' : 'dark'
  ));
  const theme = useMemo(() => getTheme(mode), [mode]);

  useEffect(() => {
    localStorage.setItem('medflow-theme', mode);
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const toggleTheme = () => {
    setMode((currentMode) => (currentMode === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App themeMode={mode} onToggleTheme={toggleTheme} />
      </AuthProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);