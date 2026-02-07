import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { mockTrendingSeries, simulcastSeries, type AnimeSeries } from "@/lib/mock-data";
import { User, Mail, Calendar, Bookmark, LogOut, ArrowLeft, Play } from "lucide-react";
import { motion } from "framer-motion";

import seriesShadow from "@/assets/series-shadow-requiem.jpg";
import seriesNeon from "@/assets/series-neon-drift.jpg";
import seriesCrimson from "@/assets/series-crimson-academy.jpg";
import seriesVoid from "@/assets/series-void-walker.jpg";
import seriesBlade from "@/assets/series-blade-symphony.jpg";
import seriesStarfall from "@/assets/series-starfall-chronicle.jpg";

const imageMap: Record<string, string> = {
  "series-1": seriesShadow,
  "series-2": seriesNeon,
  "series-3": seriesCrimson,
  "series-4": seriesVoid,
  "series-5": seriesBlade,
  "series-6": seriesStarfall,
};

function getSeriesData(seriesId: string): AnimeSeries | undefined {
  return [...mockTrendingSeries, ...simulcastSeries].find((s) => s.id === seriesId);
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { watchlistIds, toggleWatchlist } = useWatchlist();

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Not Signed In</h1>
          <p className="text-muted-foreground text-sm mb-4">Sign in to view your profile.</p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm glow-primary"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const savedSeries = Array.from(watchlistIds)
    .map((id) => getSeriesData(id))
    .filter(Boolean) as AnimeSeries[];

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  return (
    <div className="min-h-screen bg-background pt-16 pb-20 sm:pb-0">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 sm:p-8 border border-border"
        >
          <div className="flex items-center gap-5">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata.full_name || "Avatar"}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-primary object-cover flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground truncate">
                {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
              </h1>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="glass-card rounded-xl p-4 text-center border border-border">
              <p className="font-display text-2xl font-bold text-primary">{watchlistIds.size}</p>
              <p className="text-xs text-muted-foreground mt-1">In My List</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center border border-border">
              <p className="font-display text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground mt-1">Episodes Watched</p>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={signOut}
            className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium w-full justify-center"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </motion.div>

        {/* My List */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-5">
            <Bookmark className="w-5 h-5 text-primary fill-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">
              My List ({savedSeries.length})
            </h2>
          </div>

          {savedSeries.length === 0 ? (
            <div className="glass-card rounded-xl p-8 border border-border text-center">
              <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Your list is empty.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Browse series and tap the bookmark icon to save them here.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold glow-primary"
              >
                <Play className="w-4 h-4 fill-current" />
                Browse Anime
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {savedSeries.map((series, index) => (
                <motion.div
                  key={series.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="relative"
                >
                  <Link
                    to={`/series/${series.id}`}
                    className="group block rounded-xl overflow-hidden transition-transform duration-300 hover:scale-[1.03]"
                  >
                    <div className="aspect-[2/3] relative overflow-hidden">
                      <img
                        src={imageMap[series.id] || seriesShadow}
                        alt={series.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-display font-bold text-sm text-foreground">{series.name}</h3>
                        <span className="text-xs text-muted-foreground">{series.episodes} eps</span>
                      </div>
                    </div>
                  </Link>
                  {/* Remove button */}
                  <button
                    onClick={() => toggleWatchlist(series.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10 hover:bg-primary/80 transition-colors"
                    title="Remove from My List"
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
