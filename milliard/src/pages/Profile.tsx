import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FriendsList } from "@/components/social/FriendsList";
import { useAuth, useProfile, useUpdateProfile } from "@/hooks/use-auth";
import { useUserGroups } from "@/hooks/use-groups";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Calendar, Users, Camera } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: profile } = useProfile();
  const { data: groups, isLoading: groupsLoading } = useUserGroups();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
    if (profile?.handle) {
      setHandle(profile.handle);
    }
  }, [profile]);

  const handleUpdateDisplayName = async () => {
    // Only update if the name has changed
    if (displayName === profile?.display_name) return;

    try {
      await updateProfile.mutateAsync({ display_name: displayName });
      toast.success('Display name updated successfully');
    } catch (error) {
      toast.error('Failed to update display name');
      // Revert to original name on error
      setDisplayName(profile?.display_name || '');
    }
  };

  const handleUpdateHandle = async () => {
    // Only update if the handle has changed
    if (handle === profile?.handle) return;

    // Validate handle format
    const handleRegex = /^[a-z0-9_-]{3,30}$/i;
    if (!handleRegex.test(handle)) {
      toast.error('Handle must be 3-30 characters and contain only letters, numbers, underscores, or hyphens');
      setHandle(profile?.handle || '');
      return;
    }

    try {
      await updateProfile.mutateAsync({ handle });
      toast.success('Handle updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update handle');
      // Revert to original handle on error
      setHandle(profile?.handle || '');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleAvatarUpload called');
    const file = event.target.files?.[0];
    console.log('Selected file:', file);

    if (!file || !user) {
      console.log('No file or no user:', { file: !!file, user: !!user });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type);
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.log('File too large:', file.size);
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Create a unique file name using the user's ID as the folder
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Starting upload...', { fileName, filePath, userId: user.id });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      console.log('Avatar uploaded successfully. Public URL:', publicUrl);

      // Update profile with new avatar URL
      console.log('Updating profile with avatar URL...');
      const result = await updateProfile.mutateAsync({ avatar_url: publicUrl });
      console.log('Profile update result:', result);

      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getInitials = (displayName: string | null, email: string | null) => {
    if (displayName) {
      return displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="font-display text-3xl mb-4">Sign In Required</h1>
          <p className="text-muted-foreground">
            Please sign in to view your profile.
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-4xl font-medium mb-2">Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile and social connections
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  View and edit your profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage
                        src={profile?.avatar_url || undefined}
                        alt="Profile picture"
                        onError={() => console.log('Avatar image failed to load:', profile?.avatar_url)}
                        onLoad={() => console.log('Avatar image loaded successfully:', profile?.avatar_url)}
                      />
                      <AvatarFallback className="text-2xl">
                        {getInitials(profile?.display_name || null, profile?.email || null)}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 cursor-pointer">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                        <Camera className="h-4 w-4" />
                      </div>
                    </label>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">
                      {profile?.display_name || 'Anonymous User'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      @{profile?.handle || 'username'}
                    </p>
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    console.log('Input onChange triggered', e.target.files);
                    handleAvatarUpload(e);
                  }}
                  disabled={uploadingAvatar}
                />

                {/* Handle */}
                <div className="space-y-2">
                  <Label htmlFor="handle" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Handle
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      @
                    </span>
                    <Input
                      id="handle"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase())}
                      onBlur={handleUpdateHandle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="pl-7"
                      placeholder="username"
                      disabled={updateProfile.isPending}
                      minLength={3}
                      maxLength={30}
                      pattern="[a-z0-9_-]+"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your unique handle (3-30 characters)
                  </p>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onBlur={handleUpdateDisplayName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    placeholder="Enter your display name"
                    disabled={updateProfile.isPending}
                  />
                </div>

                {/* Member Since */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </Label>
                  <Input
                    value={profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Friends List and Groups */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <FriendsList />

            {/* Groups Section */}
            <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    My Groups
                  </CardTitle>
                  <CardDescription>
                    Groups you're a part of
                  </CardDescription>
                </div>
                <Button onClick={() => navigate("/groups")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {groupsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : groups && groups.length > 0 ? (
                <div className="space-y-3">
                  {groups.slice(0, 5).map((group: any) => (
                    <div
                      key={group.id}
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className="flex items-center justify-between p-3 rounded-lg border hover:border-primary transition-colors cursor-pointer"
                    >
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {group.member_count || 0} members
                        </p>
                      </div>
                      {group.user_role === "owner" && (
                        <Badge variant="secondary">Owner</Badge>
                      )}
                    </div>
                  ))}
                  {groups.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      And {groups.length - 5} more...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  You're not part of any groups yet
                </p>
              )}
            </CardContent>
          </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
