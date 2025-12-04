import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Check } from "lucide-react";
import { usePoemSets, useUserPoemSets } from "@/hooks/use-poem-sets";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface PoemSetSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSetId?: string;
  onSelectSet: (setId: string) => void;
}

export function PoemSetSelector({
  open,
  onOpenChange,
  currentSetId,
  onSelectSet,
}: PoemSetSelectorProps) {
  const { data: publicSets, isLoading: publicLoading } = usePoemSets();
  const { data: userSets, isLoading: userLoading } = useUserPoemSets();
  const { user } = useAuth();

  const isLoading = publicLoading || userLoading;

  // Combine and deduplicate sets
  const allSets = useMemo(() => {
    const combined = [...(userSets || []), ...(publicSets || [])];
    const unique = combined.filter((set, index, self) =>
      index === self.findIndex((s) => s.id === set.id)
    );
    return unique.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [userSets, publicSets]);

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
          <DialogTitle>Choose a Poem Set</DialogTitle>
          <DialogDescription>
            Select a collection of sonnets to mix and match.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !allSets || allSets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No poem sets available yet. Generate your first set!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allSets.map((set, idx) => (
                <motion.div
                  key={set.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Button
                    variant={currentSetId === set.id ? "default" : "outline"}
                    className="w-full h-auto p-4 justify-start relative"
                    onClick={() => {
                      onSelectSet(set.id);
                      onOpenChange(false);
                    }}
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-lg">{set.title}</h3>
                        {currentSetId === set.id && (
                          <Check className="w-4 h-4" />
                        )}
                        {set.user_id === user?.id && set.status === 'draft' && (
                          <Badge variant="secondary" className="text-xs">Draft</Badge>
                        )}
                        {set.user_id === user?.id && set.status === 'published' && (
                          <Badge variant="outline" className="text-xs">Yours</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Theme: {set.theme}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(set.created_at)}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{set.poems.length} sonnets</span>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
