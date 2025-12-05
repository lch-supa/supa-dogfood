import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Menu, User, LogOut, Library, Users, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/dialogs/AuthDialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth, useSignOut, useProfile } from "@/hooks/use-auth";
import { useFriendRequests } from "@/hooks/use-friends";
import { useUnreadMessageCount } from "@/hooks/use-direct-messages";
import { useChat } from "@/contexts/ChatContext";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { data: profile } = useProfile();
  const { data: friendRequests = [] } = useFriendRequests();
  const { data: unreadCount = 0 } = useUnreadMessageCount();
  const { toggleChat } = useChat();
  const signOut = useSignOut();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <BookOpen className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
            <span className="font-display text-lg text-foreground">
              Sonnet-Machine
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/explore">
              <Button variant="ghost" className="font-display">
                Explore
              </Button>
            </Link>

            {isAuthenticated && (
              <Link to="/my-sets">
                <Button variant="ghost" className="font-display">
                  My Sets
                </Button>
              </Link>
            )}

            {isAuthenticated && (
              <Link to="/groups">
                <Button variant="ghost" className="font-display">
                  Groups
                </Button>
              </Link>
            )}

            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={toggleChat}
              >
                <MessageSquare className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            )}

            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/profile')}
              >
                <Users className="h-5 w-5" />
                {friendRequests.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {friendRequests.length}
                  </Badge>
                )}
              </Button>
            )}

            <ThemeToggle />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
                      <AvatarFallback className="bg-gold/10 text-gold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.display_name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="font-display gap-2"
                onClick={() => setAuthDialogOpen(true)}
              >
                <User className="w-4 h-4" />
                Sign In
              </Button>
            )}
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
}
