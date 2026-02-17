import { Link, useLocation } from "react-router-dom";
import { Home, Film, Play, Search, Sun, Moon, User, Shield, Menu } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { motion } from "framer-motion";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import logoImg from "@/assets/logo.png";

const navItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Shorts", path: "/shorts", icon: Film },
  { label: "Watch", path: "/watch/ep-001", icon: Play },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isShorts = location.pathname.startsWith("/shorts");

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${isShorts ? "bg-background/30 backdrop-blur-sm" : "glass-card-strong"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logoImg} alt="Ohayou Anime" className="w-8 h-8 rounded-md object-cover" />
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="text-primary">Ohayou</span>{" "}
              <span className="text-foreground">Anime</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === "/watch/ep-001" && location.pathname.startsWith("/watch"));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden sm:flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className={`p-2 rounded-lg transition-colors ${
                  location.pathname === "/admin"
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                title="Admin Panel"
              >
                <Shield className="w-5 h-5" />
              </Link>
            )}
            <Link
              to="/search"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>
            <button
              onClick={toggleTheme}
              className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300"
              aria-label="Toggle theme"
            >
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.div>
            </button>
            {user ? (
              <Link to="/profile" className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Profile">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-7 h-7 rounded-full object-cover border border-border" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </Link>
            ) : (
              <Link to="/auth" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Sign In">
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 glass-card-strong border-t border-border">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === "/watch/ep-001" && location.pathname.startsWith("/watch"));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
          <Link
            to="/search"
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
              location.pathname === "/search" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-xs">Search</span>
          </Link>
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-muted-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs">Menu</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-72 p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <img src={logoImg} alt="Ohayou Anime" className="w-7 h-7 rounded-md object-cover" />
              <span className="font-display text-lg font-bold">
                <span className="text-primary">Ohayou</span>{" "}
                <span className="text-foreground">Anime</span>
              </span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col py-2">
            {/* Profile / Login */}
            {user ? (
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  location.pathname === "/profile" ? "text-primary bg-primary/10" : "text-foreground hover:bg-accent"
                }`}
              >
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">Profile</span>
              </Link>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  location.pathname === "/auth" ? "text-primary bg-primary/10" : "text-foreground hover:bg-accent"
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Sign In</span>
              </Link>
            )}

            {/* Admin */}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  location.pathname === "/admin" ? "text-primary bg-primary/10" : "text-foreground hover:bg-accent"
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Admin Panel</span>
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => { toggleTheme(); setMenuOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-accent transition-colors w-full text-left"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="text-sm font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}