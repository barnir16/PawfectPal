import React, { useState } from "react";
import { login, register } from "../../../services";
import { StorageHelper } from "./../../../utils/StorageHelper";

interface AuthScreenProps {
  readonly onLoginSuccess: () => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  let buttonText: string;
  if (loading) {
    buttonText = "Loading...";
  } else if (isLogin) {
    buttonText = "Login";
  } else {
    buttonText = "Register";
  }

  const validateInputs = (): boolean => {
    if (!username.trim()) {
      alert("Please enter a username");
      return false;
    }

    if (!password.trim()) {
      alert("Please enter a password");
      return false;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long");
      return false;
    }

    if (username.length < 3) {
      alert("Username must be at least 3 characters long");
      return false;
    }

    return true;
  };

  const handleAuth = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      if (isLogin) {
        const response = await login(username.trim(), password);
        await StorageHelper.setItem("authToken", response.access_token);
        onLoginSuccess();
      } else {
        await register(username.trim(), password);
        alert("Registration successful! Please login with your new account.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Authentication failed. Please try again.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loading) {
      handleAuth();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: "white",
          borderRadius: 8,
          padding: 30,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1 style={{ textAlign: "center", color: "#333", marginBottom: 10 }}>
          PawfectPal
        </h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: 40 }}>
          {isLogin ? "Welcome back!" : "Create your account"}
        </p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          disabled={loading}
          style={{
            padding: 15,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 15,
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={loading}
          style={{
            padding: 15,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 15,
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: loading ? "#ccc" : "#007AFF",
            color: "white",
            fontSize: 16,
            fontWeight: 600,
            padding: 15,
            borderRadius: 8,
            border: "none",
            cursor: loading ? "default" : "pointer",
            marginBottom: 15,
          }}
        >
          {buttonText}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setPassword("");
          }}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            color: "#007AFF",
            cursor: "pointer",
            fontSize: 14,
            textAlign: "center",
          }}
        >
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </button>
      </form>
    </div>
  );
}
