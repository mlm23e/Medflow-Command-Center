import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

export default function App({ themeMode, onToggleTheme }) {
  const { isAuthenticated } = useAuth();

  return isAuthenticated
    ? <DashboardPage themeMode={themeMode} onToggleTheme={onToggleTheme} />
    : <LoginPage />;
}
