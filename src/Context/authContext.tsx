import { createContext, useContext, useEffect, useState } from "react";
import API from "../api/axios";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, token?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_USER_KEY = "auth_user";
const AUTH_TOKEN_KEY = "auth_token";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const login = (nextUser: User, token?: string) => {
    setUser(nextUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    setLoading(false);
  };

  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setUser(null);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setUser(null);
      localStorage.removeItem(AUTH_USER_KEY);
      setLoading(false);
      return;
    }

    try {
      const res = await API.get("/auth/me");
      setUser(res.data);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.data));
    } catch (error: any) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error("Auth bootstrap failed", error);
      }
      setUser(null);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext)!;
};
