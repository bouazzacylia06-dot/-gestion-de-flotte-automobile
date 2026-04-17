import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/useAuth';
import ProtectedRoute from './auth/ProtectedRoute';

/**
 * Redirige vers la première page accessible selon le rôle.
 * Utilisé pour / ET pour les routes inconnues.
 */
function HomeRedirect() {
  const { hasRole } = useAuth();
  if (hasRole('admin') || hasRole('manager')) return <Navigate to="/dashboard" replace />;
  if (hasRole('technicien'))                  return <Navigate to="/maintenance" replace />;
  return <Navigate to="/vehicles" replace />;
}
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Pages
import LoginPage       from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import DashboardPage   from './pages/DashboardPage';
import VehiclesPage    from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import ConducteursPage  from './pages/ConducteursPage';
import MaintenancePage  from './pages/MaintenancePage';
import LocalisationPage from './pages/LocalisationPage';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 max-w-screen-2xl">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login"        element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Accueil : redirige vers la bonne page selon le rôle */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Dashboard — admin, manager */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['admin', 'manager']}>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Véhicules — admin, manager, utilisateur */}
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute roles={['admin', 'manager', 'utilisateur']}>
            <AppLayout>
              <VehiclesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/:id"
        element={
          <ProtectedRoute roles={['admin', 'manager', 'utilisateur']}>
            <AppLayout>
              <VehicleDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Conducteurs — admin, manager */}
      <Route
        path="/conducteurs"
        element={
          <ProtectedRoute roles={['admin', 'manager']}>
            <AppLayout>
              <ConducteursPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Maintenance — admin, manager, technicien */}
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute roles={['admin', 'manager', 'technicien']}>
            <AppLayout>
              <MaintenancePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Localisation — admin, manager, utilisateur */}
      <Route
        path="/localisation"
        element={
          <ProtectedRoute roles={['admin', 'manager', 'utilisateur']}>
            <AppLayout>
              <LocalisationPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback : route inconnue → même logique */}
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
