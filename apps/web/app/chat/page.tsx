"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { useChat } from "ai/react"
import {
  Bot,
  CopyIcon,
  Menu,
  MessageSquare,
  RefreshCcw,
  SendIcon,
  User,
  LogOut,
  Loader2,
  MessageCircle,
  FileText,
} from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble"
import { ChatInput } from "@/components/ui/chat/chat-input"
import { MessageThreadsSidebar } from "@/app/components/message-threads-sidebar"
import { PehchanLoginButton } from "@/components/pehchan-button"

const ChatAiIcons = [
  { icon: CopyIcon, label: "Copy" },
  { icon: RefreshCcw, label: "Refresh" },
]

function ChatPageContent() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [threadId, setThreadId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token')
    console.log('Auth check - access_token:', accessToken)
    setIsAuthenticated(!!accessToken)
  }, [])

  useEffect(() => {
    const loadOrCreateThread = async () => {
      console.log('loadOrCreateThread called, isAuthenticated:', isAuthenticated)
      if (!isAuthenticated) return
      
      const pehchanId = localStorage.getItem('pehchan_id')
      console.log('Pehchan ID:', pehchanId)
      if (!pehchanId) return

      const threadIdParam = searchParams.get('thread')
      if (threadIdParam) {
        console.log('Loading thread:', threadIdParam)
        const response = await fetch(`/api/chat/threads/${threadIdParam}?pehchan_id=${pehchanId}`)
        const thread = await response.json()
        console.log('Loaded thread:', thread)

        if (thread) {
          setThreadId(thread.id)
          setMessages(thread.messages)
        }
      } else {
        console.log('Creating new thread')
        const response = await fetch('/api/chat/threads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            pehchanId,
            title: 'New Chat'
          })
        })
        const thread = await response.json()
        console.log('Created thread:', thread)

        if (thread) {
          setThreadId(thread.id)
          router.push(`/chat?thread=${thread.id}`)
        }
      }
    }

    loadOrCreateThread()
  }, [isAuthenticated, searchParams])

  const handleLogout = () => {
    localStorage.clear()
    window.dispatchEvent(new Event('localStorageChange'))
    toast({
      title: "Logged out",
      description: "You have been successfully logged out"
    })
    router.refresh()
  }

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    setMessages,
  } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I am Numainda, your guide to Pakistan's constitutional and electoral information. How may I assist you today?",
      },
    ],
    onResponse: (response) => {
      if (response) {
        setIsGenerating(false)
        // Scroll to bottom when response starts streaming
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        
        if (threadId) {
          fetch(`/api/chat/threads/${threadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages,
              title: messages[1]?.content.slice(0, 100) || 'New Chat',
              pehchanId: localStorage.getItem('pehchan_id')
            })
          })
        }
      }
    },
    onError: (error) => {
      if (error) setIsGenerating(false)
    },
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied to your clipboard",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the message to clipboard",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex w-full touch-manipulation flex-col overflow-hidden lg:flex-row">
      <MessageThreadsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex h-14 flex-none items-center justify-between border-b bg-background px-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="mr-2 lg:hidden"
            >
              <Menu className="size-5" />
            </Button>
            <MessageSquare className="mr-2 size-5" />
            <span className="font-semibold">Numainda Chat</span>
          </div>
          
  
        </div>

        {/* Messages container */}
        <div className="flex min-h-0 flex-1 overflow-y-auto bg-white">
          <div className="mx-auto flex w-full max-w-4xl flex-col p-4">
            {/* Empty State */}
            {isClient && messages.length === 1 && messages[0].role === "assistant" && (
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
                <MessageCircle className="mb-6 size-16 text-primary" />
                <h2 className="mb-3 text-3xl font-bold text-primary">Hi! I&apos;m Numainda</h2>
                <p className="mb-8 text-center text-lg text-muted-foreground">
                  Your AI guide to Pakistani legislation
                </p>

                <div className="grid w-full max-w-2xl gap-4 md:grid-cols-2">
                  <button
                    onClick={() => {
                      handleInputChange({
                        target: { value: "Who is my MNA in Rawalpindi?" }
                      } as any)
                    }}
                    className="rounded-xl border-2 border-border bg-white p-6 text-left transition-all hover:border-accent hover:shadow-md"
                  >
                    <MessageSquare className="mb-2 size-5 text-accent" />
                    <div className="font-medium">Who is my MNA in Rawalpindi?</div>
                  </button>
                  <button
                    onClick={() => {
                      handleInputChange({
                        target: { value: "Explain Article 25" }
                      } as any)
                    }}
                    className="rounded-xl border-2 border-border bg-white p-6 text-left transition-all hover:border-accent hover:shadow-md"
                  >
                    <FileText className="mb-2 size-5 text-accent" />
                    <div className="font-medium">Explain Article 25</div>
                  </button>
                  <button
                    onClick={() => {
                      handleInputChange({
                        target: { value: "What is the Supreme Court review bill?" }
                      } as any)
                    }}
                    className="rounded-xl border-2 border-border bg-white p-6 text-left transition-all hover:border-accent hover:shadow-md"
                  >
                    <Bot className="mb-2 size-5 text-accent" />
                    <div className="font-medium">What is the Supreme Court review bill?</div>
                  </button>
                  <button
                    onClick={() => {
                      handleInputChange({
                        target: { value: "Show me recent bills" }
                      } as any)
                    }}
                    className="rounded-xl border-2 border-border bg-white p-6 text-left transition-all hover:border-accent hover:shadow-md"
                  >
                    <FileText className="mb-2 size-5 text-accent" />
                    <div className="font-medium">Show me recent bills</div>
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {isClient && messages.length > 1 && (
              <div className="space-y-6 py-4">
                {messages.slice(1).map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Bot className="size-5 text-primary" />
                      </div>
                    )}

                    <div
                      className={`flex-1 ${
                        message.role === "user" ? "max-w-[80%]" : "max-w-full"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-6 py-4 ${
                          message.role === "user"
                            ? "bg-primary text-white"
                            : "bg-secondary-bg text-foreground"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="mb-2 text-sm font-medium text-muted-foreground">
                            Numainda • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          className={`prose max-w-none ${
                            message.role === "user"
                              ? "prose-invert"
                              : "prose-slate"
                          }`}
                          components={{
                            a: ({ node, ...props }) => (
                              <a {...props} className="font-medium text-accent hover:underline" />
                            ),
                          }}
                        >
                          {message.content}
                        </Markdown>
                        {message.role === "assistant" && isClient && (
                          <div className="mt-4 flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(message.content)}
                            >
                              <CopyIcon className="mr-2 size-3" />
                              Copy
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <User className="size-5" />
                      </div>
                    )}
                  </div>
                ))}
                {isGenerating && isClient && (
                  <div className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Bot className="size-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-secondary-bg px-6 py-4">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Numainda is thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="flex-none border-t bg-white p-4 shadow-lg">
          <div className="mx-auto max-w-4xl">
            <form
              className="relative flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!input?.trim() || isLoading) return
                setIsGenerating(true)
                handleSubmit(e)
              }}
            >
              <ChatInput
                value={input}
                onChange={handleInputChange}
                placeholder="Ask anything about laws, bills, or representatives..."
                className="h-12 w-full rounded-lg border-input px-4 text-base"
                style={{ fontSize: "16px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    if (!input?.trim() || isLoading) return
                    setIsGenerating(true)
                    handleSubmit(e)
                  }
                }}
              />
              <Button
                size="icon"
                type="submit"
                className="h-12 w-12 shrink-0"
                disabled={isLoading || !input?.trim()}
              >
                <SendIcon className="size-5" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Supports Urdu and English
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>}>
      <ChatPageContent />
    </Suspense>
  )
}
