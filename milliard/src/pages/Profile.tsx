import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FriendsList } from "@/components/FriendsList";
import { useAuth, useProfile, useUpdateProfile } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    try {
      await updateProfile.mutateAsync({ display_name: displayName });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
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
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl">
                      {getInitials(profile?.display_name || null, profile?.email || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-lg">
                      {profile?.display_name || 'Anonymous User'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {profile?.email}
                    </p>
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your display name"
                      />
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={updateProfile.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDisplayName(profile?.display_name || '');
                          setIsEditing(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        value={profile?.display_name || 'Not set'}
                        disabled
                      />
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
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

          {/* Friends List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FriendsList />
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
