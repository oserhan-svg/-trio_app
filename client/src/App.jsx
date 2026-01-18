import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ToastProvider } from './context/ToastContext';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy Load Pages
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ClientDetail = React.lazy(() => import('./pages/ClientDetail'));
const ConsultantPanel = React.lazy(() => import('./pages/ConsultantPanel'));
const PropertyDetail = React.lazy(() => import('./pages/PropertyDetail'));
const PropertyListingPage = React.lazy(() => import('./pages/PropertyListingPage'));
const PropertyListingPublic = React.lazy(() => import('./pages/PropertyListingPublic'));
const ProjectReportPage = React.lazy(() => import('./pages/ProjectReportPage'));
const OpportunityReportPage = React.lazy(() => import('./pages/OpportunityReportPage'));

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/property/:id"
              element={
                <PrivateRoute>
                  <PropertyDetail />
                </PrivateRoute>
              }
            />

            {/* NEW ROUTE: Consultant Panel replaces Clients */}
            <Route
              path="/consultant-panel"
              element={
                <PrivateRoute>
                  <ConsultantPanel />
                </PrivateRoute>
              }
            />

            {/* Legacy route alias - Redirect optional, but strict replacement requested so we can remove /clients or just route it to panel too */}
            <Route path="/clients" element={<Navigate to="/consultant-panel" />} />

            <Route path="/clients/:id" element={
              <PrivateRoute>
                <ClientDetail />
              </PrivateRoute>
            } />

            <Route
              path="/property-listing/:propertyId"
              element={
                <PrivateRoute>
                  <PropertyListingPage />
                </PrivateRoute>
              }
            />

            {/* Public route - no authentication required */}
            <Route path="/listing/:token" element={<PropertyListingPublic />} />

            <Route path="/report" element={
              <PrivateRoute>
                <ProjectReportPage />
              </PrivateRoute>
            } />

            <Route path="/reports/opportunities" element={
              <PrivateRoute>
                <OpportunityReportPage />
              </PrivateRoute>
            } />

            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
