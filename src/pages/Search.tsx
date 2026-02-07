import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, X, ArrowUpDown, Film, Tv } from "lucide-react";
import { useSeries, useEpisodes, type PublicSeries } from "@/hooks/useSeriesData";
import AnimeCard from "@/components/AnimeCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type SortOption = "rating-desc" | "rating-asc" | "name-asc" | "name-desc" | "episodes-desc";

const sortLabels: Record<SortOption, string> = {
  "rating-desc": "Rating ↓",
  "rating-asc": "Rating ↑",
  "name-asc": "A → Z",
  "name-desc": "Z → A",
  "episodes-desc": "Most Episodes",
};

type Tab = "series" | "episodes";

export default function SearchPage() {
  const { data: allSeries = [], isLoading: seriesLoading } = useSeries();
  const { data: allEpisodes = [], isLoading: episodesLoading } = useEpisodes();

  const [query, setQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("rating-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("series");

  const allGenres = useMemo(
    () => Array.from(new Set(allSeries.flatMap((s) => s.genres))).sort(),
    [allSeries]
  );

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedGenres([]);
    setSort("rating-desc");
  };

  const hasActiveFilters = query || selectedGenres.length > 0 || sort !== "rating-desc";

  const filteredSeries = useMemo(() => {
    let results = [...allSeries];

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q) ||
          s.genres.some((g) => g.toLowerCase().includes(q))
      );
    }

    if (selectedGenres.length > 0) {
      results = results.filter((s) =>
        selectedGenres.every((g) => s.genres.includes(g))
      );
    }

    switch (sort) {
      case "rating-desc":
        results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "rating-asc":
        results.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
        break;
      case "name-asc":
        results.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name-desc":
        results.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "episodes-desc":
        results.sort((a, b) => b.episode_count - a.episode_count);
        break;
    }

    return results;
  }, [query, selectedGenres, sort, allSeries]);

  const filteredEpisodes = useMemo(() => {
    if (!query) return allEpisodes;
    const q = query.toLowerCase();
    return allEpisodes.filter(
      (ep) =>
        ep.title.toLowerCase().includes(q) ||
        (ep.series?.title || "").toLowerCase().includes(q) ||
        (ep.description || "").toLowerCase().includes(q)
    );
  }, [query, allEpisodes]);

  return (
    <div className="min-h-screen bg-background pt-20 pb-24 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            Search
          </h1>
          <p className="text-muted-foreground text-sm">
            Find your next favorite anime series or episode.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search series, episodes, genres..."
              className="pl-10 bg-secondary border-border"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              showFilters || selectedGenres.length > 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {selectedGenres.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary-foreground text-primary text-xs flex items-center justify-center font-bold">
                {selectedGenres.length}
              </span>
            )}
          </button>
        </motion.div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-6"
            >
              <div className="glass-card rounded-xl p-5 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {allGenres.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedGenres.includes(genre)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-accent"
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    Sort by
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(sortLabels) as [SortOption, string][]).map(
                      ([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setSort(key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            sort === key
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-accent"
                          }`}
                        >
                          {label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-secondary rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("series")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "series"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tv className="w-4 h-4" />
            Series
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
              {filteredSeries.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("episodes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "episodes"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Film className="w-4 h-4" />
            Episodes
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
              {filteredEpisodes.length}
            </Badge>
          </button>
        </div>

        {/* Active filters display */}
        {selectedGenres.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground">Filtering:</span>
            {selectedGenres.map((genre) => (
              <Badge
                key={genre}
                variant="default"
                className="cursor-pointer gap-1"
                onClick={() => toggleGenre(genre)}
              >
                {genre}
                <X className="w-3 h-3" />
              </Badge>
            ))}
          </div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {activeTab === "series" ? (
            <motion.div
              key="series"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {seriesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
                  ))}
                </div>
              ) : filteredSeries.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredSeries.map((series, index) => (
                    <AnimeCard key={series.id} series={series} index={index} />
                  ))}
                </div>
              ) : (
                <EmptyState type="series" query={query} />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="episodes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {episodesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : filteredEpisodes.length > 0 ? (
                <div className="space-y-3">
                  {filteredEpisodes.map((ep, index) => (
                    <EpisodeRow key={ep.id} episode={ep} index={index} />
                  ))}
                </div>
              ) : (
                <EmptyState type="episodes" query={query} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EpisodeRow({
  episode,
  index,
}: {
  episode: { id: string; title: string; episode_number: number; season: number; duration: number; description: string | null; series: { id: string; title: string; image_url: string | null } | null };
  index: number;
}) {
  const mins = Math.floor(episode.duration / 60);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/watch/${episode.id}`}
        className="flex items-center gap-4 p-4 rounded-xl glass-card hover:bg-accent/50 transition-colors group"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
          <Film className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-primary font-semibold mb-0.5">
            {episode.series?.title || "Unknown"} · S{episode.season} E{episode.episode_number}
          </p>
          <h3 className="font-display font-bold text-sm text-foreground truncate">
            {episode.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {episode.description}
          </p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {mins}m
        </span>
      </Link>
    </motion.div>
  );
}

function EmptyState({ type, query }: { type: string; query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">
        No {type} found
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {query
          ? `No results for "${query}". Try a different search or adjust your filters.`
          : "Try adjusting your filters to see results."}
      </p>
    </div>
  );
}
