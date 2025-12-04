import { useRef, useState, useMemo } from "react";
import { Library, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FlipReader } from "@/components/FlipReader";
import { AboutSection } from "@/components/AboutSection";
import { Footer } from "@/components/Footer";
import { GeneratePoemsDialog } from "@/components/GeneratePoemsDialog";
import { PoemSetSelector } from "@/components/PoemSetSelector";
import { Button } from "@/components/ui/button";
import { samplePoemSet } from "@/data/samplePoems";
import { usePoemSet } from "@/hooks/use-poem-sets";

const Index = () => {
  const readerRef = useRef<HTMLDivElement>(null);
  const [currentPoemSetId, setCurrentPoemSetId] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  // Fetch the selected poem set from Supabase
  const { data: selectedPoemSet } = usePoemSet(currentPoemSetId);

  // Use selected poem set or fall back to sample
  const activePoemSet = useMemo(() => {
    if (selectedPoemSet) {
      return {
        title: selectedPoemSet.title,
        theme: selectedPoemSet.theme,
        poems: selectedPoemSet.poems,
      };
    }
    return samplePoemSet;
  }, [selectedPoemSet]);

  const scrollToReader = () => {
    readerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePoemGenerated = (setId: string) => {
    setCurrentPoemSetId(setId);
    scrollToReader();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <Hero onExplore={scrollToReader} />

        <section
          id="reader"
          ref={readerRef}
          className="pt-2 pb-4 px-4"
        >
          {/* Poem Set Controls */}
          <div className="max-w-4xl mx-auto mb-8 flex flex-wrap gap-3 justify-center">
            <GeneratePoemsDialog onGenerated={handlePoemGenerated} />
            <Button
              variant="outline"
              className="gap-2 font-display"
              onClick={() => setSelectorOpen(true)}
            >
              <Library size={16} />
              Browse Sets
            </Button>
            <Link to="/explore">
              <Button variant="outline" className="gap-2 font-display">
                <Compass size={16} />
                Explore Community
              </Button>
            </Link>
          </div>

          <FlipReader poemSet={activePoemSet} poemSetId={currentPoemSetId || undefined} />
        </section>

        <AboutSection />
      </main>

      <Footer />

      {/* Poem Set Selector Dialog */}
      <PoemSetSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        currentSetId={currentPoemSetId || undefined}
        onSelectSet={setCurrentPoemSetId}
      />
    </div>
  );
};

export default Index;
