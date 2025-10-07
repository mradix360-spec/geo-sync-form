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
import AdminDashboard from "./pages/analyst/AdminDashboard";

// Field staff pages
import FieldForms from "./pages/field/FieldForms";
import OfflineDataManager from "./pages/field/OfflineDataManager";
import FieldProfile from "./pages/field/FieldProfile";

// Shared pages
import FormBuilder from "./pages/FormBuilder";
import FormSubmit from "./pages/FormSubmit";
import MapViewer from "./pages/MapViewer";
import MapViewerById from "./pages/MapViewerById";
import MapBuilder from "./pages/MapBuilder";
import DashboardBuilder from "./pages/DashboardBuilder";
import DashboardViewer from "./pages/DashboardViewer";
import PublicFormSubmit from "./pages/public/PublicFormSubmit";
import PublicMapViewer from "./pages/public/PublicMapViewer";
import PublicDashboardViewer from "./pages/public/PublicDashboardViewer";
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
                  <Route path="/public/dashboard/:token" element={<PublicDashboardViewer />} />
                  
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
                    <Route path="admin" element={<AdminDashboard />} />
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
                    <Route path="offline" element={<OfflineDataManager />} />
                    <Route path="profile" element={<FieldProfile />} />
                  </Route>

                  {/* Shared protected routes */}
                  <Route 
                    path="/form-builder/:formId?" 
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
                  <Route 
                    path="/dashboard-builder/:dashboardId?" 
                    element={
                      <ProtectedRoute>
                        <DashboardBuilder />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard-viewer/:id" 
                    element={
                      <ProtectedRoute>
                        <DashboardViewer />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/map-viewer/:id" 
                    element={
                      <ProtectedRoute>
                        <MapViewerById />
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
