import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getPlan } from "../services/plans";

// Navbar + page content + footer. "solid" = black navbar, "admin" = admin menu
export default function Layout({ children, solid = true, admin = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login"); // redirect after logout
  };

  return (
    <>
      <header className={solid ? "navbar solid" : "navbar"}>
        <div className="container nav-inner">
          <div className="brand-lockup"><div className="logo">Let's Vibe{admin && " Admin"}</div><span className="brand-caption">STREAM YOUR MOOD</span></div>
          <ul className="nav-links">
            {admin ? (
              <li><NavLink to="/admin">Dashboard</NavLink></li>
            ) : (
              <>
                <li><NavLink to="/" end>Home</NavLink></li>
                <li><NavLink to="/movies">Movies</NavLink></li>
                <li><NavLink to="/watchlist">My List</NavLink></li>
                <li><NavLink to="/vibe-together">Vibe Together</NavLink></li>
                <li><NavLink to="/creator-corner">Creator Corner</NavLink></li>
                <li><NavLink to="/subscription">Plans</NavLink></li>
                <li><NavLink to="/profile">Profile</NavLink></li>
              </>
            )}
          </ul>
          <div className="nav-user">
            <span>Hi, {user?.name}</span>{!admin && <span className="nav-plan">{user ? getPlan(user.email).name : ""}</span>}
            <button className="btn btn-small btn-outline" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>
      {children}
      <footer className="footer">Let's Vibe &middot; React + Vite &middot; Local Storage demo project</footer>
    </>
  );
}
