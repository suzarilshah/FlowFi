import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Navigation from './components/Navigation';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Income = lazy(() => import('./pages/Income'));
const Reports = lazy(() => import('./pages/Reports'));
const DataManagement = lazy(() => import('./pages/DataManagement'));
const Settings = lazy(() => import('./pages/Settings'));
const Home = lazy(() => import('./pages/Home'));
const DocumentIntelligence = lazy(() => import('./pages/DocumentIntelligence'));function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navigation />
        <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
          <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/income" element={<Income />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/data-management" element={<DataManagement />} />
                <Route path="/document-intelligence" element={<DocumentIntelligence />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
