"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  Inbox, Send, Search, RefreshCw, Mail, 
  Paperclip, Star, Archive, Trash2, 
  ChevronLeft, Filter, Plus 
} from "lucide-react";
import ComposeEmail from "@/components/ComposeEmail";

interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: Date;
  isRead: boolean;
  hasAttachments: boolean;
}

export default function EmailCommunication() {
  const { data: session, status } = useSession();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'unread' | 'sent'>('all');
  const [showCompose, setShowCompose] = useState(false);

  // Mock data for now - will be replaced with Gmail API
  const mockEmails: EmailMessage[] = [
    {
      id: '1',
      from: 'hr@chinchilla.ai',
      subject: 'Welcome to Chinchilla AI!',
      snippet: 'We are excited to have you join our team. Please find attached your onboarding documents...',
      date: new Date('2024-01-20'),
      isRead: false,
      hasAttachments: true,
    },
    {
      id: '2',
      from: 'it@chinchilla.ai',
      subject: 'Your workstation is ready',
      snippet: 'Hi! Your laptop and development environment have been set up. You can pick it up from...',
      date: new Date('2024-01-19'),
      isRead: true,
      hasAttachments: false,
    },
    {
      id: '3',
      from: 'mentor@chinchilla.ai',
      subject: 'Introduction - Your Mentor',
      snippet: 'Hello! I will be your mentor during your onboarding process. Let\'s schedule a meeting...',
      date: new Date('2024-01-18'),
      isRead: true,
      hasAttachments: false,
    },
  ];

  useEffect(() => {
    // For now, use mock data
    setEmails(mockEmails);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleCompose = () => {
    setShowCompose(true);
  };

  const handleSendEmail = async (to: string, subject: string, body: string) => {
    // TODO: Implement actual email sending with Gmail API
    console.log('Sending email:', { to, subject, body });
    // For now, just add to the list
    const newEmail: EmailMessage = {
      id: Date.now().toString(),
      from: 'me@chinchilla.ai',
      subject,
      snippet: body.substring(0, 100) + '...',
      date: new Date(),
      isRead: true,
      hasAttachments: false,
    };
    setEmails([newEmail, ...emails]);
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.from.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !email.isRead) ||
                         (filter === 'sent' && email.from.includes('@chinchilla.ai'));
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Email & Communication</h1>
        <p className="text-gray-600 mt-1">Manage your emails and communications</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 h-[calc(100%-6rem)] flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 p-4">
          <button
            onClick={handleCompose}
            data-testid="compose-email-button"
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mb-6"
          >
            <Plus className="w-4 h-4" />
            Compose
          </button>

          <nav className="space-y-1">
            <button
              onClick={() => setFilter('all')}
              data-testid="filter-all"
              className={`w-full px-3 py-2 text-left rounded-lg flex items-center gap-3 transition-colors ${
                filter === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Inbox</span>
              <span className="ml-auto text-sm text-gray-500">{emails.length}</span>
            </button>
            <button
              onClick={() => setFilter('unread')}
              data-testid="filter-unread"
              className={`w-full px-3 py-2 text-left rounded-lg flex items-center gap-3 transition-colors ${
                filter === 'unread' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Unread</span>
              <span className="ml-auto text-sm text-gray-500">
                {emails.filter(e => !e.isRead).length}
              </span>
            </button>
            <button
              onClick={() => setFilter('sent')}
              data-testid="filter-sent"
              className={`w-full px-3 py-2 text-left rounded-lg flex items-center gap-3 transition-colors ${
                filter === 'sent' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Sent</span>
            </button>
          </nav>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <button className="w-full px-3 py-2 text-left text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors">
              <Archive className="w-4 h-4" />
              <span>Archive</span>
            </button>
            <button className="w-full px-3 py-2 text-left text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors">
              <Trash2 className="w-4 h-4" />
              <span>Trash</span>
            </button>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 flex">
          <div className="w-96 border-r border-gray-200">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search emails..."
                  className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  onClick={handleRefresh}
                  data-testid="refresh-emails"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Email List */}
            <div className="overflow-y-auto h-[calc(100%-73px)]">
              {filteredEmails.map((email, index) => (
                <motion.button
                  key={email.id}
                  data-testid={`email-item-${email.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedEmail(email)}
                  className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedEmail?.id === email.id ? 'bg-gray-50' : ''
                  } ${!email.isRead ? 'font-semibold' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      email.isRead ? 'bg-gray-300' : 'bg-blue-600'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-900 truncate">{email.from}</p>
                        <p className="text-xs text-gray-500 ml-2">
                          {email.date.toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-900 truncate mb-1">{email.subject}</p>
                      <p className="text-xs text-gray-600 truncate">{email.snippet}</p>
                      {email.hasAttachments && (
                        <div className="flex items-center gap-1 mt-1">
                          <Paperclip className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">Attachment</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Email Preview */}
          <div className="flex-1 flex flex-col">
            {selectedEmail ? (
              <>
                {/* Email Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-2">
                      <button data-testid="star-email" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Star className="w-4 h-4 text-gray-600" />
                      </button>
                      <button data-testid="archive-email" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Archive className="w-4 h-4 text-gray-600" />
                      </button>
                      <button data-testid="trash-email" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedEmail.from}</p>
                      <p className="text-xs text-gray-500">
                        {selectedEmail.date.toLocaleString()}
                      </p>
                    </div>
                    <button data-testid="reply-email" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm">
                      Reply
                    </button>
                  </div>
                </div>

                {/* Email Body */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedEmail.snippet}</p>
                  {selectedEmail.hasAttachments && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-2">Attachments</p>
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">onboarding-documents.pdf</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select an email to view</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compose Email Modal */}
      <ComposeEmail
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onSend={handleSendEmail}
      />
    </div>
  );
}