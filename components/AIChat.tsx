"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  X, 
  Sparkles,
  Phone,
  Mail,
  Calendar,
  FileText,
  HelpCircle,
  Zap,
  ChevronDown
} from "lucide-react";
import { aiService } from "@/lib/ai-service";
import { getAuthenticatedUser } from "@/lib/auth";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  suggestedActions?: string[];
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hi! I'm your AI assistant. I can help with onboarding, benefits, policies, and general HR questions. How can I assist you today?",
      sender: "ai",
      timestamp: new Date(),
      suggestedActions: ["Onboarding Help", "Benefits Info", "IT Support", "HR Policies"]
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [userId, setUserId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUserInfo();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getUserInfo = async () => {
    const user = await getAuthenticatedUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || !userId) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      text: input,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Determine context based on keywords
      let context: "onboarding" | "benefits" | "policies" | "general" = "general";
      const lowerInput = input.toLowerCase();
      
      if (lowerInput.includes("onboard") || lowerInput.includes("task") || lowerInput.includes("new")) {
        context = "onboarding";
      } else if (lowerInput.includes("benefit") || lowerInput.includes("insurance") || lowerInput.includes("pto")) {
        context = "benefits";
      } else if (lowerInput.includes("policy") || lowerInput.includes("rule") || lowerInput.includes("handbook")) {
        context = "policies";
      }

      const response = await aiService.processChat(userId, sessionId, input, context);

      const aiMessage: Message = {
        id: `msg_${Date.now()}_ai`,
        text: response.response,
        sender: "ai",
        timestamp: new Date(),
        suggestedActions: response.suggestedActions
      };

      setMessages(prev => [...prev, aiMessage]);

      if (response.needsEscalation) {
        setTimeout(() => {
          const escalationMessage: Message = {
            id: `msg_${Date.now()}_escalation`,
            text: "🚨 I've escalated this to our HR team. They will contact you within the next hour. In urgent cases, you can also call HR directly at (555) 123-4567.",
            sender: "ai",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, escalationMessage]);
        }, 1000);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        text: "I apologize, but I'm having trouble processing your request. Please try again or contact HR directly.",
        sender: "ai",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedAction = (action: string) => {
    setInput(action);
  };

  const quickActions = [
    { icon: FileText, label: "Onboarding Status", query: "What's my onboarding status?" },
    { icon: HelpCircle, label: "Benefits Info", query: "Tell me about company benefits" },
    { icon: Calendar, label: "Time Off", query: "How do I request time off?" },
    { icon: Mail, label: "Contact HR", query: "I need to contact HR" }
  ];

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-full gradient-primary shadow-2xl text-white hover:shadow-glow transition-all"
          >
            <MessageSquare className="w-6 h-6" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25 }}
            className={`fixed bottom-6 right-6 z-50 ${
              isMinimized ? "w-80" : "w-96"
            } glass-card rounded-3xl shadow-2xl overflow-hidden`}
          >
            {/* Header */}
            <div className="gradient-primary p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      AI Assistant
                      <Sparkles className="w-4 h-4" />
                    </h3>
                    <p className="text-xs opacity-90">Always here to help</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${
                      isMinimized ? "rotate-180" : ""
                    }`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex ${
                          message.sender === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div className={`flex gap-3 max-w-[80%] ${
                          message.sender === "user" ? "flex-row-reverse" : ""
                        }`}>
                          <div className={`p-2 rounded-full ${
                            message.sender === "user" 
                              ? "gradient-primary" 
                              : "bg-gray-200"
                          }`}>
                            {message.sender === "user" ? (
                              <User className="w-4 h-4 text-white" />
                            ) : (
                              <Bot className="w-4 h-4 text-gray-700" />
                            )}
                          </div>
                          <div>
                            <div className={`p-3 rounded-2xl ${
                              message.sender === "user"
                                ? "gradient-primary text-white"
                                : "bg-white shadow-soft"
                            }`}>
                              <p className="text-sm">{message.text}</p>
                            </div>
                            {message.suggestedActions && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {message.suggestedActions.map((action, i) => (
                                  <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSuggestedAction(action)}
                                    className="text-xs px-3 py-1.5 bg-white rounded-xl shadow-soft hover:shadow-md transition-all text-gray-700"
                                  >
                                    {action}
                                  </motion.button>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="p-2 rounded-full bg-gray-200">
                        <Bot className="w-4 h-4 text-gray-700" />
                      </div>
                      <div className="bg-white shadow-soft rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                <div className="p-3 border-t border-gray-200 bg-white/50">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setInput(action.query)}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors whitespace-nowrap text-sm"
                        >
                          <Icon className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-700">{action.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                      className="p-2.5 gradient-primary rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
                    >
                      <Send className="w-5 h-5" />
                    </motion.button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Powered by AI • Available 24/7
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}