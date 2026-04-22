import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { login as loginApi, logout as logoutApi, signInWithGoogle } from "../services/auth/authService";
import { getBaseUrl } from "../services/api";
import type { LoginResponse, User } from "../types/auth";
import { StorageHelper } from "../utils/StorageHelper";

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  forceLogout: (reason: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async (token: string): Promise<User> => {
    const response = await fetch(`${getBaseUrl()}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    return response.json();
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = await StorageHelper.getItem("authToken");

      if (!token) {
        setUser(null);
        return;
      }

      try {
        const userData = await fetchCurrentUser(token);
        setUser(userData);
      } catch {
        await StorageHelper.removeItem("authToken");
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      await StorageHelper.removeItem("authToken");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response: LoginResponse = await loginApi(username, password);
      await StorageHelper.setItem("authToken", response.access_token);
      const fullUser = await fetchCurrentUser(response.access_token);
      setUser(fullUser);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const response: LoginResponse = await signInWithGoogle();
      await StorageHelper.setItem("authToken", response.access_token);
      const fullUser = await fetchCurrentUser(response.access_token);
      setUser(fullUser);
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      await StorageHelper.removeItem("authToken");
      setUser(null);
    }
  };

  const forceLogout = async (_reason: string) => {
    await StorageHelper.removeItem("authToken");
    setUser(null);

    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    void checkAuth();

    const handleTokenExpiry = (event: CustomEvent) => {
      void forceLogout(event.detail.reason);
    };

    window.addEventListener("auth:token-expired", handleTokenExpiry as EventListener);

    return () => {
      window.removeEventListener("auth:token-expired", handleTokenExpiry as EventListener);
    };
  }, []);

  const value: AuthContextType = {
    user,
    setUser,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    logout,
    checkAuth,
    forceLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
