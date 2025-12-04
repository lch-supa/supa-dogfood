import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Trash2, Eye, EyeOff, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlipReader } from "@/components/FlipReader";
import { usePoemSet, usePublishPoemSet, useUnpublishPoemSet, useDeletePoemSet } from "@/hooks/use-poem-sets";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const PoemSetView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: poemSet, isLoading } = usePoemSet(id || null);
  const { user } = useAuth();
  const { toast } = useToast();
  const publishSet = usePublishPoemSet();
  const unpublishSet = useUnpublishPoemSet();
  const deleteSet = useDeletePoemSet();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = poemSet?.user_id === user?.id;
  const shareUrl = `${window.location.origin}/poem-set/${id}`;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link to let others explore this poem set.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually from your browser.",
        variant: "destructive",
      });
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    try {
      await publishSet.mutateAsync(id);
      toast({
        title: "Poem set published!",
        description: "Your poem set is now public and shareable.",
      });
    } catch (error: any) {
      toast({
        title: "Error publishing",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnpublish = async () => {
    if (!id) return;
    try {
      await unpublishSet.mutateAsync(id);
      toast({
        title: "Poem set unpublished",
        description: "Your poem set is now private.",
      });
    } catch (error: any) {
      toast({
        title: "Error unpublishing",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteSet.mutateAsync(id);
      toast({
        title: "Poem set deleted",
        description: "Your poem set has been permanently deleted.",
      });
      navigate("/explore");
    } catch (error: any) {
      toast({
        title: "Error deleting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <p className="text-muted-foreground">Loading poem set...</p>
        </div>
      </div>
    );
  }

  if (!poemSet) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="font-display text-3xl mb-4">Poem Set Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This poem set doesn't exist or is no longer available.
          </p>
          <Link to="/explore">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Explore
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Navigation & Actions */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link to="/explore">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft size={16} />
                Back to Explore
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              {poemSet.status === 'published' && (
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="gap-2"
                >
                  {copied ? <Check size={16} /> : <Share2 size={16} />}
                  {copied ? "Copied!" : "Share"}
                </Button>
              )}

              {isOwner && (
                <>
                  {poemSet.status === 'published' ? (
                    <Button
                      variant="outline"
                      onClick={handleUnpublish}
                      disabled={unpublishSet.isPending}
                      className="gap-2"
                    >
                      <EyeOff size={16} />
                      Unpublish
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handlePublish}
                      disabled={publishSet.isPending}
                      className="gap-2"
                    >
                      <Eye size={16} />
                      Publish
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Metadata */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="font-display text-3xl font-medium">
                {poemSet.title}
              </h1>
              {isOwner && (
                <Badge variant={poemSet.status === 'published' ? "default" : "secondary"}>
                  {poemSet.status}
                </Badge>
              )}
            </div>
            <p className="text-lg text-muted-foreground">{poemSet.theme}</p>
            <p className="text-sm text-muted-foreground/60 mt-2">
              Created {new Date(poemSet.created_at).toLocaleDateString()}
            </p>
          </motion.div>
        </div>

        {/* FlipReader */}
        <FlipReader
          poemSet={{
            title: poemSet.title,
            theme: poemSet.theme,
            poems: poemSet.poems,
          }}
          poemSetId={poemSet.id}
        />
      </main>

      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poem Set?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{poemSet.title}"
              and all saved poems created from it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

export default PoemSetView;
