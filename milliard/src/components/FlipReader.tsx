import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Shuffle, RotateCcw, Share2, BookOpen, Save, Library } from "lucide-react";
import { PoemLine } from "./PoemLine";
import { Button } from "./ui/button";
import { PoemSet } from "@/data/samplePoems";
import { useSavePoem } from "@/hooks/use-saved-poems";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SavedPoemsDialog } from "./SavedPoemsDialog";

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

  // Dialog states
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [poemTitle, setPoemTitle] = useState("");

  // Hooks
  const savePoem = useSavePoem();
  const { toast } = useToast();

  const currentLines = useMemo(() => {
    return lineSelections.map((poemIdx, lineIdx) => ({
      content: poemSet.poems[poemIdx].lines[lineIdx],
      poemIndex: poemIdx,
    }));
  }, [lineSelections, poemSet]);

  // Calculate combination number (base 10 representation of the selection)
  const combinationNumber = useMemo(() => {
    return lineSelections.reduce((acc, val, idx) => {
      return acc + BigInt(val) * BigInt(totalPoems) ** BigInt(totalLines - 1 - idx);
    }, BigInt(0));
  }, [lineSelections, totalPoems]);

  const totalCombinations = BigInt(totalPoems) ** BigInt(totalLines);

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

  const handleSave = async () => {
    if (!poemTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your poem.",
        variant: "destructive",
      });
      return;
    }

    if (!poemSetId) {
      toast({
        title: "Error",
        description: "Cannot save poem: no poem set selected. Please generate or select a poem set first.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Build the lines array with actual text and metadata
      const lines = currentLines.map((line, idx) => ({
        line_number: idx + 1,
        line_text: line.content,
        poem_position: line.poemIndex,
      }));

      await savePoem.mutateAsync({
        title: poemTitle,
        poem_set_id: poemSetId,
        lines,
      });

      toast({
        title: "Poem saved!",
        description: `"${poemTitle}" has been saved to your collection.`,
      });

      setSaveDialogOpen(false);
      setPoemTitle("");
    } catch (error: any) {
      toast({
        title: "Error saving poem",
        description: error.message || "There was a problem saving your poem. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLoadPoem = (selections: number[]) => {
    setLineSelections(selections);
    setLoadDialogOpen(false);
    toast({
      title: "Poem loaded!",
      description: "Your saved poem has been loaded.",
    });
  };

  const formatBigNumber = (num: bigint): string => {
    const str = num.toString();
    if (str.length <= 12) return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${str.slice(0, 3)}...${str.slice(-3)} (${str.length} digits)`;
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
          <Button
            variant="outline"
            onClick={() => setSaveDialogOpen(true)}
            className="gap-2 font-display"
          >
            <Save size={16} />
            Save
          </Button>
          <Button
            variant="outline"
            onClick={() => setLoadDialogOpen(true)}
            className="gap-2 font-display"
          >
            <Library size={16} />
            Load
          </Button>
        </div>

        {/* Combination counter */}
        <div className="text-center">
          <p className="text-md text-muted-foreground mb-1">
            Current Combination
          </p>
          <p className="font-display text-lg text-primary">
            #{(combinationNumber + BigInt(1)).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            of {formatBigNumber(totalCombinations)} possible poems
          </p>
        </div>
      </motion.div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Your Poem</DialogTitle>
            <DialogDescription>
              Give your unique poem combination a title to save it for later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter poem title..."
              value={poemTitle}
              onChange={(e) => setPoemTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={savePoem.isPending}>
              {savePoem.isPending ? "Saving..." : "Save Poem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <SavedPoemsDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        onLoadPoem={handleLoadPoem}
      />
    </div>
  );
}
