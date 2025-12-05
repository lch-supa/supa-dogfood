import { useState, useRef } from "react";
import { Sparkles, Loader2, PenTool, Upload, FileText, Eraser, Undo } from "lucide-react";
import { useGeneratePoems, useSaveManualPoemSet, useDraftPoemSets } from "@/hooks/use-poem-sets";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GeneratePoemsDialogProps {
  onGenerated?: (poemSetId: string) => void;
}

export function GeneratePoemsDialog({ onGenerated }: GeneratePoemsDialogProps) {
  const [open, setOpen] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [description, setDescription] = useState("");

  // Manual creation state
  const [manualTitle, setManualTitle] = useState("");
  const [manualPoems, setManualPoems] = useState<string[]>(
    Array(10).fill("")
  );
  const [previousManualPoems, setPreviousManualPoems] = useState<string[] | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generatePoems = useGeneratePoems();
  const saveManualSet = useSaveManualPoemSet();
  const { data: drafts } = useDraftPoemSets();
  const { toast } = useToast();

  const handleGenerate = async () => {
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

    if (tags.length === 0) {
      toast({
        title: "Tags required",
        description: "Please enter at least one tag for your poem set.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await generatePoems.mutateAsync({
        tags,
        description: description.trim() || undefined,
      });

      toast({
        title: "Draft created!",
        description: `"${result.title}" is now displayed in the reader and saved to My Sets.`,
      });

      setOpen(false);
      setTagsInput("");
      setDescription("");

      // Load the generated poem set into the FlipReader
      if (onGenerated && result.id) {
        onGenerated(result.id);
      }
    } catch (error) {
      console.error("Error generating poems:", error);
      toast({
        title: "Error generating poems",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    // Generate default title if none provided
    const title = manualTitle.trim() || `Untitled Draft ${new Date().toLocaleDateString()}`;

    try {
      // Convert text blocks to line arrays
      const poems = manualPoems.map((text) => {
        // Split by newlines and filter out blank lines (stanza breaks)
        const contentLines = text.split('\n').filter(line => line.trim() !== '');
        return { lines: contentLines };
      });

      const result = await saveManualSet.mutateAsync({
        input: {
          title: title,
          tags: [], // Empty tags for manual sets initially
          poems: poems,
        },
        status: 'draft',
        id: currentDraftId,
      });

      toast({
        title: "Draft saved!",
        description: `"${result.title}" is now displayed in the reader and saved to My Sets.`,
      });

      setCurrentDraftId(result.id);

      // Load the saved poem set into the FlipReader
      if (onGenerated && result.id) {
        onGenerated(result.id);
      }
    } catch (error) {
      console.error("Error saving poem set:", error);
      toast({
        title: "Error saving poem set",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;

      // Simple strategy: split by 3 or more consecutive newlines (double blank line)
      // This is a clear separator that won't be confused with stanza breaks
      const sonnets = text.split(/\n\s*\n\s*\n+/).filter(s => s.trim());

      // Take the first 10 sonnets and fill remaining with empty strings
      const parsedPoems = sonnets.slice(0, 10).map(sonnet => sonnet.trim());
      while (parsedPoems.length < 10) {
        parsedPoems.push("");
      }

      setManualPoems(parsedPoems);

      const loadedCount = parsedPoems.filter(p => p.trim()).length;
      toast({
        title: "File uploaded",
        description: `Loaded ${loadedCount} sonnet${loadedCount !== 1 ? 's' : ''} from file. Sonnets should be separated by double blank lines.`,
      });
    };

    reader.readAsText(file);

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const loadDraft = (draft: any) => {
    setManualTitle(draft.title);
    setManualPoems(draft.poems.map((p: any) => p.lines.join('\n')));
    setCurrentDraftId(draft.id);

    toast({
      title: "Draft loaded",
      description: `Loaded draft "${draft.title}".`,
    });
  };

  const updatePoem = (poemIndex: number, value: string) => {
    setManualPoems(prev => {
      const updated = [...prev];
      updated[poemIndex] = value;
      return updated;
    });
  };

  const countLines = (text: string): number => {
    // Count only non-empty lines (blank lines are for stanza breaks)
    return text.split('\n').filter(line => line.trim() !== '').length;
  };

  const clearAllPoems = () => {
    setPreviousManualPoems(manualPoems);
    setManualPoems(Array(10).fill(""));
    toast({
      title: "All sonnets cleared",
      description: "All text has been removed from the sonnet boxes.",
    });
  };

  const undoClear = () => {
    if (previousManualPoems) {
      setManualPoems(previousManualPoems);
      setPreviousManualPoems(null);
      toast({
        title: "Undo successful",
        description: "Your sonnets have been restored.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-display">
          <Sparkles size={16} />
          Create New Set
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Sonnet Set</DialogTitle>
          <DialogDescription>
            Generate 10 Shakespearean sonnets with Claude or add your own set of 10.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="auto" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto">
              <Sparkles className="w-4 h-4 mr-2" />
              Robot Poems
            </TabsTrigger>
            <TabsTrigger value="manual">
              <PenTool className="w-4 h-4 mr-2" />
              Write Your Own
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="space-y-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags *</Label>
                <Input
                  id="tags"
                  placeholder="e.g., love, nature, seasons (comma-separated)"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  disabled={generatePoems.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Enter one or more tags separated by commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Additional Context (Optional)</Label>
                <Input
                  id="description"
                  placeholder="e.g., Focus on autumn imagery, melancholic tone..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={generatePoems.isPending}
                />
              </div>

              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                <strong>Note:</strong> Generation takes 30-60 seconds. Claude will create a set of 10 Shakespearean sonnets based on the tags and any additional information you provide. The final syllables of each corresponding line of each generated sonnet will possess compatible rhyme sounds.
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={generatePoems.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generatePoems.isPending || !tagsInput.trim()}
              >
                {generatePoems.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Draft
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4 pb-6">
                {/* Draft loader and file upload */}
                <div className="flex gap-2">
                  {drafts && drafts.length > 0 && (
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-within:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={(e) => {
                        if (e.target.value) {
                          const draft = drafts.find(d => d.id === e.target.value);
                          if (draft) loadDraft(draft);
                        }
                      }}
                      value={currentDraftId || ""}
                    >
                      <option value="">Load a draft...</option>
                      {drafts.map((draft) => (
                        <option key={draft.id} value={draft.id}>
                          {draft.title} - {new Date(draft.updated_at).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saveManualSet.isPending}
                    className="gap-2 shrink-0"
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearAllPoems}
                    disabled={saveManualSet.isPending}
                    className="gap-2 shrink-0"
                  >
                    <Eraser className="w-4 h-4" />
                    Clear All
                  </Button>
                  {previousManualPoems && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={undoClear}
                      disabled={saveManualSet.isPending}
                      className="gap-2 shrink-0"
                    >
                      <Undo className="w-4 h-4" />
                      Undo Clear
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-title">Title (optional)</Label>
                  <Input
                    id="manual-title"
                    placeholder="e.g., Autumn Sonnets (leave blank for auto-generated title)"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    disabled={saveManualSet.isPending}
                    className="focus-visible:ring-offset-0 focus-visible:ring-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sonnets (10 required, 14 lines each)</Label>
                  <Accordion type="single" collapsible className="w-full border rounded-md">
                    <AccordionItem value="all-sonnets">
                      <AccordionTrigger className="px-4">
                        All Sonnets
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({manualPoems.filter(p => p.trim()).length}/10 completed)
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <Accordion type="single" collapsible className="w-full space-y-1">
                          {manualPoems.map((poem, poemIndex) => {
                            const lineCount = countLines(poem);
                            const isEven = poemIndex % 2 === 0;
                            return (
                              <AccordionItem
                                key={poemIndex}
                                value={`poem-${poemIndex}`}
                                className={`
                                  group
                                  focus-within:ring-2 focus-within:ring-ring
                                  border-none rounded-lg overflow-hidden
                                  border-l-[2px] transition-all duration-300 ease-out
                                  ${isEven
                                    ? 'bg-[hsl(30_8%_96%)] dark:bg-[hsl(25_6%_16%)]'
                                    : 'bg-[hsl(30_6%_94%)] dark:bg-[hsl(25_4%_14%)]'
                                  }
                                  hover:bg-[hsl(30_10%_92%)] dark:hover:bg-[hsl(25_6%_18%)]
                                  hover:shadow-[0_2px_8px_hsl(25_6%_22%/0.04)] dark:hover:shadow-[0_2px_8px_hsl(0_0%_0%/0.2)]
                                  data-[state=open]:bg-[hsl(30_12%_94%)] dark:data-[state=open]:bg-[hsl(25_6%_18%)]
                                  data-[state=open]:border-l-[hsl(15_28%_52%)] dark:data-[state=open]:border-l-[hsl(15_32%_58%)]
                                  data-[state=open]:border-l-[3px]
                                  data-[state=open]:shadow-[0_4px_16px_hsl(25_6%_22%/0.06),inset_0_1px_0_hsl(30_12%_98%)]
                                  dark:data-[state=open]:shadow-[0_4px_16px_hsl(0_0%_0%/0.25),inset_0_1px_0_hsl(25_6%_22%/0.1)]
                                  border-l-[hsl(30_8%_88%)] dark:border-l-[hsl(25_6%_24%)]
                                `}
                              >
                                <AccordionTrigger className="px-5 py-4 hover:no-underline [&>svg]:ml-auto">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium tracking-tight">Sonnet {poemIndex + 1}</span>
                                    {poem.trim() && (
                                      <span className={`text-sm px-2 py-0.5 rounded-full ${
                                        lineCount === 14
                                          ? 'bg-[hsl(140_20%_92%)] text-[hsl(140_25%_35%)] dark:bg-[hsl(140_18%_20%)] dark:text-[hsl(140_22%_65%)]'
                                          : 'bg-muted/50 text-muted-foreground/70'
                                      }`}>
                                        {lineCount}/14
                                      </span>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-5 pb-5 pt-2">
                                  <Textarea
                                    placeholder={`A Shakespearean sonnet is composed of three quatrains followed by a single couplet.\n\nThese 14 lines follow an ABAB CDCD EFEF GG rhyme scheme.`}
                                    value={poem}
                                    onChange={(e) => updatePoem(poemIndex, e.target.value)}
                                    disabled={saveManualSet.isPending}
                                    className="min-h-[300px] font-mono text-sm bg-background/60 dark:bg-background/40 border-border/50 rounded-lg shadow-sm focus-visible:shadow-md transition-shadow"
                                    rows={14}
                                  />
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                <div className="text-sm text-muted-foreground bg-muted p-3 rounded space-y-1">
                  <p><strong>Tips:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Separate stanzas with single blank lines</li>
                    <li>When uploading a file, separate sonnets with double blank lines</li>
                    <li>Only .txt files are presently accepted</li>
                  </ul>
                </div>

                <div className="flex flex-row gap-2 justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={saveManualSet.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saveManualSet.isPending}
                  >
                    {saveManualSet.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Save Draft
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
