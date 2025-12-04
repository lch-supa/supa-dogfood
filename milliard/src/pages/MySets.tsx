import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ExternalLink, Trash2, Plus, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useUserPoemSets, usePublishPoemSet, useUnpublishPoemSet, useDeletePoemSet } from "@/hooks/use-poem-sets";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GeneratePoemsDialog } from "@/components/GeneratePoemsDialog";

const MySets = () => {
  const { data: poemSets, isLoading } = useUserPoemSets();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const publishSet = usePublishPoemSet();
  const unpublishSet = useUnpublishPoemSet();
  const deleteSet = useDeletePoemSet();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState<string | null>(null);

  // Helper to check if user owns the set
  const isOwner = (set: any) => set.user_id === user?.id;

  const handlePublish = async (id: string, title: string) => {
    try {
      await publishSet.mutateAsync(id);
      toast({
        title: "Poem set published!",
        description: `"${title}" is now visible on the Explore page.`,
      });
    } catch (error: any) {
      toast({
        title: "Error publishing",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnpublish = async (id: string, title: string) => {
    try {
      await unpublishSet.mutateAsync(id);
      toast({
        title: "Poem set unpublished",
        description: `"${title}" is now private.`,
      });
    } catch (error: any) {
      toast({
        title: "Error unpublishing",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setSetToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!setToDelete) return;

    try {
      await deleteSet.mutateAsync(setToDelete);
      toast({
        title: "Poem set deleted",
        description: "Your poem set has been permanently deleted.",
      });
      setDeleteDialogOpen(false);
      setSetToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error deleting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="font-display text-3xl mb-4">Sign In Required</h1>
          <p className="text-muted-foreground">
            Please sign in to view and manage your poem sets.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-5xl font-medium mb-4">
            My Poem Sets
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your poem sets, publish to the community, or create new collections
          </p>
        </motion.div>

        {/* Create New Button */}
        <div className="max-w-4xl mx-auto mb-8 flex justify-center">
          <GeneratePoemsDialog />
        </div>

        {/* Sets Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your poem sets...</p>
          </div>
        ) : !poemSets || poemSets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl mb-2">No poem sets yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first poem set to get started
            </p>
            <GeneratePoemsDialog />
          </motion.div>
        ) : (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {poemSets.map((set, idx) => (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-display text-xl">
                        {set.title}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={set.status === 'published' ? "default" : "secondary"}>
                          {set.status}
                        </Badge>
                        {!isOwner(set) && (
                          <Badge variant="outline">
                            Collaborator
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>{set.theme}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Created {new Date(set.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{set.poems.length} sonnets</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 flex-wrap">
                    <Link to={`/poem-set/${set.id}`}>
                      <Button variant="outline" className="gap-2">
                        <ExternalLink className="w-4 h-4" />
                        View
                      </Button>
                    </Link>
                    {set.status === 'draft' && (
                      <Link to={`/my-sets/${set.id}/edit`}>
                        <Button variant="outline" className="gap-2">
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                      </Link>
                    )}
                    {isOwner(set) && (
                      <>
                        {set.status === 'published' ? (
                          <Button
                            variant="outline"
                            onClick={() => handleUnpublish(set.id, set.title)}
                            disabled={unpublishSet.isPending}
                            className="gap-2"
                          >
                            <EyeOff className="w-4 h-4" />
                            Unpublish
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            onClick={() => handlePublish(set.id, set.title)}
                            disabled={publishSet.isPending}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Publish
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(set.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poem Set?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this poem set
              and all saved poems created from it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MySets;
