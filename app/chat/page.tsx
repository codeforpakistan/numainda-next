"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { useChat } from "ai/react"
import {
  Bot,
  CopyIcon,
  MessageSquare,
  RefreshCcw,
  SendIcon,
  User,
  LogOut,
  Loader2,
} from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { trackChatMessage, trackNewChatThread } from "@/lib/analytics"

import { Button } from "@/components/ui/button"
import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble"
import { ChatInput } from "@/components/ui/chat/chat-input"

const ChatAiIcons = [
  { icon: CopyIcon, label: "Copy" },
  { icon: RefreshCcw, label: "Refresh" },
]

function ChatPageContent() {
  const [isGenerating, setIsGenerating] = useState(false)
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
          trackNewChatThread()
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
    <div className="flex w-full touch-manipulation flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex h-14 flex-none items-center justify-between border-b bg-background px-4">
          <div className="flex items-center">
            <MessageSquare className="mr-2 size-5" />
            <span className="font-semibold">Numainda Chat</span>
          </div>
        </div>

        {/* Messages container */}
        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-2xl flex-col p-4 mt-auto">
            {isClient && messages.map((message) => (
              <ChatBubble
                key={message.id}
                variant={message.role === "user" ? "sent" : "received"}
                className="mb-6"
              >
                <ChatBubbleAvatar
                  className={
                    message.role === "assistant"
                      ? "border border-primary/20 bg-primary/10"
                      : "bg-muted"
                  }
                  fallback={
                    message.role === "assistant" ? (
                      <Bot className="size-4" />
                    ) : (
                      <User className="size-4" />
                    )
                  }
                />
                <ChatBubbleMessage>
                  <Markdown 
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-slate dark:prose-invert max-w-none"
                  >
                    {message.content}
                  </Markdown>
                </ChatBubbleMessage>
                {message.role === "assistant" && isClient && (
                  <ChatBubbleAction icon={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(message.content)}
                    >
                      <CopyIcon className="size-4" />
                      <span className="sr-only">Copy message</span>
                    </Button>
                  } />
                )}
              </ChatBubble>
            ))}
            {isGenerating && isClient && (
              <ChatBubble variant="received" className="mb-6">
                <ChatBubbleAvatar
                  className="border border-primary/20 bg-primary/10"
                  fallback={<Bot className="size-4" />}
                />
                <ChatBubbleMessage>
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm">Numainda is thinking...</span>
                  </div>
                </ChatBubbleMessage>
              </ChatBubble>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input - now will stay fixed at bottom */}
        <div className="flex-none bg-background p-4 ">
          <div className="mx-auto max-w-2xl">
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!input?.trim() || isLoading) return
                setIsGenerating(true)
                trackChatMessage(threadId || undefined)
                handleSubmit(e)
              }}
            >
              <ChatInput
                value={input}
                onChange={handleInputChange}
                placeholder="Message Numainda..."
                className="w-full rounded-lg border bg-slate-500/10 px-3 py-2 text-base"
                style={{ fontSize: "16px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    if (!input?.trim() || isLoading) return
                    setIsGenerating(true)
                    trackChatMessage(threadId || undefined)
                    handleSubmit(e)
                  }
                }}
              />
              <Button size="icon">
                <SendIcon />
                <span className="sr-only">Send</span>
              </Button>
            </form>
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
