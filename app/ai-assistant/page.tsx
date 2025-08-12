"use client";

import { useState, useEffect, useRef } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Authenticator } from "@aws-amplify/ui-react";
import Layout from "@/components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Brain,
  Zap,
  MessageSquare,
  FileText,
  HelpCircle,
  Calendar,
  Users,
  Briefcase,
  ChartBar,
  Shield,
  Settings,
  Lightbulb,
  ChevronRight,
  Loader2,
  ArrowRight,
  Target,
  TrendingUp,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Mail,
  Phone,
  MapPin,
  Building,
} from "lucide-react";
import { aiService } from "@/lib/ai-service";
import { getAuthenticatedUser } from "@/lib/auth";

const client = generateClient<Schema>();

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  suggestedActions?: string[];
  category?: string;
  sentiment?: "positive" | "neutral" | "negative";
}

interface QuickAction {
  icon: any;
  label: string;
  description: string;
  query: string;
  category: "onboarding" | "benefits" | "policies" | "analytics" | "support";
  gradient: string;
}

function AIAssistantPage({ user }: { user: any }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello! I'm your AI-powered HR assistant. I can help with onboarding, benefits, policies, analytics, and more. What would you like to know today?",
      sender: "ai",
      timestamp: new Date(),
      category: "greeting",
      sentiment: "positive"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [userId, setUserId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = [
    {
      icon: Users,
      label: "Onboarding Help",
      description: "Get assistance with new employee onboarding",
      query: "I need help with onboarding a new employee",
      category: "onboarding",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      icon: Shield,
      label: "Benefits Information",
      description: "Learn about company benefits and enrollment",
      query: "Tell me about our company benefits",
      category: "benefits",
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      icon: BookOpen,
      label: "Company Policies",
      description: "Access and understand HR policies",
      query: "I have a question about company policies",
      category: "policies",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: ChartBar,
      label: "HR Analytics",
      description: "Get insights and performance metrics",
      query: "Show me HR analytics and insights",
      category: "analytics",
      gradient: "from-amber-500 to-orange-600"
    },
    {
      icon: HelpCircle,
      label: "General Support",
      description: "Get help with any HR-related question",
      query: "I need general HR support",
      category: "support",
      gradient: "from-red-500 to-rose-600"
    },
    {
      icon: Calendar,
      label: "Time Off Request",
      description: "Learn how to request time off",
      query: "How do I request time off?",
      category: "policies",
      gradient: "from-cyan-500 to-blue-600"
    }
  ];

  const categories = [
    { id: "all", label: "All Topics", icon: Sparkles },
    { id: "onboarding", label: "Onboarding", icon: Users },
    { id: "benefits", label: "Benefits", icon: Shield },
    { id: "policies", label: "Policies", icon: BookOpen },
    { id: "analytics", label: "Analytics", icon: ChartBar },
    { id: "support", label: "Support", icon: HelpCircle }
  ];

  useEffect(() => {
    getUserInfo();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getUserInfo = async () => {
    const authUser = await getAuthenticatedUser();
    if (authUser) {
      setUserId(authUser.id);
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
      
      if (lowerInput.includes("onboard") || lowerInput.includes("new employee") || lowerInput.includes("training")) {
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
        suggestedActions: response.suggestedActions,
        category: context,
        sentiment: response.sentiment
      };

      setMessages(prev => [...prev, aiMessage]);

      if (response.needsEscalation) {
        setTimeout(() => {
          const escalationMessage: Message = {
            id: `msg_${Date.now()}_escalation`,
            text: "🚨 I've escalated this to our HR team. They will contact you within the next hour. You can also reach HR directly at (555) 123-4567 or hr@company.com.",
            sender: "ai",
            timestamp: new Date(),
            sentiment: "neutral"
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
        timestamp: new Date(),
        sentiment: "negative"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setInput(action.query);
    handleSend();
  };

  const handleSuggestedAction = (action: string) => {
    setInput(action);
  };

  const filteredActions = selectedCategory === "all" 
    ? quickActions 
    : quickActions.filter(action => action.category === selectedCategory);

  return (
    <Authenticator>
      {({ user }) => (
        <Layout user={user}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
            {/* Left Sidebar - Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-4 xl:col-span-3 space-y-6"
            >
              {/* Categories */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  AI Assistant Topics
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <motion.button
                        key={category.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          selectedCategory === category.id
                            ? "bg-indigo-100 text-indigo-700 shadow-soft"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{category.label}</span>
                        {selectedCategory === category.id && (
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  Quick Actions
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAction(action)}
                        className="w-full text-left p-4 rounded-xl bg-white hover:shadow-lg transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${action.gradient} shadow-soft`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {action.label}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {action.description}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors mt-1" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* AI Capabilities */}
              <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  AI Capabilities
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">24/7 intelligent HR support</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Real-time policy guidance</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Automated task recommendations</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Smart escalation to HR team</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Main Chat Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-8 xl:col-span-9 glass-card rounded-2xl flex flex-col"
            >
              {/* Chat Header */}
              <div className="gradient-primary p-6 rounded-t-2xl text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <Bot className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        AI HR Assistant
                        <Sparkles className="w-6 h-6" />
                      </h2>
                      <p className="text-indigo-100">Powered by advanced AI to help you with all HR needs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm">Online</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${
                        message.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className={`flex gap-3 max-w-[70%] ${
                        message.sender === "user" ? "flex-row-reverse" : ""
                      }`}>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`p-2.5 rounded-full ${
                            message.sender === "user" 
                              ? "gradient-primary shadow-glow" 
                              : "bg-white shadow-soft"
                          }`}
                        >
                          {message.sender === "user" ? (
                            <User className="w-5 h-5 text-white" />
                          ) : (
                            <Bot className="w-5 h-5 text-indigo-600" />
                          )}
                        </motion.div>
                        <div>
                          <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className={`px-5 py-3 rounded-2xl ${
                              message.sender === "user"
                                ? "gradient-primary text-white shadow-glow"
                                : "bg-white shadow-soft"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                          </motion.div>
                          
                          {/* Suggested Actions */}
                          {message.suggestedActions && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="mt-3 flex flex-wrap gap-2"
                            >
                              {message.suggestedActions.map((action, i) => (
                                <motion.button
                                  key={i}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleSuggestedAction(action)}
                                  className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
                                >
                                  {action}
                                </motion.button>
                              ))}
                            </motion.div>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-2">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                            {message.category && message.category !== "general" && (
                              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                {message.category}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="p-2.5 rounded-full bg-white shadow-soft">
                      <Bot className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="bg-white shadow-soft rounded-2xl px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-gray-200 bg-white rounded-b-2xl">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about HR, benefits, policies..."
                    className="flex-1 px-5 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    disabled={isTyping}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="px-6 py-3 gradient-primary rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-glow flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Send
                  </motion.button>
                </form>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-500">
                    AI responses are generated based on company policies and best practices
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Info className="w-3 h-3" />
                    Your conversation is secure and confidential
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Layout>
      )}
    </Authenticator>
  );
}

export default AIAssistantPage;