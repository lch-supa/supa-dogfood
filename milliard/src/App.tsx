import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ChatProvider, useChat } from "@/contexts/ChatContext";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { HandleSetupDialog } from "@/components/dialogs/HandleSetupDialog";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import MySets from "./pages/MySets";
import Profile from "./pages/Profile";
import PoemSetView from "./pages/PoemSetView";
import EditPoemSet from "./pages/EditPoemSet";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { isChatOpen, closeChat } = useChat();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [handleSetupComplete, setHandleSetupComplete] = useState(false);

  // Check if user needs to set up their handle (OAuth users)
  const needsHandleSetup = user && profile && !profile.handle && !handleSetupComplete;

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/my-sets" element={<MySets />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-sets/:id/edit" element={<EditPoemSet />} />
        <Route path="/poem-set/:id" element={<PoemSetView />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatWidget isOpen={isChatOpen} onClose={closeChat} />
      <HandleSetupDialog
        open={!!needsHandleSetup}
        onComplete={() => setHandleSetupComplete(true)}
      />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="milliard-theme">
      <ChatProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </ChatProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
