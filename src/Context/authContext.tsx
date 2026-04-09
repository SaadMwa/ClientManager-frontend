import { createContext, useContext, useEffect, useState } from "react";
import API from "../api/axios";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (token: string) => {
    console.log("Login: saving token");
    localStorage.setItem("token", token);
    await fetchUser();
    console.log("Login: fetchUser complete");
  };

  const logout = () => {
    console.log("Logout: removing token");
    localStorage.removeItem("token");
    setUser(null);
  };

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    console.log("fetchUser: token exists?", !!token);
    
    if (!token) {
      console.log("fetchUser: no token, setting loading false");
      setLoading(false);
      return;
    }

    try {
      console.log("fetchUser: calling /auth/me");
      const res = await API.get("/auth/me");
      console.log("fetchUser: user data:", res.data);
      setUser(res.data);
    } catch (error: any) {
      console.log("fetchUser: error", error.response?.status, error.response?.data);
      // Only logout on auth errors (401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("fetchUser: token invalid, logging out");
        localStorage.removeItem("token");
        setUser(null);
      } else {
        console.log("fetchUser: network error, keeping user null");
        setUser(null);
      }
    } finally {
      console.log("fetchUser: setting loading false");
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("AuthProvider mounted, checking auth...");
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext)!;
};