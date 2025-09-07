import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/Router';
import { AuthProvider } from './context/AuthContext';
import { OrganizationProvider } from './context/OrganizationContext';

function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </OrganizationProvider>
    </AuthProvider>
  );
}

export default App;
