import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import Watch from "./pages/Watch";
import Watchlist from "./pages/Watchlist";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Subscription from "./pages/Subscription";
import VibeTogether from "./pages/VibeTogether";
import CreatorCorner from "./pages/CreatorCorner";

// Route guard: only the matching role can open the page, others go to login
function Protected({ role, children }) {
  const { role: current } = useAuth();
  return current === role ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const user = (page) => <Protected role="user">{page}</Protected>;
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={user(<Home />)} />
      <Route path="/movies" element={user(<Movies />)} />
      <Route path="/watch/:id" element={user(<Watch />)} />
      <Route path="/watchlist" element={user(<Watchlist />)} />
      <Route path="/profile" element={user(<Profile />)} />
      <Route path="/subscription" element={user(<Subscription />)} />
      <Route path="/vibe-together" element={user(<VibeTogether />)} />
      <Route path="/creator-corner" element={user(<CreatorCorner />)} />
      <Route path="/admin" element={<Protected role="admin"><Admin /></Protected>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
