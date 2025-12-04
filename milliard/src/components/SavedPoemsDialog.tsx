import { motion } from "framer-motion";
import { Trash2, Calendar, Loader2 } from "lucide-react";
import { useSavedPoems, useDeletePoem } from "@/hooks/use-saved-poems";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SavedPoemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadPoem: (poemPositions: number[]) => void;
}

export function SavedPoemsDialog({
  open,
  onOpenChange,
  onLoadPoem,
}: SavedPoemsDialogProps) {
  const { data: savedPoems, isLoading } = useSavedPoems();
  const deletePoem = useDeletePoem();
  const { toast } = useToast();

  const handleDelete = async (id: string, title: string) => {
    try {
      await deletePoem.mutateAsync(id);
      toast({
        title: "Poem deleted",
        description: `"${title}" has been removed from your collection.`,
      });
    } catch (error) {
      toast({
        title: "Error deleting poem",
        description: "There was a problem deleting your poem. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Your Saved Poems</DialogTitle>
          <DialogDescription>
            Select a poem to load it into the reader.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !savedPoems || savedPoems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No saved poems yet. Create and save your first poem!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedPoems.map((poem, idx) => (
                <motion.div
                  key={poem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative bg-card border rounded-lg p-4 hover:border-gold/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <button
                      onClick={() => {
                        const poemPositions = poem.lines?.map(line => line.poem_position) || [];
                        onLoadPoem(poemPositions);
                      }}
                      className="flex-1 text-left"
                    >
                      <h3 className="font-display text-lg mb-1 group-hover:text-gold transition-colors">
                        {poem.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(poem.created_at)}</span>
                        {poem.lines && poem.lines.length > 0 && (
                          <>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{poem.lines.length} lines</span>
                          </>
                        )}
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(poem.id, poem.title);
                      }}
                      disabled={deletePoem.isPending}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
