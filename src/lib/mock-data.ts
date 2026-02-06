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
  animeName: string;
  episodeNumber: number;
  title: string;
  thumbnail: string;
  duration: number; // total duration in seconds
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

export const mockEpisode: AnimeEpisode = {
  id: "ep-001",
  animeName: "Shadow Requiem",
  episodeNumber: 1,
  title: "The World Beneath",
  thumbnail: "/placeholder.svg",
  duration: 1440, // 24 minutes
  description: "In a world where shadows hold ancient power, Kaito discovers he is the last heir to a forgotten bloodline. When darkness threatens to consume the city, he must choose between hiding and becoming what he was destined to be.",
  season: 1,
};

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

export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
