import { BookOpen, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border/50">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gold" />
            <span className="font-display text-sm text-muted-foreground">
              Sonnet-Machine
            </span>
          </div>

          <p className="text-sm text-muted-foreground/70 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-burgundy" /> by Liam Cloud Hogan
          </p>

          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
