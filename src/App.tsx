import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Videos from "./pages/Videos";
import NewVideo from "./pages/NewVideo";
import VideoEdit from "./pages/VideoEdit";
// import VideoBuilder from "./pages/VideoBuilder"; // Deprecated/Refactored
import PageBuilder from "./pages/PageBuilder";
import PagesGallery from "./pages/PagesGallery";
import PublicPage from "./pages/PublicPage";
import Profile from "./pages/Profile";
import Plans from "./pages/Plans";
import Tutorial from "./pages/Tutorial";
import PublicVsl from "./pages/PublicVsl";
import Embed from "./pages/Embed";
import Analytics from "./pages/Analytics";
import ConfigPanelsDemo from "./pages/ConfigPanelsDemo";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShell } from "./components/app/AppShell";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/v/:id" element={<PublicVsl />} />
            <Route path="/embed/:id" element={<Embed />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/videos/new" element={<NewVideo />} />
              <Route path="/videos/edit/:id" element={<VideoEdit />} />
              {/* <Route path="/videos/builder/:id" element={<VideoBuilder />} /> */}
              
              <Route path="/pages" element={<PagesGallery />} />
              <Route path="/pages/builder/:id" element={<PageBuilder />} />
              <Route path="/p/:id" element={<PublicPage />} />
              
              <Route path="/profile" element={<Profile />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/tutorial" element={<Tutorial />} />
              <Route path="/config-demo" element={<ConfigPanelsDemo />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
