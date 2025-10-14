import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CssBaseline, CircularProgress, Fab } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import {
  LocalizationProvider,
  useLocalization,
} from "./contexts/LocalizationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Header } from "./app/layout/Header";
import { Sidebar } from "./app/layout/Sidebar";
import { Dashboard } from "./features/dashboard/pages/DashboardPage";
import { Tasks } from "./features/tasks/pages/TasksPage";
import { Pets } from "./features/pets/pages/PetsPage";
import { ServicesPage } from "./features/services/pages/ServicesPage";
import { BookService } from "./features/services/pages/BookService";
import { ServiceRequestBrowser } from "./components/services/ServiceRequestBrowser";
import { ServiceRequestDetails } from "./components/services/ServiceRequestDetails";
import { MyServiceRequests } from "./components/services/MyServiceRequests";
import { ServiceRequestForm } from "./components/services/ServiceRequestForm";
import ServiceDetailsPage from "./features/services/pages/ServiceDetailsPage";
import { PetForm } from "./features/pets/components/PetForm/PetForm";
import { PetDetail } from "./features/pets/components/PetDetail/PetDetail";
import Settings from "./features/settings/components/Settings/Settings";
import TaskForm from "./features/tasks/components/TaskForm/TaskForm";
import { WeightTrackingPage } from "./features/weight/pages/WeightTrackingPage";
import AuthScreen from "./features/auth/pages/AuthPage";
import ProfilePage from "./features/profile/pages/ProfilePage";
import { AIChatbot, ChatToggleButton } from "./components/ai/AIChatbot";
import { useAIChat } from "./hooks/useAIChat";
import { NotificationContainer } from "./components/notifications/NotificationContainer";
import ErrorBoundary from "./components/ErrorBoundary";
import RealVaccineTracker from "./components/tasks/RealVaccineTracker";
import { ChatListPage } from "./features/chat/pages/ChatListPage";
import { ChatPage } from "./features/chat/pages/ChatPage";
import "./utils/testVaccines"; // Import test utility
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

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
  const [desktopOpen, setDesktopOpen] = useState(true);
  const { isChatOpen, selectedPet, openChat, closeChat, toggleChat } =
    useAIChat();
  const { t, isRTL } = useLocalization();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
          zIndex: 1300,
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
      <Header onMenuClick={handleDrawerToggle} desktopOpen={desktopOpen} />
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={handleDrawerToggle}
        onDesktopToggle={setDesktopOpen}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 }, // Responsive padding
          width: {
            xs: "100%", // Full width on mobile
            sm: desktopOpen ? `calc(100% - 240px)` : `calc(100% - 64px)`,
          },
          ml: { 
            xs: "0px", // No margin on mobile
            sm: isRTL ? "0px" : desktopOpen ? "240px" : "64px" 
          },
          mr: { 
            xs: "0px", // No margin on mobile
            sm: isRTL ? (desktopOpen ? "240px" : "64px") : "0px" 
          },
          mt: "64px",
          overflow: "auto",
          height: "calc(100vh - 64px)",
          transition: "width 0.3s ease, margin 0.3s ease",
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
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:id" element={<ServiceDetailsPage />} />
          <Route path="/bookservice" element={<BookService />} />
          <Route path="/service-request-form" element={<ServiceRequestForm />} />
          <Route
            path="/service-requests"
            element={
              <ProtectedRoute requireProvider>
                <ServiceRequestBrowser />
              </ProtectedRoute>
            }
          />{" "}
          <Route path="/my-service-requests" element={<MyServiceRequests />} />
          <Route
            path="/service-requests/:id"
            element={<ServiceRequestDetails />}
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/test-vaccines" element={<RealVaccineTracker />} />
          <Route path="/chat-list" element={<ChatListPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />{" "}
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
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </Box>
  );
};

export default App;
