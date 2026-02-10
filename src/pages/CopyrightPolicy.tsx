import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function CopyrightPolicy() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-lg text-sm font-medium text-muted-foreground border border-border hover:text-primary hover:border-primary/40 hover:shadow-[0_0_12px_hsl(var(--primary)/0.35)] transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Main card */}
        <div className="glass-card-strong rounded-2xl p-6 sm:p-10 space-y-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold">
            <span className="text-primary">Copyright</span>{" "}
            <span className="text-foreground">Policy</span>
          </h1>

          {/* 1 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">1. General Statement</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ohayou Anime is a non-profit, community-driven fansub platform created for anime enthusiasts. We do not host any video files on our own servers; all content is provided by non-affiliated third parties. Our mission is to promote Japanese culture and language through high-quality translations for educational and community purposes.
            </p>
          </section>

          {/* 2 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">2. Intellectual Property Rights</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We acknowledge and respect the intellectual property rights of the original creators, production studios (including but not limited to Aniplex, Toei Animation, MAPPA, Ufotable), and official distributors.
            </p>
            <ul className="list-disc list-inside text-sm leading-relaxed text-muted-foreground space-y-1.5 pl-1">
              <li>All anime titles, characters, images, and logos are the exclusive property of their respective owners.</li>
              <li>Ohayou Anime does not claim ownership over any of the media streamed via the platform.</li>
            </ul>
          </section>

          {/* 3 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">3. Non-Profit Fansubbing (Fair Use)</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This web application is a personal project intended for fair use under the following principles:
            </p>
            <ul className="list-disc list-inside text-sm leading-relaxed text-muted-foreground space-y-1.5 pl-1">
              <li><strong className="text-foreground">Educational:</strong> To assist users in Japanese language learning (JLPT N5–N1).</li>
              <li><strong className="text-foreground">Non-Commercial:</strong> No fees are charged for access to content.</li>
              <li><strong className="text-foreground">Transformative:</strong> The addition of fansubs (subtitles) is a transformative community effort.</li>
            </ul>
          </section>

          {/* 4 */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">4. DMCA &amp; Takedown Requests</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              If you are the copyright owner (or an authorized agent) and believe that any content linked through this platform infringes upon your copyrights, we are ready to cooperate. To request a link removal, please contact us with the following:
            </p>
            <ul className="list-disc list-inside text-sm leading-relaxed text-muted-foreground space-y-1.5 pl-1">
              <li>Identification of the copyrighted work.</li>
              <li>The specific URL(s) on Ohayou Anime where the material is located.</li>
              <li>Your contact information (Email or Physical Address).</li>
              <li>A statement of "good faith belief" that the use is not authorized.</li>
            </ul>
            <p className="text-sm text-muted-foreground pt-2">
              <strong className="text-foreground">Contact Email:</strong>{" "}
              <a href="mailto:tsukimapodcast@gmail.com" className="text-primary hover:underline">tsukimapodcast@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
