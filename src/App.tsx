import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Route guards
import { ProtectedRoute } from "@/components/routes/ProtectedRoute";
import { AnalystRoute } from "@/components/routes/AnalystRoute";
import { FieldRoute } from "@/components/routes/FieldRoute";
import { RoleBasedRedirect } from "@/components/routes/RoleBasedRedirect";

// Public pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";

// Analyst pages
import AnalystDashboard from "./pages/analyst/AnalystDashboard";
import FormsView from "./pages/analyst/FormsView";
import MapsView from "./pages/analyst/MapsView";
import DashboardsView from "./pages/analyst/DashboardsView";
import SettingsView from "./pages/analyst/SettingsView";

// Field staff pages
import FieldForms from "./pages/field/FieldForms";
import FieldMap from "./pages/field/FieldMap";
import FieldProfile from "./pages/field/FieldProfile";

// Shared pages
import FormBuilder from "./pages/FormBuilder";
import FormSubmit from "./pages/FormSubmit";
import MapViewer from "./pages/MapViewer";
import MapBuilder from "./pages/MapBuilder";
import PublicFormSubmit from "./pages/public/PublicFormSubmit";
import PublicMapViewer from "./pages/public/PublicMapViewer";
import EmbedFormViewer from "./pages/embed/EmbedFormViewer";
import EmbedMapViewer from "./pages/embed/EmbedMapViewer";

// Layouts
import AnalystLayout from "./components/layouts/AnalystLayout";
import FieldStaffLayout from "./components/layouts/FieldStaffLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/register" element={<Register />} />
                  
                  {/* Public sharing routes */}
                  <Route path="/public/form/:token" element={<PublicFormSubmit />} />
                  <Route path="/public/map/:token" element={<PublicMapViewer />} />
                  
                  {/* Embed routes */}
                  <Route path="/embed/form/:token" element={<EmbedFormViewer />} />
                  <Route path="/embed/map/:token" element={<EmbedMapViewer />} />

                  {/* Protected analyst routes */}
                  <Route 
                    path="/analyst" 
                    element={
                      <AnalystRoute>
                        <AnalystLayout />
                      </AnalystRoute>
                    }
                  >
                    <Route index element={<AnalystDashboard />} />
                    <Route path="forms" element={<FormsView />} />
                    <Route path="maps" element={<MapsView />} />
                    <Route path="dashboards" element={<DashboardsView />} />
                    <Route path="settings" element={<SettingsView />} />
                  </Route>

                  {/* Protected field staff routes */}
                  <Route 
                    path="/field" 
                    element={
                      <FieldRoute>
                        <FieldStaffLayout />
                      </FieldRoute>
                    }
                  >
                    <Route index element={<FieldForms />} />
                    <Route path="map" element={<FieldMap />} />
                    <Route path="profile" element={<FieldProfile />} />
                  </Route>

                  {/* Shared protected routes */}
                  <Route 
                    path="/form-builder" 
                    element={
                      <ProtectedRoute>
                        <FormBuilder />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/form/:formId/submit" 
                    element={
                      <ProtectedRoute>
                        <FormSubmit />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/form/:formId/map" 
                    element={
                      <ProtectedRoute>
                        <MapViewer />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/map-builder/:mapId?" 
                    element={
                      <ProtectedRoute>
                        <MapBuilder />
                      </ProtectedRoute>
                    } 
                  />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
