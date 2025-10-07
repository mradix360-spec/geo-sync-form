import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import FormBuilder from "./pages/FormBuilder";
import FormSubmit from "./pages/FormSubmit";
import MapViewer from "./pages/MapViewer";
import NotFound from "./pages/NotFound";
import AnalystLayout from "./components/layouts/AnalystLayout";
import FormsView from "./pages/analyst/FormsView";
import MapsView from "./pages/analyst/MapsView";
import DashboardsView from "./pages/analyst/DashboardsView";
import SettingsView from "./pages/analyst/SettingsView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Analyst/Admin Routes */}
              <Route element={<AnalystLayout />}>
                <Route path="/dashboard" element={<Navigate to="/dashboard/forms" replace />} />
                <Route path="/dashboard/forms" element={<FormsView />} />
                <Route path="/dashboard/maps" element={<MapsView />} />
                <Route path="/dashboard/dashboards" element={<DashboardsView />} />
                <Route path="/dashboard/settings" element={<SettingsView />} />
              </Route>
              
              {/* Other routes */}
              <Route path="/form-builder" element={<FormBuilder />} />
              <Route path="/form/:formId/submit" element={<FormSubmit />} />
              <Route path="/form/:formId/map" element={<MapViewer />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
