import { useRef, useState, useMemo } from "react";
import { Library, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/landing/Hero";
import { FlipReader } from "@/components/poems/FlipReader";
import { AboutSection } from "@/components/landing/AboutSection";
import { Footer } from "@/components/layout/Footer";
import { GeneratePoemsDialog } from "@/components/dialogs/GeneratePoemsDialog";
import { Button } from "@/components/ui/button";
import { samplePoemSet } from "@/data/samplePoems";
import { usePoemSet } from "@/hooks/use-poem-sets";

const Index = () => {
  const readerRef = useRef<HTMLDivElement>(null);
  const [currentPoemSetId, setCurrentPoemSetId] = useState<string | null>(null);

  // Fetch the selected poem set from Supabase
  const { data: selectedPoemSet } = usePoemSet(currentPoemSetId);

  // Use selected poem set or fall back to sample
  const activePoemSet = useMemo(() => {
    if (selectedPoemSet) {
      return selectedPoemSet;
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
            <Link to="/my-sets">
              <Button variant="outline" className="gap-2 font-display">
                <Library size={16} />
                My Sets
              </Button>
            </Link>
            <Link to="/explore">
              <Button variant="outline" className="gap-2 font-display">
                <Compass size={16} />
                Community Sets
              </Button>
            </Link>
          </div>

          <FlipReader poemSet={activePoemSet} poemSetId={currentPoemSetId || undefined} />
        </section>

        <AboutSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
