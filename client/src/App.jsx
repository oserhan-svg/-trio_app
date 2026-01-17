import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientDetail from './pages/ClientDetail';
import ConsultantPanel from './pages/ConsultantPanel';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// ... other imports ...

import PropertyDetail from './pages/PropertyDetail';
import PropertyListingPage from './pages/PropertyListingPage';
import PropertyListingPublic from './pages/PropertyListingPublic';
import ProjectReportPage from './pages/ProjectReportPage';
import OpportunityReportPage from './pages/OpportunityReportPage';
import { ToastProvider } from './context/ToastContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
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
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
