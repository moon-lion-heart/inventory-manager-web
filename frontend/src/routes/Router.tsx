import { Routes, Route, Navigate } from 'react-router-dom';
import MainPage from '../pages/MainPage';
import AuthPage from '../pages/AuthPage';
import RegisterOrganizationPage from '../pages/RegisterOrganizationPage';
import OrganizationForm from '../components/OrganizationForm';
import RegisterCompletePage from '../pages/RegisterCompletePage';
import EntryPoint from '../pages/EntryPoint';
import PrivateRoute from './PrivateRoute';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/entry" />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/entry" element={<EntryPoint />} />
      <Route
        path="/main"
        element={
          <PrivateRoute>
            <MainPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/register-organization"
        element={
          <PrivateRoute>
            <RegisterOrganizationPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/register-organization/:mode"
        element={
          <PrivateRoute>
            <OrganizationForm />
          </PrivateRoute>
        }
      />
      <Route 
        path="/register-complete" 
        element={
          <PrivateRoute>
            <RegisterCompletePage />
          </PrivateRoute>
        } 
      />
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
};

export default AppRouter;
