import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Link } from "react-router-dom";
import { ShieldAlert, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 pt-16">
        <ShieldAlert className="w-12 h-12 text-muted-foreground" />
        <h1 className="font-display text-xl font-bold text-foreground">Sign in required</h1>
        <p className="text-sm text-muted-foreground text-center">You need to be signed in to access this page.</p>
        <Link to="/auth" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold glow-primary hover:bg-primary/90 transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 pt-16">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <h1 className="font-display text-xl font-bold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground text-center">You don't have admin privileges.</p>
        <Link to="/" className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-all">
          Go Home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
