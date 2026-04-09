"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User,
  AlertCircle,
  Zap,
  BookOpen,
  Calendar,
  CheckSquare,
  PlusCircle
} from "lucide-react";
import type { AiConversation } from "@/types/database";
import { AI_QUICK_PROMPTS } from "@/lib/ai";
import { useAIEntityStore, type AIEntityAction } from "@/stores/ai-entity-store";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  provider?: "groq" | "google";
  isLoading?: boolean;
  error?: string;
  entityAction?: AIEntityAction;
}

interface AIStatus {
  requestsToday: number;
  remaining: number;
  limit: number;
}

/**
 * AI Chat Bubble - Floating action button with full chat functionality.
 */
export function AIBubble(): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus>({ 
    requestsToday: 0, 
    remaining: 50, 
    limit: 50 
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const setPendingAction = useAIEntityStore((state) => state.setPendingAction);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      fetchAIStatus();
    }
  }, [isOpen]);

  // Fetch AI status
  const fetchAIStatus = async () => {
    try {
      const response = await fetch("/api/ai");
      if (response.ok) {
        const data = await response.json();
        setAiStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch AI status:", error);
    }
  };

  // Send message to AI
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    const loadingMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Convert messages to conversation history format
      const conversationHistory: AiConversation[] = messages
        .filter((m) => !m.isLoading && !m.error)
        .slice(-10) // Last 10 messages for context
        .map((m) => ({
          $id: m.id,
          $createdAt: m.timestamp,
          $updatedAt: m.timestamp,
          $collectionId: "",
          $databaseId: "",
          $permissions: [],
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          tokens_used: null,
          provider: m.provider || null,
        }));

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText.trim(),
          conversationHistory,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Check for entity action
        const entityAction = data.entityAction?.action === "create" 
          ? {
              action: "create" as const,
              entity_type: data.entityAction.entity_type,
              fields: data.entityAction.fields,
              timestamp: Date.now(),
            }
          : undefined;

        // Update loading message with actual response
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMessage.id
              ? {
                  ...m,
                  content: data.message,
                  provider: data.provider,
                  isLoading: false,
                  entityAction,
                }
              : m
          )
        );

        // Update remaining requests
        if (data.remaining !== undefined) {
          setAiStatus((prev) => ({
            ...prev,
            remaining: data.remaining,
            requestsToday: prev.limit - data.remaining,
          }));
        }

        // Handle entity creation action - store it for modal handling
        if (entityAction) {
          setPendingAction(entityAction);
          const entityName = entityAction.entity_type.charAt(0).toUpperCase() + entityAction.entity_type.slice(1);
          toast.success(`Ready to create ${entityName}`, {
            description: "Click the button below to open the form",
            duration: 5000,
          });
        }
      } else {
        // Show error message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMessage.id
              ? {
                  ...m,
                  content: "",
                  isLoading: false,
                  error: data.error || "Failed to get response",
                }
              : m
          )
        );
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMessage.id
            ? {
                ...m,
                content: "",
                isLoading: false,
                error: "Network error. Please try again.",
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="interactive-surface interactive-focus fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full md:bottom-4"
        style={{
          background: "rgb(var(--accent))",
          boxShadow: `
            0 4px 20px rgba(var(--accent-rgb), 0.4),
            0 0 40px rgba(var(--accent-rgb), 0.2)
          `,
        }}
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </motion.button>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Window */}
            <motion.div
              className="glass-elevated fixed bottom-4 right-4 z-50 flex h-[600px] w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:top-0 max-md:h-full max-md:w-full max-md:max-w-none max-md:rounded-none"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      background: "rgba(var(--accent-rgb), 0.15)",
                    }}
                  >
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Assistant</h3>
                    <p className="text-xs text-muted-foreground">
                      Powered by {aiStatus.remaining > 40 ? "Groq" : "AI"} • {aiStatus.remaining}/{aiStatus.limit} left
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div
                      className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{
                        background: "rgba(var(--accent-rgb), 0.1)",
                      }}
                    >
                      <Bot className="h-8 w-8 text-accent" />
                    </div>
                    <h4 className="font-medium">Hi! I&apos;m your study assistant</h4>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Ask me about your schedule, exams, or tasks.
                    </p>
                    
                    {/* Quick prompts */}
                    <div className="mt-6 grid gap-2 w-full max-w-xs">
                      <button
                        onClick={() => handleQuickPrompt(AI_QUICK_PROMPTS.STUDY_TIPS)}
                        className="interactive-surface interactive-focus flex items-center gap-2 rounded-xl border border-border bg-card/50 px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <BookOpen className="h-4 w-4 text-accent" />
                        <span>What should I study today?</span>
                      </button>
                      <button
                        onClick={() => handleQuickPrompt(AI_QUICK_PROMPTS.ATTENDANCE_CHECK)}
                        className="interactive-surface interactive-focus flex items-center gap-2 rounded-xl border border-border bg-card/50 px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <Calendar className="h-4 w-4 text-accent" />
                        <span>Check my attendance</span>
                      </button>
                      <button
                        onClick={() => handleQuickPrompt(AI_QUICK_PROMPTS.EXAM_PREP)}
                        className="interactive-surface interactive-focus flex items-center gap-2 rounded-xl border border-border bg-card/50 px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <CheckSquare className="h-4 w-4 text-accent" />
                        <span>Help plan exam prep</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            message.role === "user"
                              ? "bg-accent text-white"
                              : "bg-muted"
                          }`}
                        >
                          {message.role === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                            message.role === "user"
                              ? "bg-accent text-white"
                              : "bg-muted"
                          }`}
                        >
                          {message.isLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Thinking...</span>
                            </div>
                          ) : message.error ? (
                            <div className="flex items-center gap-2 text-destructive">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">{message.error}</span>
                            </div>
                          ) : (
                            <>
                              <div className="text-sm whitespace-pre-wrap">
                                {message.content}
                              </div>
                              {/* Entity creation button */}
                              {message.entityAction && (
                                <button
                                  onClick={() => {
                                    setPendingAction(message.entityAction!);
                                    setIsOpen(false);
                                    toast.info(`Opening ${message.entityAction!.entity_type} form...`, {
                                      description: "Navigate to the relevant page to complete creation",
                                    });
                                  }}
                                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-accent/20 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/30"
                                >
                                  <PlusCircle className="h-4 w-4" />
                                  Create {message.entityAction.entity_type}
                                </button>
                              )}
                            </>
                          )}
                          {message.provider && !message.isLoading && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] opacity-60">
                              <Zap className="h-3 w-3" />
                              {message.provider}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="border-t border-border p-4">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about your schedule..."
                    className="flex-1 rounded-xl border border-border bg-input px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    disabled={isLoading || aiStatus.remaining === 0}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading || aiStatus.remaining === 0}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white transition-opacity disabled:opacity-50"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  AI: {aiStatus.requestsToday}/{aiStatus.limit} requests today
                  {aiStatus.remaining === 0 && " • Resets at midnight IST"}
                </p>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
