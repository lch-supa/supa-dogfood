import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Shuffle, RotateCcw } from "lucide-react";
import { PoemLine } from "./PoemLine";
import { Button } from "@/components/ui/button";
import { PoemSet } from "@/data/samplePoems";

interface FlipReaderProps {
  poemSet: PoemSet;
  poemSetId?: string;
}

export function FlipReader({ poemSet, poemSetId }: FlipReaderProps) {
  const totalPoems = poemSet.poems.length;
  const totalLines = 14;

  // Track which poem each line comes from
  const [lineSelections, setLineSelections] = useState<number[]>(
    Array(totalLines).fill(0)
  );

  const currentLines = useMemo(() => {
    return lineSelections.map((poemIdx, lineIdx) => ({
      content: poemSet.poems[poemIdx].lines[lineIdx],
      poemIndex: poemIdx,
    }));
  }, [lineSelections, poemSet]);

  const handleFlipUp = (lineIndex: number) => {
    setLineSelections((prev) => {
      const newSelections = [...prev];
      if (newSelections[lineIndex] > 0) {
        newSelections[lineIndex]--;
      }
      return newSelections;
    });
  };

  const handleFlipDown = (lineIndex: number) => {
    setLineSelections((prev) => {
      const newSelections = [...prev];
      if (newSelections[lineIndex] < totalPoems - 1) {
        newSelections[lineIndex]++;
      }
      return newSelections;
    });
  };

  const handleRandomize = () => {
    setLineSelections(
      Array(totalLines)
        .fill(0)
        .map(() => Math.floor(Math.random() * totalPoems))
    );
  };

  const handleReset = () => {
    setLineSelections(Array(totalLines).fill(0));
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="font-display text-xl text-muted-foreground">
            {poemSet.title}
          </h2>
        </div>
      </motion.div>

      {/* Main poem display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative glass border border-border/50 rounded-lg p-8 md:p-12 shadow-xl"
      >
        {/* Decorative corner */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/40" />
        <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary/40" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary/40" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/40" />

        {/* Poem lines */}
        <div className="space-y-1 pl-12 pr-10">
          {currentLines.map((line, idx) => (
            <div key={idx}>
              <PoemLine
                lineNumber={idx + 1}
                content={line.content}
                poemIndex={line.poemIndex}
                totalPoems={totalPoems}
                onFlipUp={() => handleFlipUp(idx)}
                onFlipDown={() => handleFlipDown(idx)}
              />
              {/* Stanza breaks */}
              {(idx === 3 || idx === 7 || idx === 11) && (
                <div className="h-4" />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex flex-col items-center gap-4"
      >
        <div className="flex gap-3 flex-wrap justify-center">
          <Button
            variant="outline"
            onClick={handleRandomize}
            className="gap-2 font-display"
          >
            <Shuffle size={16} />
            Randomize
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2 font-display"
          >
            <RotateCcw size={16} />
            Reset
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
