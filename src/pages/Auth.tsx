import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Play, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        navigate("/");
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center glow-primary-sm">
            <Play className="w-4 h-4 text-primary-foreground fill-current" />
          </div>
          <span className="font-display text-xl font-bold">
            Ani<span className="text-primary">Stream</span>
          </span>
        </div>

        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          {isLogin ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {isLogin
            ? "Sign in to access your watchlist and continue watching."
            : "Sign up to save your favorite anime and track progress."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}
          {message && (
            <p className="text-xs text-primary bg-primary/10 px-3 py-2 rounded-lg">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setMessage("");
            }}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
