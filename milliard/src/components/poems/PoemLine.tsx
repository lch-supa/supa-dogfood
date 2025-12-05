import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface PoemLineProps {
  lineNumber: number;
  content: string;
  poemIndex: number;
  totalPoems: number;
  onFlipUp: () => void;
  onFlipDown: () => void;
}

export function PoemLine({
  lineNumber,
  content,
  poemIndex,
  totalPoems,
  onFlipUp,
  onFlipDown,
}: PoemLineProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<"left" | "right" | null>(null);
  const [flipDirection, setFlipDirection] = useState<"left" | "right" | null>(null);

  const handleFlipLeft = () => {
    if (poemIndex === 0) return;
    setFlipDirection("left");
    onFlipUp();
    setTimeout(() => setFlipDirection(null), 300);
  };

  const handleFlipRight = () => {
    if (poemIndex === totalPoems - 1) return;
    setFlipDirection("right");
    onFlipDown();
    setTimeout(() => setFlipDirection(null), 300);
  };

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoveredZone(null);
      }}
    >
      {/* Line number indicator */}
      <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
        <span className="text-xs font-display text-muted-foreground w-4 text-right">
          {lineNumber}
        </span>
        <span className="text-[10px] text-primary font-medium">
          [{poemIndex + 1}]
        </span>
      </div>

      {/* Main line container with clickable zones */}
      <div className="relative">
        {/* Left clickable zone - flip to previous */}
        <button
          onClick={handleFlipLeft}
          onMouseEnter={() => setHoveredZone("left")}
          onMouseLeave={() => setHoveredZone(null)}
          disabled={poemIndex === 0}
          className={`absolute inset-y-0 left-0 w-1/2 z-10 cursor-pointer disabled:cursor-not-allowed transition-all duration-200 ${
            isHovered && hoveredZone === "left" && poemIndex > 0
              ? "bg-gradient-to-r from-primary/20 to-transparent"
              : ""
          }`}
          aria-label="Previous poem's line"
        />

        {/* Right clickable zone - flip to next */}
        <button
          onClick={handleFlipRight}
          onMouseEnter={() => setHoveredZone("right")}
          onMouseLeave={() => setHoveredZone(null)}
          disabled={poemIndex === totalPoems - 1}
          className={`absolute inset-y-0 right-0 w-1/2 z-10 cursor-pointer disabled:cursor-not-allowed transition-all duration-200 ${
            isHovered && hoveredZone === "right" && poemIndex < totalPoems - 1
              ? "bg-gradient-to-l from-primary/20 to-transparent"
              : ""
          }`}
          aria-label="Next poem's line"
        />

        {/* Animated line content */}
        <div className="relative overflow-hidden perspective-1000 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${poemIndex}-${content}`}
              initial={{
                rotateY: flipDirection === "left" ? -90 : flipDirection === "right" ? 90 : 0,
                opacity: 0,
              }}
              animate={{
                rotateY: 0,
                opacity: 1,
                transition: {
                  rotateY: { duration: 0.4, ease: "easeOut" },
                  opacity: { duration: 0.5, ease: "easeInOut", delay: 0.1 }
                }
              }}
              exit={{
                rotateY: flipDirection === "left" ? 90 : -90,
                opacity: 0,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`px-4 py-3 bg-background/40 border-b border-border/30 shadow-sm origin-center transition-all ${
                isHovered ? "border-primary/40 bg-background/60" : ""
              }`}
              style={{ transformStyle: "preserve-3d" }}
            >
              <p className="text-xl md:text-2xl font-garamond text-foreground leading-relaxed text-center" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                {content}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Visual indicators - arrows on left and right */}
      <AnimatePresence>
        {isHovered && (
          <>
            {/* Left arrow indicator */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute -left-8 top-1/2 -translate-y-1/2"
            >
              <div
                className={`transition-opacity ${
                  hoveredZone === "left" && poemIndex > 0 ? "opacity-100" : "opacity-30"
                }`}
              >
                <ChevronLeft
                  size={24}
                  className={poemIndex === 0 ? "text-muted-foreground/30" : "text-primary"}
                />
              </div>
            </motion.div>

            {/* Right arrow indicator */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute -right-8 top-1/2 -translate-y-1/2"
            >
              <div
                className={`transition-opacity ${
                  hoveredZone === "right" && poemIndex < totalPoems - 1
                    ? "opacity-100"
                    : "opacity-30"
                }`}
              >
                <ChevronRight
                  size={24}
                  className={
                    poemIndex === totalPoems - 1 ? "text-muted-foreground/30" : "text-primary"
                  }
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
