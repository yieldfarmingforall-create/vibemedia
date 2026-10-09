import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatAssistant from './components/ChatAssistant';

// Page imports
import Home from './pages/Home';
import Uslugi from './pages/Uslugi';
import Konsultacja from './pages/Konsultacja';
import Szczegoly from './pages/Szczegoly';
import Platnosc from './pages/Platnosc';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#000' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FFC107', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  return (
    <>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
        <Route path="/uslugi" element={<><Navbar /><Uslugi /><Footer /></>} />
        <Route path="/konsultacja" element={<><Navbar /><Konsultacja /><Footer /></>} />
        <Route path="/szczegoly" element={<><Navbar /><Szczegoly /><Footer /></>} />
        <Route path="/platnosc" element={<><Navbar /><Platnosc /><Footer /></>} />

        {/* ADMIN ROUTES – hidden URL */}
        <Route path="/management-dashboard-secure-nr7x912" element={<AdminLogin />} />
        <Route path="/management-dashboard-secure-nr7x912/dashboard" element={<AdminDashboard />} />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <ChatAssistant />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;