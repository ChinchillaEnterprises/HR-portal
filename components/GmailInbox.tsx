"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Mail, 
  Inbox, 
  Send, 
  Archive, 
  Trash2, 
  Star,
  Search,
  Filter,
  RefreshCw,
  Tag,
  Clock,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut
} from "lucide-react";
import { GmailService } from "@/lib/gmailService";

interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  labels: string[];
  attachments?: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
}

interface GmailInboxProps {
  className?: string;
  embedded?: boolean;
  applicantEmail?: string;
}

export default function GmailInbox({ 
  className = "", 
  embedded = false,
  applicantEmail 
}: GmailInboxProps) {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("INBOX");
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    body: "",
  });

  useEffect(() => {
    checkSignInStatus();
  }, []);

  useEffect(() => {
    if (signedIn) {
      loadMessages();
    }
  }, [signedIn, selectedLabel, applicantEmail]);

  const checkSignInStatus = () => {
    const isSignedIn = GmailService.isSignedIn();
    setSignedIn(isSignedIn);
  };

  const handleSignIn = async () => {
    const result = await GmailService.signIn();
    if (result.success) {
      setSignedIn(true);
    } else {
      alert(`Sign in failed: ${result.error}`);
    }
  };

  const handleSignOut = async () => {
    await GmailService.signOut();
    setSignedIn(false);
    setMessages([]);
    setSelectedMessage(null);
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      let query = '';
      
      if (applicantEmail) {
        query = `from:${applicantEmail} OR to:${applicantEmail}`;
      } else if (selectedLabel !== 'ALL') {
        query = `label:${selectedLabel}`;
      }

      if (searchQuery) {
        query += ` ${searchQuery}`;
      }

      const result = await GmailService.listMessages(query, 50);
      if (result.success && result.messages) {
        setMessages(result.messages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      alert("Please fill in all fields");
      return;
    }

    const result = await GmailService.sendEmail(
      composeData.to,
      composeData.subject,
      composeData.body
    );

    if (result.success) {
      setShowCompose(false);
      setComposeData({ to: "", subject: "", body: "" });
      loadMessages();
    } else {
      alert(`Failed to send email: ${result.error}`);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    await GmailService.markAsRead(messageId);
    loadMessages();
  };

  const handleAddLabel = async (messageId: string, label: string) => {
    const result = await GmailService.addLabel(messageId, label);
    if (result.success) {
      loadMessages();
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  if (!signedIn) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`}>
        <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Gmail</h3>
        <p className="text-gray-600 mb-6">
          Sign in with Google to access your HR emails directly from the portal.
        </p>
        <button
          onClick={handleSignIn}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <LogIn className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${embedded ? '' : 'h-[600px]'} flex ${className}`}>
      {/* Sidebar */}
      {!embedded && (
        <div className="w-64 border-r border-gray-200 p-4">
          <button
            onClick={() => setShowCompose(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-4"
          >
            <Send className="w-4 h-4" />
            Compose
          </button>

          <div className="space-y-1">
            {[
              { id: 'INBOX', label: 'Inbox', icon: Inbox },
              { id: 'SENT', label: 'Sent', icon: Send },
              { id: 'DRAFT', label: 'Drafts', icon: Mail },
              { id: 'HR/Applications', label: 'Applications', icon: Tag },
              { id: 'HR/Interviews', label: 'Interviews', icon: Clock },
              { id: 'HR/Documents', label: 'Documents', icon: Paperclip },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedLabel(item.id)}
                  className={`w-full px-3 py-2 text-left rounded-lg flex items-center gap-3 transition-colors ${
                    selectedLabel === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full px-3 py-2 text-left rounded-lg flex items-center gap-3 hover:bg-gray-100 text-gray-700"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadMessages()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            onClick={loadMessages}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Messages List / Detail View */}
        <div className="flex-1 flex">
          {/* Messages List */}
          <div className={`${selectedMessage ? 'w-2/5' : 'w-full'} border-r border-gray-200 overflow-y-auto`}>
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                Loading emails...
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Inbox className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                No emails found
              </div>
            ) : (
              <div>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => {
                      setSelectedMessage(message);
                      handleMarkAsRead(message.id);
                    }}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">
                            {message.from.split('<')[0].trim()}
                          </p>
                          {message.attachments && message.attachments.length > 0 && (
                            <Paperclip className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {message.subject || '(No subject)'}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {truncateText(message.body.replace(/<[^>]*>/g, ''), 100)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 ml-2">
                        {formatDate(message.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Detail */}
          {selectedMessage && (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  {selectedMessage.subject || '(No subject)'}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <p className="text-sm text-gray-600">
                      From: <span className="text-gray-900">{selectedMessage.from}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      To: <span className="text-gray-900">{selectedMessage.to}</span>
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {selectedMessage.date.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedMessage.body }}
                />

                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Attachments ({selectedMessage.attachments.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
                        >
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{attachment.filename}</span>
                          <span className="text-xs text-gray-500">
                            ({Math.round(attachment.size / 1024)} KB)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200 flex items-center gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Reply
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Forward
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Archive className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg w-full max-w-2xl"
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">New Message</h3>
              <button
                onClick={() => setShowCompose(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Recipients"
                  value={composeData.to}
                  onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <textarea
                  rows={10}
                  placeholder="Message body..."
                  value={composeData.body}
                  onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Paperclip className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}