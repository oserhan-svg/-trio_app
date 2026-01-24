import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ToastProvider } from './context/ToastContext';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ServerWakeupHandling from './components/ui/ServerWakeupHandling';

// Lazy Load Pages
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ClientDetail = React.lazy(() => import('./pages/ClientDetail'));
const PropertyDetail = React.lazy(() => import('./pages/PropertyDetail'));
const PropertyListingPage = React.lazy(() => import('./pages/PropertyListingPage'));
const PropertyListingPublic = React.lazy(() => import('./pages/PropertyListingPublic'));
const ProjectReportPage = React.lazy(() => import('./pages/ProjectReportPage'));
const OpportunityReportPage = React.lazy(() => import('./pages/OpportunityReportPage'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AppShell = React.lazy(() => import('./components/layout/AppShell'));

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <AppShell>{children}</AppShell> : <Navigate to="/login" />;
};

// Wrapper Lazy Imports
const ClientTracking = React.lazy(() => import('./components/crm/ClientTracking'));
const AppsPage = React.lazy(() => import('./pages/AppsPage'));
const ToolsPage = React.lazy(() => import('./pages/ToolsPage'));
const PortfolioDashboard = React.lazy(() => import('./components/admin/PortfolioDashboard'));
const MatchNewsfeed = React.lazy(() => import('./components/crm/MatchNewsfeed'));
const MapInsight = React.lazy(() => import('./components/apps/MapInsight'));
const MarketRadar = React.lazy(() => import('./components/apps/MarketRadar'));
const WhatsAppBotDashboard = React.lazy(() => import('./components/whatsapp/WhatsAppBotDashboard'));
const TrainingDashboard = React.lazy(() => import('./components/ai/TrainingDashboard'));
const Agenda = React.lazy(() => import('./components/agenda/Agenda'));
const PendingContactsTable = React.lazy(() => import('./components/crm/PendingContactsTable'));
const AdminManagement = React.lazy(() => import('./pages/AdminManagement'));
const PerformanceDashboard = React.lazy(() => import('./components/admin/PerformanceDashboard'));

// Wrapper Components
const ClientTrackingWrapper = () => <div className="p-6"><h1 className="text-2xl font-black text-slate-800 mb-6">Müşteri Yönetimi</h1><ClientTracking /></div>;

const PortfolioWrapper = () => {
  const [user] = React.useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  // Show Agency Portfolio for everyone by default so they see all office listings
  return <div className="p-6"><PortfolioDashboard mode="agency" user={user} /></div>;
};

const MatchNewsfeedWrapper = () => <div className="p-6"><h1 className="text-2xl font-black text-slate-800 mb-6">Akıllı Eşleşmeler</h1><MatchNewsfeed /></div>;
const MapInsightWrapper = () => <div className="p-6"><MapInsight /></div>;
const MarketRadarWrapper = () => <div className="p-6"><MarketRadar /></div>;
const WhatsAppWrapper = () => <div className="p-6"><WhatsAppBotDashboard /></div>;
const TrainingWrapper = () => <div className="p-6"><TrainingDashboard /></div>;
const AgendaWrapper = () => <div className="p-6"><Agenda /></div>;
const PendingContactsWrapper = () => <div className="p-6"><h1 className="text-2xl font-black text-slate-800 mb-6">Aday Havuzu</h1><PendingContactsTable /></div>;
const AdminManagementWrapper = () => <div className="p-6"><AdminManagement isEmbedded={false} /></div>;
const PerformanceWrapper = () => <div className="p-6"><PerformanceDashboard /></div>;

const VoiceAssistant = React.lazy(() => import('./components/ai/VoiceAssistant'));

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <ServerWakeupHandling />
        <Toaster position="top-right" />
        <Suspense fallback={<LoadingSpinner />}>
          <VoiceAssistant />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/listing/:token" element={<PropertyListingPublic />} />

            {/* Dashboard (Home) */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/crm/apps" element={<PrivateRoute><AppsPage /></PrivateRoute>} />
            <Route path="/crm/tools" element={<PrivateRoute><ToolsPage /></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />

            {/* --- CRM ROUTES --- */}
            <Route path="/crm/clients" element={
              <React.Suspense fallback={<LoadingSpinner />}>
                <PrivateRoute>
                  <ClientTrackingWrapper />
                </PrivateRoute>
              </React.Suspense>
            } />
            <Route path="/clients" element={<Navigate to="/crm/clients" />} /> {/* Legacy Redirect */}
            <Route path="/clients/:id" element={<PrivateRoute><ClientDetail /></PrivateRoute>} />

            <Route path="/crm/matches" element={
              <React.Suspense fallback={<LoadingSpinner />}>
                <PrivateRoute>
                  <MatchNewsfeedWrapper />
                </PrivateRoute>
              </React.Suspense>
            } />

            <Route path="/crm/agenda" element={
              <React.Suspense fallback={<LoadingSpinner />}>
                <PrivateRoute>
                  <AgendaWrapper />
                </PrivateRoute>
              </React.Suspense>
            } />

            <Route path="/crm/pool" element={
              <React.Suspense fallback={<LoadingSpinner />}>
                <PrivateRoute>
                  <PendingContactsWrapper />
                </PrivateRoute>
              </React.Suspense>
            } />

            {/* --- PORTFOLIO ROUTES --- */}
            <Route path="/portfolio" element={
              <React.Suspense fallback={<LoadingSpinner />}>
                <PrivateRoute>
                  <PortfolioWrapper />
                </PrivateRoute>
              </React.Suspense>
            } />
            <Route path="/property/:id" element={<PrivateRoute><PropertyDetail /></PrivateRoute>} />
            <Route path="/property-listing/:propertyId" element={<PrivateRoute><PropertyListingPage /></PrivateRoute>} />

            {/* --- INTELLIGENCE & APPS --- */}
            <Route path="/intelligence/map" element={
              <React.Suspense fallback={<LoadingSpinner />}>
                <PrivateRoute>
                  <MapInsightWrapper />
                </PrivateRoute>
              </React.Suspense>
            } />

            <Route path="/intelligence/market-radar" element={
              <React.Suspense fallback={<LoadingSpinner />}>
                <PrivateRoute>
                  <MarketRadarWrapper />
                </PrivateRoute>
              </React.Suspense>
            } />

            <Route path="/intelligence/whatsapp" element={
              <React.Suspense fallback={<LoadingSpinner />}>
                <PrivateRoute>
                  <WhatsAppWrapper />
                </PrivateRoute>
              </React.Suspense>
            } />

            <Route path="/intelligence/training" element={
              <React.Suspense fallback={<LoadingSpinner />}>
                <PrivateRoute>
                  <TrainingWrapper />
                </PrivateRoute>
              </React.Suspense>
            } />

            {/* --- ADMIN ONLY --- */}
            <Route path="/admin/team" element={
              <React.Suspense fallback={<LoadingSpinner />}>
                <PrivateRoute>
                  <AdminManagementWrapper />
                </PrivateRoute>
              </React.Suspense>
            } />

            <Route path="/admin/performance" element={
              <React.Suspense fallback={<LoadingSpinner />}>
                <PrivateRoute>
                  <PerformanceWrapper />
                </PrivateRoute>
              </React.Suspense>
            } />

            <Route path="/admin/settings" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} /> {/* Keeping one catch-all for now or detailed settings */}

            {/* Reports */}
            <Route path="/report" element={<PrivateRoute><ProjectReportPage /></PrivateRoute>} />
            <Route path="/reports/opportunities" element={<PrivateRoute><OpportunityReportPage /></PrivateRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
