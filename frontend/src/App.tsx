import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./theme";
import { Header } from "./app/layout/Header";
import { Sidebar } from "./app/layout/Sidebar";
import { Dashboard } from "./features/dashboard/pages/DashboardPage";
import { Tasks } from "./features/tasks/pages/TasksPage";
import { Pets } from "./features/pets/pages/PetsPage";
import Settings from "./features/settings/components/Settings/Settings";
import TaskForm from "./features/tasks/components/TaskForm/TaskForm";
import AuthScreen from "./features/auth/pages/AuthPage";

const App = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/new" element={<TaskForm />} />
            <Route path="/tasks/:id" element={<TaskForm />} />
            <Route path="/pets" element={<Pets />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/auth"
              element={
                <AuthScreen
                  onLoginSuccess={() => {
                    // handle login success: e.g., navigate to dashboard
                    // or set auth state, etc.
                    console.log("Logged in!");
                  }}
                />
              }
            />{" "}
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;
