import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";
import type { DbSeries } from "@/hooks/useSeriesData";
import { useSeries } from "@/hooks/useSeriesData";
import { motion } from "framer-motion";

interface MyListSectionProps {
  watchlistIds: Set<string>;
}

export default function MyListSection({ watchlistIds }: MyListSectionProps) {
  const { data: allSeries } = useSeries();

  if (watchlistIds.size === 0 || !allSeries) return null;

  const seriesList = allSeries.filter((s) => watchlistIds.has(s.id));
  if (seriesList.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div className="flex items-center gap-3 mb-6">
        <Bookmark className="w-5 h-5 text-primary fill-primary" />
        <h2 className="font-display text-xl sm:text-2xl font-bold">My List</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {seriesList.map((series, index) => (
          <motion.div
            key={series.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
          >
            <Link
              to={`/series/${series.id}`}
              className="group block relative rounded-xl overflow-hidden transition-transform duration-300 hover:scale-[1.03]"
            >
              <div className="aspect-[2/3] relative overflow-hidden">
                <img
                  src={series.image_url || "/placeholder.svg"}
                  alt={series.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

                <div className="absolute top-2 right-2">
                  <div className="w-7 h-7 rounded-full bg-primary/90 flex items-center justify-center">
                    <Bookmark className="w-3.5 h-3.5 text-primary-foreground fill-current" />
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-display font-bold text-sm leading-tight text-foreground">
                    {series.title}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {series.episode_count} eps
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
