import { createContext, useContext, useState } from "react";
import { getUsers, saveUsers } from "./store";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Demo admin credentials
const ADMIN_EMAIL = "admin@letsvibe.com";
const ADMIN_PASSWORD = "admin123";

// Keep authentication per browser tab so separate demo accounts can join one shared
// Local Storage room from different tabs. This is still prototype-only authentication.
const readTabSession = () => {
  try {
    let raw = sessionStorage.getItem("loggedInUser");
    let role = sessionStorage.getItem("loggedInRole");
    if (!raw) {
      raw = localStorage.getItem("loggedInUser");
      role = localStorage.getItem("loggedInRole");
      if (raw) {
        sessionStorage.setItem("loggedInUser", raw);
        if (role) sessionStorage.setItem("loggedInRole", role);
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("loggedInRole");
      }
    }
    return { user: raw ? JSON.parse(raw) : null, role: role || null };
  } catch { return { user: null, role: null }; }
};

export function AuthProvider({ children }) {
  const [initial] = useState(readTabSession);
  const [user, setUser] = useState(initial.user);
  const [role, setRole] = useState(initial.role);

  // Save the session in Local Storage and in React state
  const startSession = (u, r) => {
    sessionStorage.setItem("loggedInUser", JSON.stringify(u));
    sessionStorage.setItem("loggedInRole", r);
    setUser(u);
    setRole(r);
  };

  // Signup: returns an error message, or null when it worked
  const signup = (name, email, password) => {
    const users = getUsers();
    if (users.some((u) => u.email === email)) return "That email is already registered.";
    saveUsers([...users, { name, email, password, createdAt: Date.now() }]); // Save user to Local Storage
    return null;
  };

  // Login: returns "admin", "user" or null (wrong credentials)
  const login = (email, password) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      startSession({ name: "Administrator", email }, "admin");
      return "admin";
    }
    const found = getUsers().find((u) => u.email === email && u.password === password);
    if (!found) return null;
    startSession(found, "user");
    return "user";
  };

  // Front-end demo reset only: no email is sent and this is not production security.
  const resetPassword = (email, password) => {
    const normalized = email.trim().toLowerCase();
    const users = getUsers();
    const index = users.findIndex((u) => u.email === normalized);
    if (index < 0) return "No demo account was found for that email.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    users[index] = { ...users[index], password };
    saveUsers(users);
    return null;
  };

  const logout = () => {
    sessionStorage.removeItem("loggedInUser");
    sessionStorage.removeItem("loggedInRole");
    setUser(null);
    setRole(null);
  };

  // Update the name in both the users list and the session
  const updateName = (name) => {
    saveUsers(getUsers().map((u) => (u.email === user.email ? { ...u, name } : u)));
    startSession({ ...user, name }, role);
  };

  return (
    <AuthContext.Provider value={{ user, role, signup, login, logout, updateName, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}
