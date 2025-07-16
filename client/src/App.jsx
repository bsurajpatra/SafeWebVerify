import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage/LandingPage'
import Footer from './components/Footer/Footer'
import Signup from './components/Signup/Signup'
import Login from './components/Login/Login'
import ForgotPassword from './components/ForgotPassword/ForgotPassword'
import Dashboard from './components/Dashboard/Dashboard'
import Profile from './components/Profile/Profile'
import History from './components/History/History';
import './App.css'

function LandingPageWithNav() {
  const navigate = useNavigate();
  return <LandingPage onGetStarted={() => navigate('/signup')} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPageWithNav />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
