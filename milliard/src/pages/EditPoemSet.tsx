import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Users, Lock, Check, AlertTriangle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { InviteCollaboratorDialog } from "@/components/InviteCollaboratorDialog";
import { PoemSetChat } from "@/components/PoemSetChat";
import { usePoemSet, useUpdatePoemSet } from "@/hooks/use-poem-sets";
import { useCollaborators } from "@/hooks/use-collaborators";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

interface SonnetLock {
  sonnet_index: number;
  user_id: string;
  user_name: string;
  locked_at: number;
}

interface PresenceState {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  editing_sonnet: number | null;
  online_at: number;
}

const EditPoemSet = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const { data: poemSet, isLoading } = usePoemSet(id || null);
  const { data: collaborators } = useCollaborators(id || null);
  const updatePoemSet = useUpdatePoemSet();

  // Local state
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [sonnets, setSonnets] = useState<string[]>(Array(10).fill(""));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Real-time collaboration state
  const [activeCollaborators, setActiveCollaborators] = useState<PresenceState[]>([]);
  const [sonnetLocks, setSonnetLocks] = useState<SonnetLock[]>([]);
  const currentEditingSonnetRef = useRef<number | null>(null);
  const channelRef = useRef<any>(null);
  const scrollPositionRef = useRef<number>(0);

  // Load poem set data
  useEffect(() => {
    if (poemSet) {
      setTitle(poemSet.title);
      setTheme(poemSet.theme);
      setSonnets(poemSet.poems.map(p => p.lines.join('\n')));
    }
  }, [poemSet]);

  // Handle remote updates from other users
  const handleRemoteUpdate = useCallback((updatedPoemSet: any) => {
    // Always update title and theme (metadata conflicts are rare)
    setTitle(updatedPoemSet.title);
    setTheme(updatedPoemSet.theme);

    // For sonnets, only update ones that aren't currently being edited
    setSonnets(prev => {
      const newSonnets = [...prev];
      updatedPoemSet.poems.forEach((poem: any, idx: number) => {
        const remoteSonnet = poem.lines.join('\n');

        // Only update if:
        // 1. This sonnet isn't being edited by current user
        // 2. The content is different
        if (currentEditingSonnetRef.current !== idx && prev[idx] !== remoteSonnet) {
          newSonnets[idx] = remoteSonnet;
        }
      });
      return newSonnets;
    });

    setLastSavedAt(new Date(updatedPoemSet.updated_at));
  }, []);

  // Preserve scroll position on presence updates
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position after presence updates
  useEffect(() => {
    // Only restore if we have a saved position and we're not actively editing
    if (scrollPositionRef.current > 0 && currentEditingSonnetRef.current === null) {
      const timeoutId = setTimeout(() => {
        window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [activeCollaborators, sonnetLocks]);

  // Set up real-time collaboration
  useEffect(() => {
    if (!id || !user || !poemSet?.allow_collaboration) return;

    const channel = supabase.channel(`poem-set:${id}`, {
      config: {
        presence: { key: user.id },
        broadcast: { self: true }
      }
    });

    // Track presence (who's online)
    channel
      .on('presence', { event: 'sync' }, () => {
        // Save scroll position before update
        const currentScroll = window.scrollY;

        const state = channel.presenceState();
        const presences = Object.values(state).flat() as PresenceState[];
        setActiveCollaborators(presences);

        // Restore scroll position immediately
        requestAnimationFrame(() => {
          window.scrollTo({ top: currentScroll, behavior: 'instant' });
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const presence = leftPresences[0] as PresenceState;
        // Remove locks from users who left
        setSonnetLocks(prev => prev.filter(lock => lock.user_id !== presence.user_id));
      })

      // Handle broadcasts (locks)
      .on('broadcast', { event: 'lock_sonnet' }, ({ payload }) => {
        setSonnetLocks(prev => {
          // Remove any existing lock for this sonnet
          const filtered = prev.filter(l => l.sonnet_index !== payload.sonnet_index);
          return [...filtered, payload as SonnetLock];
        });
      })
      .on('broadcast', { event: 'unlock_sonnet' }, ({ payload }) => {
        setSonnetLocks(prev =>
          prev.filter(l => !(l.sonnet_index === payload.sonnet_index && l.user_id === payload.user_id))
        );
      })

      // Subscribe to database changes
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'poem_sets',
          filter: `id=eq.${id}`
        },
        (payload) => {
          // Apply remote changes (smart merge only updates unlocked sonnets)
          handleRemoteUpdate(payload.new);
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user's presence
          await channel.track({
            user_id: user.id,
            user_name: user.user_metadata?.display_name || user.email || 'Anonymous',
            user_avatar: user.user_metadata?.avatar_url,
            editing_sonnet: null,
            online_at: Date.now()
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [id, user, poemSet?.allow_collaboration, handleRemoteUpdate]);

  // Track which sonnet is being edited
  const handleSonnetFocus = (index: number) => {
    currentEditingSonnetRef.current = index;

    if (channelRef.current && user) {
      // Update presence
      channelRef.current.track({
        user_id: user.id,
        user_name: user.user_metadata?.display_name || user.email || 'Anonymous',
        user_avatar: user.user_metadata?.avatar_url,
        editing_sonnet: index,
        online_at: Date.now()
      });

      // Broadcast lock
      channelRef.current.send({
        type: 'broadcast',
        event: 'lock_sonnet',
        payload: {
          sonnet_index: index,
          user_id: user.id,
          user_name: user.user_metadata?.display_name || user.email || 'Anonymous',
          locked_at: Date.now()
        }
      });
    }
  };

  const handleSonnetBlur = (index: number) => {
    currentEditingSonnetRef.current = null;

    if (channelRef.current && user) {
      // Update presence
      channelRef.current.track({
        user_id: user.id,
        user_name: user.user_metadata?.display_name || user.email || 'Anonymous',
        user_avatar: user.user_metadata?.avatar_url,
        editing_sonnet: null,
        online_at: Date.now()
      });

      // Broadcast unlock
      channelRef.current.send({
        type: 'broadcast',
        event: 'unlock_sonnet',
        payload: {
          sonnet_index: index,
          user_id: user.id
        }
      });
    }
  };

  // Check if a sonnet is locked by someone else
  const isSonnetLocked = (index: number): boolean => {
    if (!user) return false;
    const lock = sonnetLocks.find(l => l.sonnet_index === index);
    return lock !== undefined && lock.user_id !== user.id;
  };

  const getSonnetLockOwner = (index: number): SonnetLock | undefined => {
    return sonnetLocks.find(l => l.sonnet_index === index && l.user_id !== user?.id);
  };

  // Get all users editing a specific sonnet
  const getUsersEditingSonnet = (index: number): PresenceState[] => {
    return activeCollaborators.filter(collab => collab.editing_sonnet === index);
  };

  // Count lines in a sonnet
  const countLines = (text: string): number => {
    return text.split('\n').filter(line => line.trim()).length;
  };

  // Handle sonnet change
  const handleSonnetChange = (index: number, value: string) => {
    setSonnets(prev => {
      const newSonnets = [...prev];
      newSonnets[index] = value;
      return newSonnets;
    });
    setHasUnsavedChanges(true);
  };

  // Auto-save with debouncing (3 seconds after last change)
  useEffect(() => {
    if (!hasUnsavedChanges || !id) return;

    const autoSaveTimer = setTimeout(async () => {
      // Silently save without validation for auto-saves
      try {
        const poemsData = sonnets.map(sonnet => ({
          lines: sonnet.split('\n').filter(line => line.trim())
        }));

        await updatePoemSet.mutateAsync({
          id,
          title,
          theme,
          poems: poemsData
        });

        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
      } catch (error) {
        // Silent auto-save failure - user can still manually save
        console.error('Auto-save failed:', error);
      }
    }, 3000); // 3 second debounce

    return () => clearTimeout(autoSaveTimer);
  }, [title, theme, sonnets, hasUnsavedChanges, id, updatePoemSet]);

  // Validate all sonnets
  const validateSonnets = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    sonnets.forEach((sonnet, idx) => {
      const lineCount = countLines(sonnet);
      if (lineCount === 0) {
        errors.push(`Sonnet ${idx + 1} is empty`);
      } else if (lineCount !== 14) {
        errors.push(`Sonnet ${idx + 1} has ${lineCount} lines (needs 14)`);
      }
    });

    return { valid: errors.length === 0, errors };
  };

  // Save changes
  const handleSave = async () => {
    if (!id) return;

    const validation = validateSonnets();
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.errors[0],
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const poemsData = sonnets.map(sonnet => ({
        lines: sonnet.split('\n').filter(line => line.trim())
      }));

      await updatePoemSet.mutateAsync({
        id,
        title,
        theme,
        poems: poemsData
      });

      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      toast({
        title: "Saved successfully",
        description: "Your changes have been saved",
      });
    } catch (error: any) {
      toast({
        title: "Error saving",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle navigation away with unsaved changes
  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate('/my-sets');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="font-display text-3xl mb-4">Sign In Required</h1>
          <p className="text-muted-foreground">
            Please sign in to edit poem sets.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <p className="text-muted-foreground">Loading poem set...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!poemSet) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="font-display text-3xl mb-4">Poem Set Not Found</h1>
          <Link to="/my-sets">
            <Button>Back to My Sets</Button>
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
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Sets
          </Button>

          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="font-display text-4xl font-medium mb-2">
                Edit Poem Set
              </h1>
              <p className="text-muted-foreground">
                Edit your collection of 10 sonnets
              </p>
            </div>

            <div className="flex gap-2">
              {!poemSet?.allow_collaboration && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!id) return;
                    try {
                      await updatePoemSet.mutateAsync({
                        id,
                        allowCollaboration: true
                      });
                      toast({
                        title: "Collaboration enabled",
                        description: "Real-time collaboration is now active",
                      });
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message,
                        variant: "destructive",
                      });
                    }
                  }}
                  className="gap-2"
                >
                  <Users className="w-4 h-4" />
                  Enable Collaboration
                </Button>
              )}
              {poemSet?.allow_collaboration && (
                <InviteCollaboratorDialog
                  poemSetId={id!}
                  poemSetTitle={poemSet?.title || ''}
                />
              )}
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || saving}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Collaborator Bar */}
          {poemSet.allow_collaboration && activeCollaborators.length > 0 && (
            <Card className="mb-6">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Active collaborators:</span>
                  </div>
                  <div className="flex -space-x-2">
                    {activeCollaborators.map(collab => (
                      <div key={collab.user_id} className="relative group">
                        <Avatar className="w-8 h-8 border-2 border-background">
                          <AvatarImage src={collab.user_avatar} />
                          <AvatarFallback>
                            {collab.user_name[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {collab.user_name}
                          {collab.editing_sonnet !== null && (
                            <span className="ml-1 text-muted-foreground">
                              (Sonnet {collab.editing_sonnet + 1})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Status */}
          <div className="flex items-center gap-2 text-sm mb-6">
            {hasUnsavedChanges ? (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Saving...
              </div>
            ) : lastSavedAt ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-4 h-4 text-green-600" />
                Last saved {lastSavedAt.toLocaleTimeString()}
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Metadata Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Enter poem set title"
                />
              </div>
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Input
                  id="theme"
                  value={theme}
                  onChange={(e) => {
                    setTheme(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Enter theme or description"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Grid - Main content + Chat */}
        <div className={`grid gap-8 ${poemSet.allow_collaboration ? 'lg:grid-cols-[1fr,400px]' : ''}`}>
          {/* Sonnets Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={poemSet.allow_collaboration ? '' : 'max-w-4xl mx-auto'}
          >
            <h2 className="font-display text-2xl mb-4">Sonnets</h2>

            <Accordion type="single" collapsible className="space-y-4">
              {sonnets.map((sonnet, idx) => {
                const lineCount = countLines(sonnet);
                const isValid = lineCount === 14;
                const isLocked = isSonnetLocked(idx);
                const lockOwner = getSonnetLockOwner(idx);
                const editingUsers = getUsersEditingSonnet(idx);

                return (
                  <AccordionItem key={idx} value={`sonnet-${idx}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-display text-lg">
                          Sonnet {idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant={isValid ? "default" : "secondary"} className="gap-1">
                            {isValid && <Check className="w-3 h-3" />}
                            {lineCount}/14 lines
                          </Badge>
                          {isLocked && lockOwner && (
                            <Badge variant="outline" className="gap-1">
                              <Lock className="w-3 h-3" />
                              {lockOwner.user_name}
                            </Badge>
                          )}
                          {/* Show avatars of users editing this sonnet */}
                          {editingUsers.length > 0 && (
                            <div className="flex -space-x-2">
                              {editingUsers.slice(0, 3).map((editingUser) => {
                                const initials = editingUser.user_name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2);

                                return (
                                  <Avatar
                                    key={editingUser.user_id}
                                    className="h-6 w-6 border-2 border-background ring-2 ring-primary/50"
                                    title={`${editingUser.user_name} is editing`}
                                  >
                                    <AvatarImage src={editingUser.user_avatar} />
                                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                                  </Avatar>
                                );
                              })}
                              {editingUsers.length > 3 && (
                                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium">
                                  +{editingUsers.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="relative pt-2 pb-4">
                        {isLocked && lockOwner && (
                          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Lock className="w-4 h-4" />
                              <span>{lockOwner.user_name} is editing this sonnet</span>
                            </div>
                          </div>
                        )}
                        <Textarea
                          value={sonnet}
                          onChange={(e) => handleSonnetChange(idx, e.target.value)}
                          onFocus={() => handleSonnetFocus(idx)}
                          onBlur={() => handleSonnetBlur(idx)}
                          disabled={isLocked}
                          placeholder="Enter 14 lines for this sonnet, one per line"
                          className="min-h-[320px] font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Each sonnet must have exactly 14 lines
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </motion.div>

          {/* Chat Panel - Only show when collaboration is enabled */}
          {poemSet.allow_collaboration && id && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]"
            >
              <PoemSetChat poemSetId={id} />
            </motion.div>
          )}
        </div>
      </main>

      <Footer />

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on Page</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate('/my-sets')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave Without Saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditPoemSet;
