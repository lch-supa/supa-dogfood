import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { FlipReader } from "@/components/poems/FlipReader";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PreviewPoemSetDialogProps {
  title: string;
  tags: string;
  sonnets: string[];
}

export function PreviewPoemSetDialog({ title, tags, sonnets }: PreviewPoemSetDialogProps) {
  const [open, setOpen] = useState(false);

  // Transform sonnets into the format FlipReader expects
  const poemSet = {
    title: title || "Untitled Poem Set",
    tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
    poems: sonnets.map(sonnet => ({
      lines: sonnet.split('\n').filter(line => line.trim())
    }))
  };

  // Check if we have enough valid data to preview
  const hasValidPoems = poemSet.poems.length > 0 && poemSet.poems.some(p => p.lines.length === 14);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Eye className="w-4 h-4" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Preview Poem Set</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-80px)] px-6 pb-6">
          {hasValidPoems ? (
            <FlipReader poemSet={poemSet} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No valid poems to preview</p>
              <p className="text-sm">
                Add at least one complete sonnet (14 lines) to see a preview.
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
