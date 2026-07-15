import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Pets as PetsIcon } from "@mui/icons-material";
import { register, initializeGoogleAuth } from "../../../services/auth/authService";
import { useAuth } from "../../../contexts/AuthContext";
import { useLocalization } from "../../../contexts/LocalizationContext";
import { LanguageSwitcher } from "../../../components/common/LanguageSwitcher";

// Google logo SVG — brand colours must stay exact per Google brand guidelines
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function AuthScreen() {
  const { t } = useLocalization();
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleAvailable, setIsGoogleAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeGoogleAuth()
      .then(() => setIsGoogleAvailable(true))
      .catch(() => setIsGoogleAvailable(false));
  }, []);

  const validateInputs = (): boolean => {
    if (!username.trim() || username.length < 3) {
      setError(t("auth.usernameMinLength3"));
      return false;
    }
    if (!isLogin) {
      if (password.length < 8)   { setError(t("auth.passwordMinLength8"));     return false; }
      if (!/\d/.test(password))  { setError(t("auth.passwordContainsDigit"));  return false; }
      if (!/[A-Z]/.test(password)) { setError(t("auth.passwordContainsUppercase")); return false; }
    } else {
      if (password.length < 6)   { setError(t("auth.passwordMinLength6"));     return false; }
    }
    return true;
  };

  const handleAuth = async () => {
    setError(null);
    if (!validateInputs()) return;
    setLoading(true);
    try {
      if (isLogin) {
        await login(username.trim(), password);
        navigate("/dashboard");
      } else {
        await register(username.trim(), password);
        setError(null);
        setIsLogin(true);
        setPassword("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.authenticationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.googleSignInFailed"));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loading) handleAuth();
  };

  const busy = loading || googleLoading;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
        zIndex: 1000,
      }}
    >
      {/* Language switcher — top right */}
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <LanguageSwitcher variant="compact" />
      </Box>

      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 400,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Logo + title */}
        <Box sx={{ textAlign: "center", mb: 1 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 1.5,
            }}
          >
            <PetsIcon sx={{ color: "primary.contrastText", fontSize: 28 }} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            PawfectPal
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {isLogin ? t("auth.welcomeBack") : t("auth.createAccount")}
          </Typography>
        </Box>

        {/* Error */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ py: 0.5 }}>
            {error}
          </Alert>
        )}

        {/* Password requirements hint */}
        {!isLogin && (
          <Alert severity="info" sx={{ py: 0.5, fontSize: "0.78rem" }}>
            {t("auth.passwordRequirements")}: 8+ {t("auth.passwordRequirementLength")},
            {" "}{t("auth.passwordRequirementUppercase")},
            {" "}{t("auth.passwordRequirementDigit")}
          </Alert>
        )}

        {/* Fields */}
        <TextField
          label={t("auth.username")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          disabled={busy}
          size="medium"
          fullWidth
          autoFocus
        />
        <TextField
          label={t("auth.password")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isLogin ? "current-password" : "new-password"}
          disabled={busy}
          size="medium"
          fullWidth
        />

        {/* Submit */}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={busy}
          size="large"
          sx={{ fontWeight: 700 }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : (isLogin ? t("auth.login") : t("auth.register"))}
        </Button>

        {/* Google */}
        {isGoogleAvailable && (
          <>
            <Divider sx={{ color: "text.disabled", fontSize: "0.75rem" }}>
              {t("auth.or")}
            </Divider>
            <Button
              type="button"
              variant="outlined"
              fullWidth
              disabled={busy}
              onClick={handleGoogleSignIn}
              startIcon={googleLoading ? <CircularProgress size={16} /> : <GoogleLogo />}
              sx={{ fontWeight: 500, color: "text.primary", borderColor: "divider" }}
            >
              {googleLoading ? t("auth.signingIn") : (isLogin ? t("auth.signInWithGoogle") : t("auth.signUpWithGoogle"))}
            </Button>
          </>
        )}

        {/* Toggle login / register */}
        <Button
          type="button"
          variant="text"
          fullWidth
          disabled={busy}
          onClick={() => { setIsLogin(!isLogin); setPassword(""); setError(null); }}
          sx={{ color: "primary.main", fontSize: "0.85rem" }}
        >
          {isLogin ? t("auth.dontHaveAccountRegister") : t("auth.alreadyHaveAccountLogin")}
        </Button>
      </Paper>
    </Box>
  );
}
