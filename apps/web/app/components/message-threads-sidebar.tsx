import { Button } from "@/components/ui/button";
import { MessageCircle, Plus, X, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { PehchanLoginButton } from "@/components/pehchan-button";
import { useRouter } from 'next/navigation'

interface MessageThreadsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatThread {
  id: string
  title: string
  created_at: string
  messages: any[]
}

export function MessageThreadsSidebar({ isOpen, onClose }: MessageThreadsSidebarProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([])
  const router = useRouter()

  useEffect(() => {
    // Check initial auth state
    const checkAuth = () => {
      const accessToken = localStorage.getItem('access_token');
      console.log('Sidebar auth check - access_token:', accessToken)
      setIsAuthenticated(!!accessToken);
    };

    // Check auth on mount
    checkAuth();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab updates
    const handleCustomStorageChange = () => checkAuth();
    window.addEventListener('localStorageChange', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
    };
  }, []);

  useEffect(() => {
    const loadThreads = async () => {
      console.log('loadThreads called, isAuthenticated:', isAuthenticated)
      const pehchanId = localStorage.getItem('pehchan_id')
      console.log('Sidebar - Pehchan ID:', pehchanId)
      if (!pehchanId) return

      const response = await fetch(`/api/chat/threads?pehchan_id=${pehchanId}`)
      const threads = await response.json()
      setThreads(threads)
    }

    if (isAuthenticated) {
      loadThreads()
      // Set up polling for updates
      const interval = setInterval(loadThreads, 5000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the thread selection
    
    const pehchanId = localStorage.getItem('pehchan_id');
    if (!pehchanId) return;

    try {
      const response = await fetch(`/api/chat/threads/${threadId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pehchanId })
      });

      if (response.ok) {
        // Remove thread from local state
        setThreads(threads.filter(thread => thread.id !== threadId));
        // If we're currently viewing this thread, redirect to new chat
        const currentThreadId = new URLSearchParams(window.location.search).get('thread');
        if (currentThreadId === threadId) {
          router.push('/chat');
        }
      }
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 border-r bg-background",
          "transition-transform duration-200 ease-in-out lg:transform-none",
          "lg:relative lg:block",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <span className="font-semibold">Chats</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
              <X className="size-4" />
            </Button>
          </div>
          
          {isAuthenticated ? (
            <>
              <div className="flex-1 overflow-y-auto p-2">
                <Button
                  variant="outline"
                  className="mb-4 w-full"
                  onClick={() => router.push('/chat')}
                >
                  <Plus className="mr-2 size-4" />
                  New Chat
                </Button>
                
                {threads.map((thread) => (
                  <Button
                    key={thread.id}
                    variant="ghost"
                    className="group mb-1 h-auto w-full justify-start p-3 text-left"
                    onClick={() => {
                      router.push(`/chat?thread=${thread.id}`)
                      onClose?.()
                    }}
                  >
                    <MessageCircle className="mr-3 size-4 shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate font-medium">{thread.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {thread.messages[thread.messages.length - 1]?.content.slice(0, 50) || 'New chat'}...
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => handleDeleteThread(thread.id, e)}
                    >
                      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </Button>
                ))}
              </div>

              <div className="border-t p-4">
                <Button className="w-full">
                  <Plus className="mr-2 size-4" />
                  New Chat
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-4">
              <PehchanLoginButton />
            </div>
          )}
        </div>
      </aside>
    </>
  );
} 