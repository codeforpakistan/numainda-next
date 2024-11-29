"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "ai/react"
import {
  Bot,
  CopyIcon,
  Menu,
  MessageSquare,
  RefreshCcw,
  SendIcon,
  User,
} from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble"
import { ChatInput } from "@/components/ui/chat/chat-input"
import { MessageThreadsSidebar } from "@/app/components/message-threads-sidebar"

const ChatAiIcons = [
  { icon: CopyIcon, label: "Copy" },
  { icon: RefreshCcw, label: "Refresh" },
]

export default function ChatPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
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
      if (response) setIsGenerating(false)
    },
    onError: (error) => {
      if (error) setIsGenerating(false)
    },
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col lg:flex-row w-full touch-manipulation">
      <MessageThreadsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background h-14 border-b flex items-center px-4 flex-none">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden mr-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <MessageSquare className="h-5 w-5 mr-2" />
          <span className="font-semibold">Numainda Chat</span>
        </div>

        {/* Messages */}
        <div className="flex flex-col max-w-2xl mx-auto p-4 mt-auto">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              variant={message.role === "user" ? "sent" : "received"}
              className="mb-6"
            >
              <ChatBubbleAvatar
                className={
                  message.role === "assistant"
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-muted"
                }
                fallback={
                  message.role === "assistant" ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )
                }
              />
              <ChatBubbleMessage>
                <Markdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </Markdown>
              </ChatBubbleMessage>
            </ChatBubble>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4">
          <div className="max-w-2xl mx-auto">
            <form
              className="flex items-center gap-2"
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
                placeholder="Message Numainda..."
                className="w-full rounded-lg border px-3 py-2 text-base bg-slate-500/10"
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
