import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import TopNav from './components/TopNav.jsx'
import Footer from './components/Footer.jsx'
import { AuthProvider, RequireAuth } from './auth/AuthContext.jsx'
import HomePage from './pages/HomePage.jsx'
import JobPage from './pages/JobPage.jsx'
import DocsPage from './pages/DocsPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import GalleryPage from './pages/GalleryPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import LegalPage from './pages/LegalPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import SignIn from './pages/SignIn.jsx'
import SignUp from './pages/SignUp.jsx'

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

const guard = (el) => <RequireAuth>{el}</RequireAuth>

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/job/:jobId" element={<JobPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/api" element={<Navigate to="/docs#rest-api" replace />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/history" element={guard(<HistoryPage />)} />
            <Route path="/gallery" element={guard(<GalleryPage />)} />
            <Route path="/checkout/:planId" element={guard(<CheckoutPage />)} />
            <Route path="/account" element={guard(<AccountPage />)} />
            <Route path="/privacy" element={<LegalPage kind="privacy" />} />
            <Route path="/terms" element={<LegalPage kind="terms" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
