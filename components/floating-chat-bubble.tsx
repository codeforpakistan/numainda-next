'use client'

import { useState, useRef, useEffect } from "react"
import { useChat } from "ai/react"
import {
  Bot,
  CopyIcon,
  MessageSquare,
  SendIcon,
  User,
  X,
  Minimize2,
  Loader2,
} from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useToast } from "@/hooks/use-toast"
import { trackChatMessage } from "@/lib/analytics"

import { Button } from "@/components/ui/button"
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble"
import { ChatInput } from "@/components/ui/chat/chat-input"

export function FloatingChatBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }
    },
    onError: (error) => {
      if (error) setIsGenerating(false)
    },
  })

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

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

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I am Numainda, your guide to Pakistan's constitutional and electoral information. How may I assist you today?",
      },
    ])
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 md:bottom-6 md:right-6 md:size-16"
          aria-label="Open chat"
        >
          <MessageSquare className="size-6 md:size-7" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-40 flex w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border bg-background shadow-2xl md:bottom-6 md:right-6 md:h-[600px] md:w-[400px] h-[calc(100vh-2rem)]">
          {/* Header */}
          <div className="flex h-14 flex-none items-center justify-between border-b bg-primary px-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5" />
              <span className="font-semibold">Numainda</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={handleClearChat}
                title="Clear chat"
              >
                <Minimize2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  variant={message.role === "user" ? "sent" : "received"}
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
                      className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-2"
                    >
                      {message.content}
                    </Markdown>
                  </ChatBubbleMessage>
                  {message.role === "assistant" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => copyToClipboard(message.content)}
                    >
                      <CopyIcon className="size-3" />
                      <span className="sr-only">Copy message</span>
                    </Button>
                  )}
                </ChatBubble>
              ))}
              {isGenerating && (
                <ChatBubble variant="received">
                  <ChatBubbleAvatar
                    className="border border-primary/20 bg-primary/10"
                    fallback={<Bot className="size-4" />}
                  />
                  <ChatBubbleMessage>
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </ChatBubbleMessage>
                </ChatBubble>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="flex-none border-t bg-background p-3">
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!input?.trim() || isLoading) return
                setIsGenerating(true)
                trackChatMessage()
                handleSubmit(e)
              }}
            >
              <ChatInput
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about constitution, laws, representatives..."
                className="min-h-[40px] w-full rounded-lg border bg-background px-3 py-2 text-sm"
                style={{ fontSize: "16px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    if (!input?.trim() || isLoading) return
                    setIsGenerating(true)
                    trackChatMessage()
                    handleSubmit(e)
                  }
                }}
              />
              <Button size="icon" type="submit" disabled={isLoading}>
                <SendIcon className="size-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
