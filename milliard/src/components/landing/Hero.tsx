import { motion } from "framer-motion";
import { BookOpen, Sparkles, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onExplore: () => void;
}

export function Hero({ onExplore }: HeroProps) {
  return (
    <section className="pt-12 md:pt-20 pb-2 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.03 }}
          transition={{ duration: 2 }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.02 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-burgundy blur-3xl"
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-3xl mx-auto relative z-10"
      >
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="font-display text-4xl md:text-6xl lg:text-7xl font-medium text-foreground mb-4 leading-tight"
        >
        Sonnet-Machine
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="font-display text-lg md:text-xl text-muted-foreground mb-2 italic"
        >
         After <a href="https://en.wikipedia.org/wiki/A_Hundred_Thousand_Billion_Poems" target="_blank"> A Hundred Thousand Billion Poems </a>
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-base md:text-lg text-muted-foreground/80 mb-2 max-w-xl mx-auto leading-relaxed"
        >
          Cent Mille Milliards de Poèmes was composed in 1961 by Raymond Queneau, a co-founder of the <a href="https://en.wikipedia.org/wiki/Oulipo" target="_blank">OuLiPo</a>. 
        </motion.p>
      </motion.div>
    </section>
  );
}