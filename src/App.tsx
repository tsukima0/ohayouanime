import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import ShortsPage from "./pages/Shorts";
import WatchPage from "./pages/Watch";
import BrowsePage from "./pages/Browse";
import SeriesDetailPage from "./pages/SeriesDetail";
import AuthPage from "./pages/Auth";
import ProfilePage from "./pages/Profile";
import SearchPage from "./pages/Search";
import AdminPage from "./pages/Admin";
import NotFound from "./pages/NotFound";
import CopyrightPolicyPage from "./pages/CopyrightPolicy";
import Footer from "@/components/Footer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/shorts" element={<ShortsPage />} />
              <Route path="/shorts/:shortId" element={<ShortsPage />} />
              <Route path="/series/:seriesId" element={<SeriesDetailPage />} />
              <Route path="/watch/:episodeId" element={<WatchPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/copyright-policy" element={<CopyrightPolicyPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
