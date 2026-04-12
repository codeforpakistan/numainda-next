'use client'

import { Suspense, useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useChat } from "ai/react"
import {
  Bot,
  CopyIcon,
  SendIcon,
  User,
  Loader2,
  ArrowLeft,
  Trash2,
} from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useToast } from "@/hooks/use-toast"
import { trackChatMessage } from "@/lib/analytics"
import { Button } from "@/components/ui/button"

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex w-full flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}

function ChatContent() {
  const t = useTranslations('Chat')
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q")
  const [hasSubmittedInitial, setHasSubmittedInitial] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    append,
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
    onResponse: () => {
      setIsGenerating(false)
    },
    onError: () => {
      setIsGenerating(false)
    },
  })

  // Auto-submit the initial query from URL
  useEffect(() => {
    if (initialQuery && !hasSubmittedInitial) {
      setHasSubmittedInitial(true)
      setIsGenerating(true)
      trackChatMessage()
      append({ role: "user", content: initialQuery })
    }
  }, [initialQuery, hasSubmittedInitial, append])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    if (!initialQuery) {
      inputRef.current?.focus()
    }
  }, [initialQuery])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: t('copiedTitle'),
        description: t('copiedDesc'),
      })
    } catch {
      toast({
        title: t('copyFailedTitle'),
        variant: "destructive",
      })
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: t('welcomeMessage'),
      },
    ])
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input?.trim() || isLoading) return
    setIsGenerating(true)
    trackChatMessage()
    handleSubmit(e)
  }

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* Chat Header */}
      <div className="flex-none border-b bg-background/95 backdrop-blur">
        <div className="container flex h-12 max-w-3xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">{t('backToHome')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-primary" />
            <span className="text-sm font-semibold">{t('numainda')}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="size-4" />
            <span className="sr-only">{t('clearChat')}</span>
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-3xl px-4 py-6">
          <div className="flex flex-col gap-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex size-8 flex-none items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                    <Bot className="size-4 text-primary" />
                  </div>
                )}
                <div
                  className={`group relative max-w-[85%] rounded-2xl px-4 py-3 md:max-w-[75%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    className={`prose prose-sm max-w-none break-words prose-p:leading-relaxed prose-pre:p-2 ${
                      message.role === "user"
                        ? "prose-invert"
                        : "dark:prose-invert"
                    }`}
                  >
                    {message.id === "welcome" ? t('welcomeMessage') : message.content}
                  </Markdown>
                  {message.role === "assistant" && message.id !== "welcome" && (
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <CopyIcon className="size-3" />
                      {t('copy')}
                    </button>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex size-8 flex-none items-center justify-center rounded-full bg-muted">
                    <User className="size-4" />
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-3">
                <div className="flex size-8 flex-none items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                  <Bot className="size-4 text-primary" />
                </div>
                <div className="rounded-2xl bg-muted px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    {t('thinking')}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-none border-t bg-background">
        <div className="container max-w-3xl px-4 py-3 md:py-4">
          <form className="relative" onSubmit={onSubmit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder={t('placeholder')}
              className="w-full resize-none rounded-xl border bg-muted/50 px-4 py-3 pr-12 text-sm transition-shadow placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 md:py-4 md:pr-14 md:text-base"
              rows={1}
              style={{ fontSize: '16px' }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  onSubmit(e)
                }
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 120) + 'px'
              }}
            />
            <Button
              size="icon"
              type="submit"
              disabled={isLoading || !input?.trim()}
              className="absolute bottom-2 right-2 size-8 rounded-lg md:bottom-3 md:right-3 md:size-9"
            >
              <SendIcon className="size-4" />
              <span className="sr-only">{t('send')}</span>
            </Button>
          </form>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {t('disclaimer')}
          </p>
        </div>
      </div>
    </div>
  )
}
