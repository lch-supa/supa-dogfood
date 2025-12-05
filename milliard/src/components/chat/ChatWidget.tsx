import { useState } from "react";
import { ConversationsList } from "./ConversationsList";
import { ChatBubble } from "./ChatBubble";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, X, Minus } from "lucide-react";

type ChatView = "list" | "conversation";

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatWidget({ isOpen, onClose }: ChatWidgetProps) {
  const [view, setView] = useState<ChatView>("list");
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setView("conversation");
  };

  const handleBackToList = () => {
    setView("list");
    setActiveConversationId(null);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleExpand = () => {
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsMinimized(false);
    setView("list");
    setActiveConversationId(null);
    onClose();
  };

  if (!isOpen && !isMinimized) {
    return null;
  }

  // Minimized state - just show a tab
  if (isMinimized) {
    return (
      <Card
        className="fixed bottom-4 right-4 flex items-center gap-2 p-3 shadow-xl z-50 cursor-pointer hover:bg-accent transition-colors"
        onClick={handleExpand}
      >
        <MessageSquare className="h-5 w-5" />
        <span className="font-semibold">Messages</span>
      </Card>
    );
  }

  // Expanded state - show either list or conversation
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {view === "list" ? (
        <ConversationsList
          onSelectConversation={handleSelectConversation}
          onClose={handleClose}
          onMinimize={handleMinimize}
        />
      ) : (
        activeConversationId && (
          <ChatBubble
            conversationId={activeConversationId}
            onClose={handleClose}
            onMinimize={handleMinimize}
            onBack={handleBackToList}
          />
        )
      )}
    </div>
  );
}
