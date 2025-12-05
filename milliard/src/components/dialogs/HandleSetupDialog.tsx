import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useUpdateProfile } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface HandleSetupDialogProps {
  open: boolean;
  onComplete: () => void;
}

export function HandleSetupDialog({ open, onComplete }: HandleSetupDialogProps) {
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const { toast } = useToast();
  const updateProfile = useUpdateProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate handle format
    const handleRegex = /^[a-z0-9_-]{3,30}$/i;
    if (!handleRegex.test(handle)) {
      toast({
        title: 'Invalid handle',
        description: 'Handle must be 3-30 characters and contain only letters, numbers, underscores, or hyphens.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateProfile.mutateAsync({
        handle,
        display_name: displayName || null,
      });
      toast({
        title: 'Profile updated!',
        description: 'Your handle has been set successfully.',
      });
      onComplete();
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please choose a unique handle to complete your account setup.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="handle">Handle *</Label>
            <Input
              id="handle"
              type="text"
              placeholder="username"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              required
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_-]+"
            />
            <p className="text-xs text-muted-foreground">
              3-30 characters, letters, numbers, underscores, or hyphens
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name (Optional)</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
