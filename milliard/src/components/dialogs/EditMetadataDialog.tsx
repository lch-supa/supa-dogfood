import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";

interface EditMetadataDialogProps {
  currentTitle: string;
  currentTags: string;
  onSave: (title: string, tags: string) => void;
}

export function EditMetadataDialog({ currentTitle, currentTags, onSave }: EditMetadataDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [tagsInput, setTagsInput] = useState(currentTags);

  // Update local state when props change
  useEffect(() => {
    setTitle(currentTitle);
    setTagsInput(currentTags);
  }, [currentTitle, currentTags, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(title, tagsInput);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          Edit Poem Metadata
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Poem Metadata</DialogTitle>
          <DialogDescription>
            Update the title and tags for this poem set.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="metadata-title">Title</Label>
            <Input
              id="metadata-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter poem set title"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="metadata-tags">Tags</Label>
            <Input
              id="metadata-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., love, nature, seasons (comma-separated)"
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter one or more tags separated by commas
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
