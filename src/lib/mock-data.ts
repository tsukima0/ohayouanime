export interface AnimeShort {
  id: string;
  title: string;
  animeName: string;
  episodeId: string;
  timestamp: number; // seconds into the full episode
  duration: number; // short clip duration
  thumbnail: string;
  description: string;
  views: string;
  likes: number;
}

export interface AnimeEpisode {
  id: string;
  seriesId: string;
  animeName: string;
  episodeNumber: number;
  title: string;
  thumbnail: string;
  duration: number;
  description: string;
  season: number;
}

export interface AnimeSeries {
  id: string;
  name: string;
  thumbnail: string;
  genre: string[];
  rating: number;
  episodes: number;
  status: "Airing" | "Completed" | "Upcoming";
  description: string;
}

export interface ContinueWatchingItem {
  episodeId: string;
  seriesId: string;
  animeName: string;
  episodeNumber: number;
  episodeTitle: string;
  progress: number; // 0-100 percentage watched
  duration: number;
  currentTime: number;
}

export interface NewEpisodeItem {
  episodeId: string;
  seriesId: string;
  animeName: string;
  episodeNumber: number;
  episodeTitle: string;
  duration: number;
  releasedAgo: string;
}

export const mockShorts: AnimeShort[] = [
  {
    id: "short-1",
    title: "The Awakening — Epic Power Reveal",
    animeName: "Shadow Requiem",
    episodeId: "ep-001",
    timestamp: 842, // 14:02
    duration: 45,
    thumbnail: "/placeholder.svg",
    description: "The moment Kaito unleashes his hidden power for the first time. The arena falls silent.",
    views: "2.4M",
    likes: 184200,
  },
  {
    id: "short-2",
    title: "Final Stand — Rooftop Battle",
    animeName: "Shadow Requiem",
    episodeId: "ep-001",
    timestamp: 1260, // 21:00
    duration: 30,
    thumbnail: "/placeholder.svg",
    description: "An impossible fight on the city rooftop. Rain, lightning, and pure determination.",
    views: "1.8M",
    likes: 142500,
  },
  {
    id: "short-3",
    title: "The Promise — Emotional Farewell",
    animeName: "Shadow Requiem",
    episodeId: "ep-001",
    timestamp: 380, // 6:20
    duration: 60,
    thumbnail: "/placeholder.svg",
    description: "Before the battle begins, a promise is made that changes everything.",
    views: "3.1M",
    likes: 267800,
  },
];

export const mockEpisodes: AnimeEpisode[] = [
  {
    id: "ep-001",
    seriesId: "series-1",
    animeName: "Shadow Requiem",
    episodeNumber: 1,
    title: "The World Beneath",
    thumbnail: "/placeholder.svg",
    duration: 1440,
    description: "In a world where shadows hold ancient power, Kaito discovers he is the last heir to a forgotten bloodline. When darkness threatens to consume the city, he must choose between hiding and becoming what he was destined to be.",
    season: 1,
  },
  {
    id: "ep-002",
    seriesId: "series-1",
    animeName: "Shadow Requiem",
    episodeNumber: 2,
    title: "Crimson Dawn",
    thumbnail: "/placeholder.svg",
    duration: 1380,
    description: "Kaito's awakening attracts the attention of the Shadow Council. As crimson light fills the sky, an ancient prophecy begins to unfold, and unlikely allies emerge from the darkness.",
    season: 1,
  },
  {
    id: "ep-003",
    seriesId: "series-1",
    animeName: "Shadow Requiem",
    episodeNumber: 3,
    title: "Echoes of the Void",
    thumbnail: "/placeholder.svg",
    duration: 1500,
    description: "The void between worlds grows thin. Kaito must master his abilities before the next eclipse, or risk losing everything he swore to protect.",
    season: 1,
  },
  {
    id: "ep-004",
    seriesId: "series-2",
    animeName: "Neon Drift",
    episodeNumber: 1,
    title: "Ignition Point",
    thumbnail: "/placeholder.svg",
    duration: 1440,
    description: "In Neo-Tokyo 2187, underground mecha racers compete for survival. Riku, a former engineer, discovers a prototype that could change everything.",
    season: 1,
  },
  {
    id: "ep-005",
    seriesId: "series-2",
    animeName: "Neon Drift",
    episodeNumber: 2,
    title: "Overdrive",
    thumbnail: "/placeholder.svg",
    duration: 1380,
    description: "The qualifying rounds begin. Riku must push beyond his limits as rival factions close in on his prototype's secret technology.",
    season: 1,
  },
  {
    id: "ep-006",
    seriesId: "series-3",
    animeName: "Crimson Academy",
    episodeNumber: 1,
    title: "Enrollment",
    thumbnail: "/placeholder.svg",
    duration: 1440,
    description: "New students arrive at the prestigious Crimson Academy, unaware of the deadly trials that await beneath its pristine facade.",
    season: 1,
  },
  {
    id: "ep-007",
    seriesId: "series-4",
    animeName: "Void Walker",
    episodeNumber: 1,
    title: "The Thin Veil",
    thumbnail: "/placeholder.svg",
    duration: 1500,
    description: "Detective Yuki investigates a series of disappearances linked to dimensional rifts appearing across the city.",
    season: 1,
  },
  {
    id: "ep-008",
    seriesId: "series-5",
    animeName: "Blade Symphony",
    episodeNumber: 1,
    title: "First Movement",
    thumbnail: "/placeholder.svg",
    duration: 1440,
    description: "In feudal Japan, a wandering ronin encounters supernatural forces that challenge everything he knows about the art of the sword.",
    season: 1,
  },
  {
    id: "ep-009",
    seriesId: "series-6",
    animeName: "Starfall Chronicle",
    episodeNumber: 1,
    title: "When Stars Fall",
    thumbnail: "/placeholder.svg",
    duration: 1380,
    description: "A celestial event brings mysterious powers to ordinary people. A group of strangers must unite to face what follows.",
    season: 1,
  },
];

export const mockEpisode: AnimeEpisode = mockEpisodes[0];

export function getNextEpisode(currentEpisodeId: string): AnimeEpisode | null {
  const current = mockEpisodes.find((ep) => ep.id === currentEpisodeId);
  if (!current) return null;
  const seriesEpisodes = mockEpisodes.filter((ep) => ep.seriesId === current.seriesId);
  const currentIndex = seriesEpisodes.findIndex((ep) => ep.id === currentEpisodeId);
  if (currentIndex === -1 || currentIndex >= seriesEpisodes.length - 1) return null;
  return seriesEpisodes[currentIndex + 1];
}

export function getEpisodeById(id: string): AnimeEpisode | null {
  return mockEpisodes.find((ep) => ep.id === id) || null;
}

export function getEpisodesBySeries(seriesId: string): AnimeEpisode[] {
  return mockEpisodes.filter((ep) => ep.seriesId === seriesId);
}

export function getSeriesById(id: string): AnimeSeries | null {
  return [...mockTrendingSeries, ...simulcastSeries].find((s) => s.id === id) || null;
}

export const mockTrendingSeries: AnimeSeries[] = [
  {
    id: "series-1",
    name: "Shadow Requiem",
    thumbnail: "/placeholder.svg",
    genre: ["Action", "Fantasy"],
    rating: 9.2,
    episodes: 24,
    status: "Airing",
    description: "A dark fantasy epic about shadows and destiny.",
  },
  {
    id: "series-2",
    name: "Neon Drift",
    thumbnail: "/placeholder.svg",
    genre: ["Sci-Fi", "Mecha"],
    rating: 8.8,
    episodes: 12,
    status: "Airing",
    description: "High-speed mecha battles in a neon-lit future.",
  },
  {
    id: "series-3",
    name: "Crimson Academy",
    thumbnail: "/placeholder.svg",
    genre: ["Action", "School"],
    rating: 8.5,
    episodes: 13,
    status: "Completed",
    description: "An elite academy hides a deadly secret.",
  },
  {
    id: "series-4",
    name: "Void Walker",
    thumbnail: "/placeholder.svg",
    genre: ["Horror", "Mystery"],
    rating: 9.0,
    episodes: 10,
    status: "Airing",
    description: "Between dimensions, something watches.",
  },
  {
    id: "series-5",
    name: "Blade Symphony",
    thumbnail: "/placeholder.svg",
    genre: ["Action", "Historical"],
    rating: 8.9,
    episodes: 26,
    status: "Completed",
    description: "Samurai era meets supernatural combat.",
  },
  {
    id: "series-6",
    name: "Starfall Chronicle",
    thumbnail: "/placeholder.svg",
    genre: ["Adventure", "Fantasy"],
    rating: 8.7,
    episodes: 24,
    status: "Upcoming",
    description: "When stars fall, heroes rise.",
  },
];

export const simulcastSeries: AnimeSeries[] = [
  {
    id: "sim-1",
    name: "Shadow Requiem",
    thumbnail: "/placeholder.svg",
    genre: ["Action", "Fantasy"],
    rating: 9.2,
    episodes: 24,
    status: "Airing",
    description: "New episode every Saturday.",
  },
  {
    id: "sim-2",
    name: "Neon Drift",
    thumbnail: "/placeholder.svg",
    genre: ["Sci-Fi", "Mecha"],
    rating: 8.8,
    episodes: 12,
    status: "Airing",
    description: "New episode every Wednesday.",
  },
  {
    id: "sim-3",
    name: "Void Walker",
    thumbnail: "/placeholder.svg",
    genre: ["Horror", "Mystery"],
    rating: 9.0,
    episodes: 10,
    status: "Airing",
    description: "New episode every Friday.",
  },
];

export const mockContinueWatching: ContinueWatchingItem[] = [
  {
    episodeId: "ep-002",
    seriesId: "series-1",
    animeName: "Shadow Requiem",
    episodeNumber: 2,
    episodeTitle: "Crimson Dawn",
    progress: 62,
    duration: 1380,
    currentTime: 856,
  },
  {
    episodeId: "ep-004",
    seriesId: "series-2",
    animeName: "Neon Drift",
    episodeNumber: 1,
    episodeTitle: "Ignition Point",
    progress: 35,
    duration: 1440,
    currentTime: 504,
  },
  {
    episodeId: "ep-007",
    seriesId: "series-4",
    animeName: "Void Walker",
    episodeNumber: 1,
    episodeTitle: "The Thin Veil",
    progress: 80,
    duration: 1500,
    currentTime: 1200,
  },
  {
    episodeId: "ep-008",
    seriesId: "series-5",
    animeName: "Blade Symphony",
    episodeNumber: 1,
    episodeTitle: "First Movement",
    progress: 15,
    duration: 1440,
    currentTime: 216,
  },
];

export const mockNewEpisodes: NewEpisodeItem[] = [
  {
    episodeId: "ep-003",
    seriesId: "series-1",
    animeName: "Shadow Requiem",
    episodeNumber: 3,
    episodeTitle: "Echoes of the Void",
    duration: 1500,
    releasedAgo: "2 hours ago",
  },
  {
    episodeId: "ep-005",
    seriesId: "series-2",
    animeName: "Neon Drift",
    episodeNumber: 2,
    episodeTitle: "Overdrive",
    duration: 1380,
    releasedAgo: "5 hours ago",
  },
  {
    episodeId: "ep-006",
    seriesId: "series-3",
    animeName: "Crimson Academy",
    episodeNumber: 1,
    episodeTitle: "Enrollment",
    duration: 1440,
    releasedAgo: "1 day ago",
  },
  {
    episodeId: "ep-009",
    seriesId: "series-6",
    animeName: "Starfall Chronicle",
    episodeNumber: 1,
    episodeTitle: "When Stars Fall",
    duration: 1380,
    releasedAgo: "2 days ago",
  },
];

export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
