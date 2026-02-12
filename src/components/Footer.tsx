import { Link } from "react-router-dom";
import { Facebook, Send, Mail } from "lucide-react";
import logoImg from "@/assets/logo.png";

export default function Footer() {
  return (
    <footer className="relative mt-16 mb-16 sm:mb-0">
      {/* Red top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-primary/60" />
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

      <div className="glass-card-strong border-t border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Branding */}
            <div className="space-y-3">
              <Link to="/" className="flex items-center gap-2">
                <img src={logoImg} alt="Ohayou Anime" className="w-8 h-8 rounded-md object-cover" />
                <span className="font-display text-lg font-bold">
                  <span className="text-primary">Ohayou</span>{" "}
                  <span className="text-foreground">Anime</span>
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your favorite community-driven fansub platform.
              </p>
            </div>

            {/* Navigation */}
            <div className="space-y-3">
              <h4 className="font-display text-sm font-semibold text-foreground">Navigation</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
                <li><Link to="/shorts" className="text-sm text-muted-foreground hover:text-primary transition-colors">Shorts</Link></li>
              </ul>
            </div>

            {/* Support / Legal */}
            <div className="space-y-3">
              <h4 className="font-display text-sm font-semibold text-foreground">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/copyright-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Copyright Policy</Link></li>
                <li><a href="mailto:tsukimapodcast@gmail.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Socials */}
            <div className="space-y-3">
              <h4 className="font-display text-sm font-semibold text-foreground">Follow Us</h4>
              <div className="flex items-center gap-3">
                <a href="https://www.facebook.com/share/18LB36h4SR/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" aria-label="Facebook">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://t.me/OhayouAM" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" aria-label="Telegram">
                  <Send className="w-5 h-5" />
                </a>
                <a href="mailto:tsukimapodcast@gmail.com" className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" aria-label="Contact Email">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              © 2026 Ohayou Anime. This site is a non-profit fansub project. All anime content, characters, and logos are the property of their respective owners and production studios. Ohayou Anime does not claim ownership of the media streamed on this platform.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
