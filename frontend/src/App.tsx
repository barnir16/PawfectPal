import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LocalizationProvider } from "./contexts/LocalizationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Header } from "./app/layout/Header";
import { Sidebar } from "./app/layout/Sidebar";
import { Dashboard } from "./features/dashboard/pages/DashboardPage";
import { Tasks } from "./features/tasks/pages/TasksPage";
import { Pets } from "./features/pets/pages/PetsPage";
import { PetForm } from "./features/pets/components/PetForm/PetForm";
import { PetDetail } from "./features/pets/components/PetDetail/PetDetail";
import Settings from "./features/settings/components/Settings/Settings";
import TaskForm from "./features/tasks/components/TaskForm/TaskForm";
import { WeightTrackingPage } from "./features/weight/pages/WeightTrackingPage";
import AuthScreen from "./features/auth/pages/AuthPage";
import { ProfilePage } from "./features/profile/pages/ProfilePage";
import { AIChatbot, ChatToggleButton } from "./components/ai/AIChatbot";
import { useAIChat } from "./hooks/useAIChat";
import { useLocalization } from "./contexts/LocalizationContext";
import { NotificationContainer } from "./components/notifications/NotificationContainer";
import ErrorBoundary from "./components/ErrorBoundary";
import "./utils/testVaccines"; // Import test utility

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocalizationProvider>
          <NotificationProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </NotificationProvider>
        </LocalizationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isChatOpen, selectedPet, openChat, closeChat, toggleChat } = useAIChat();
  const { t } = useLocalization();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // If not authenticated, show only the auth screen
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // If authenticated, show the full app
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Header onMenuClick={handleDrawerToggle} />
      <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${240}px)` },
          ml: { sm: `${240}px` },
          mt: "64px",
          overflow: "auto",
          height: "calc(100vh - 64px)",
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/new" element={<TaskForm />} />
          <Route path="/tasks/edit/:id" element={<TaskForm />} />
          <Route path="/pets" element={<Pets />} />
          <Route path="/pets/new" element={<PetForm />} />
          <Route path="/pets/:id" element={<PetDetail />} />
          <Route path="/pets/:id/edit" element={<PetForm />} />
          <Route path="/weight-tracking" element={<WeightTrackingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Box>

      {/* AI Chatbot */}
      <AIChatbot
        isOpen={isChatOpen}
        onClose={closeChat}
        selectedPet={selectedPet}
      />
      <ChatToggleButton onClick={toggleChat} t={t} />
      
      {/* Notifications */}
      <NotificationContainer />
    </Box>
  );
};

export default App;
