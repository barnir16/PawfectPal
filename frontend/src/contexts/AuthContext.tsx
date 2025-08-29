import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { StorageHelper } from "../utils/StorageHelper";
import {
  login as loginApi,
  logout as logoutApi,
} from "../services/auth/authService";
import { getApiUrl } from "../config";
import type { User, LoginResponse } from "../types/auth";

const API_BASE_URL = getApiUrl();

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
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

  const checkAuth = async () => {
    try {
      console.log("Checking authentication...");
      setIsLoading(true);
      const token = await StorageHelper.getItem("authToken");
      console.log("Token found:", !!token);

      if (token) {
        // Try to validate token with backend
        try {
          const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            console.log("User authenticated:", userData.username);
          } else {
            // Token is invalid, clear it
            console.log("Token invalid, clearing...");
            await StorageHelper.removeItem("authToken");
            setUser(null);
          }
        } catch (error) {
          console.log("Token validation failed, clearing...");
          await StorageHelper.removeItem("authToken");
          setUser(null);
        }
      } else {
        // No token found, user is not authenticated
        setUser(null);
        console.log("No token found, user not authenticated");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      await StorageHelper.removeItem("authToken");
      setUser(null);
    } finally {
      console.log("Setting isLoading to false");
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response: LoginResponse = await loginApi(username, password);

      // Store the token
      await StorageHelper.setItem("authToken", response.access_token);

      // Create a minimal user object from the login data
      const user: User = {
        id: 1, // We'll get this from the backend later
        username: username,
        is_active: true,
        is_provider: false,
        is_email_verified: false,
        is_phone_verified: false,
        date_joined: new Date().toISOString(),
      };

      setUser(user);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Always clear local state even if API call fails
      await StorageHelper.removeItem("authToken");
      setUser(null);
    }
  };

  const forceLogout = async (reason: string) => {
    console.log(`Force logout: ${reason}`);
    await StorageHelper.removeItem("authToken");
    setUser(null);
    // Show user-friendly message
    alert(`You have been logged out: ${reason}\nPlease log in again.`);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    setUser,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
    forceLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
