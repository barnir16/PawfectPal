import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { register, initializeGoogleAuth, signInWithGoogle } from "../../../services/auth/authService";
import { useAuth } from "../../../contexts/AuthContext";
import { useLocalization } from "../../../contexts/LocalizationContext";

export default function AuthScreen() {
  const { t } = useLocalization();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleAvailable, setIsGoogleAvailable] = useState(false);

  // Initialize Google Auth
  useEffect(() => {
    const initGoogle = async () => {
      try {
        await initializeGoogleAuth();
        setIsGoogleAvailable(true);
      } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
        setIsGoogleAvailable(false);
      }
    };
    initGoogle();
  }, []);

  let buttonText: string;
  if (loading) {
    buttonText = t('common.loading');
  } else if (isLogin) {
    buttonText = t('auth.login');
  } else {
    buttonText = t('auth.register');
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

    if (!isLogin) {
      // Registration validation - stricter password requirements
      if (password.length < 8) {
        alert("Password must be at least 8 characters long");
        return false;
      }
      
      if (!/\d/.test(password)) {
        alert("Password must contain at least one digit");
        return false;
      }
      
      if (!/[A-Z]/.test(password)) {
        alert("Password must contain at least one uppercase letter");
        return false;
      }
    } else {
      // Login validation - more lenient for existing users
      if (password.length < 6) {
        alert("Password must be at least 6 characters long");
        return false;
      }
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
        await login(username.trim(), password);
        navigate("/dashboard");
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const response = await signInWithGoogle();
      
      // Store the token using the same method as regular login
      localStorage.setItem('authToken', response.access_token);
      
      // Force a page reload to trigger AuthContext re-initialization
      // This will make the AuthContext detect the new token and update the user state
      window.location.href = "/dashboard";
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Google Sign-In failed. Please try again.";
      alert(errorMessage);
    } finally {
      setGoogleLoading(false);
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
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#f5f5f5",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        fontFamily: "Arial, sans-serif",
        zIndex: 1000,
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
        <p style={{ textAlign: "center", color: "#666", marginBottom: 20 }}>
                      {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
        </p>
        
        {!isLogin && (
          <div style={{ fontSize: 12, color: "#888", marginBottom: 20, lineHeight: 1.4 }}>
            <strong>Password requirements:</strong><br/>
            • At least 8 characters<br/>
            • At least one uppercase letter<br/>
            • At least one digit
          </div>
        )}

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

        {isGoogleAvailable && (
          <div style={{ position: 'relative' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              margin: '15px 0',
              color: '#666',
              fontSize: 14
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
              <span style={{ margin: '0 15px' }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              style={{
                width: '100%',
                backgroundColor: googleLoading ? "#ccc" : "#fff",
                color: "#333",
                fontSize: 16,
                fontWeight: 500,
                padding: 12,
                borderRadius: 8,
                border: "1px solid #ddd",
                cursor: googleLoading ? "default" : "pointer",
                marginBottom: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? "Signing in..." : `Sign ${isLogin ? 'in' : 'up'} with Google`}
            </button>
          </div>
        )}

        {!isGoogleAvailable && (
          <div style={{ 
            fontSize: 12, 
            color: '#888', 
            textAlign: 'center',
            marginBottom: 15,
            padding: 10,
            backgroundColor: '#f8f9fa',
            borderRadius: 4,
            border: '1px solid #e9ecef'
          }}>
            💡 <strong>Tip:</strong> Google Sign-In can be enabled via Firebase Remote Config.
            <br />See FIREBASE_CONFIG_SETUP.md for details.
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setPassword("");
          }}
          disabled={loading || googleLoading}
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
