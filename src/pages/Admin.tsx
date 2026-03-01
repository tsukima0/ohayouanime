import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Tv, Film, Clapperboard, Subtitles, Megaphone, Star } from "lucide-react";
import { motion } from "framer-motion";
import AdminGuard from "@/components/admin/AdminGuard";
import SeriesManager from "@/components/admin/SeriesManager";
import EpisodeManager from "@/components/admin/EpisodeManager";
import ShortsManager from "@/components/admin/ShortsManager";
import SubtitleManager from "@/components/admin/SubtitleManager";
import AdsManager from "@/components/admin/AdsManager";
import FeaturedManager from "@/components/admin/FeaturedManager";

const tabs = [
  { id: "featured", label: "Featured", icon: Star },
  { id: "series", label: "Series", icon: Tv },
  { id: "episodes", label: "Episodes", icon: Clapperboard },
  { id: "shorts", label: "Shorts", icon: Film },
  { id: "subtitles", label: "Subtitles", icon: Subtitles },
  { id: "ads", label: "Ads", icon: Megaphone },
] as const;

type Tab = (typeof tabs)[number]["id"];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("featured");

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background pt-20 pb-24 sm:pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage series, episodes, and shorts.</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-secondary mb-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                  activeTab === tab.id
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="admin-tab"
                    className="absolute inset-0 rounded-lg bg-primary glow-primary-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "featured" && <FeaturedManager />}
            {activeTab === "series" && <SeriesManager />}
            {activeTab === "episodes" && <EpisodeManager />}
            {activeTab === "shorts" && <ShortsManager />}
            {activeTab === "subtitles" && <SubtitleManager />}
            {activeTab === "ads" && <AdsManager />}
          </motion.div>
        </div>
      </div>
    </AdminGuard>
  );
}
