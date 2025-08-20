"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import AuthWrapper from "@/components/AuthWrapper";
import NeoLayout from "@/components/NeoLayout";
import { getAuthenticatedUser, hasPermission, type UserRole } from "@/lib/auth";
import {
  Mail,
  MessageSquare,
  Bell,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Filter,
  Search,
  Plus,
  X,
  FileText,
  Users,
  User,
  ChevronDown,
  Zap,
  Edit,
  Trash2,
  Copy,
} from "lucide-react";

const client = generateClient<Schema>();

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: "email" | "slack" | "notification";
  category: string;
}

const messageTemplates: MessageTemplate[] = [
  {
    id: "welcome",
    name: "Welcome Message",
    subject: "Welcome to Chinchilla!",
    content: `Dear {{firstName}},

Welcome to Chinchilla! We're thrilled to have you join our team.

Your onboarding journey begins today, and we're here to support you every step of the way. Please check your onboarding tasks and don't hesitate to reach out if you have any questions.

Best regards,
The Chinchilla Team`,
    type: "email",
    category: "onboarding",
  },
  {
    id: "task-reminder",
    name: "Task Reminder",
    subject: "Reminder: Onboarding Tasks Due Soon",
    content: `Hi {{firstName}},

This is a friendly reminder that you have {{taskCount}} onboarding tasks due soon. Please log in to the HR portal to view and complete them.

Thank you!`,
    type: "email",
    category: "reminder",
  },
  {
    id: "document-request",
    name: "Document Request",
    subject: "Action Required: Please Upload Documents",
    content: `Hello {{firstName}},

We need you to upload the following documents to complete your onboarding:
- {{documentList}}

Please upload these documents in the Document Vault section of the HR portal.

Thanks!`,
    type: "email",
    category: "documentation",
  },
  {
    id: "meeting-invite",
    name: "Meeting Invitation",
    subject: "Meeting Scheduled: {{meetingTitle}}",
    content: `Hi {{firstName}},

You have been scheduled for a meeting:

Title: {{meetingTitle}}
Date: {{meetingDate}}
Time: {{meetingTime}}
Location: {{meetingLocation}}

Please confirm your attendance.

Best regards,
{{senderName}}`,
    type: "email",
    category: "meeting",
  },
  {
    id: "slack-welcome",
    name: "Slack Welcome",
    subject: "Welcome to Slack!",
    content: `Hey {{firstName}}! 👋

Welcome to our Slack workspace! Make sure to:
- Update your profile
- Join relevant channels
- Say hi in #general

Looking forward to working with you!`,
    type: "slack",
    category: "onboarding",
  },
];

interface ComposeFormData {
  type: "email" | "slack" | "notification";
  subject: string;
  content: string;
  recipientType: "individual" | "group" | "all";
  recipientEmail?: string;
  recipientGroup?: string;
  recipientIds: string[];
  scheduledDate?: string;
  scheduledTime?: string;
  templateId?: string;
}

function CommunicationsPage({ user }: { user: any }) {
  const [communications, setCommunications] = useState<Array<Schema["Communication"]["type"]>>([]);
  const [users, setUsers] = useState<Array<Schema["User"]["type"]>>([]);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("staff");
  const [currentUserId, setCurrentUserId] = useState("");
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState<ComposeFormData>({
    type: "email",
    subject: "",
    content: "",
    recipientType: "individual",
    recipientIds: [],
    recipientEmail: "",
    recipientGroup: "",
  });

  useEffect(() => {
    fetchData();
    getUserInfo();
  }, []);

  const getUserInfo = async () => {
    const authUser = await getAuthenticatedUser();
    if (authUser) {
      setUserRole(authUser.role);
      setCurrentUserId(authUser.id);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [commsResponse, usersResponse] = await Promise.all([
        client.models.Communication.list(),
        client.models.User.list(),
      ]);
      
      const sorted = commsResponse.data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setCommunications(sorted);
      setUsers(usersResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!formData.subject || !formData.content) return;
    
    try {
      setSending(true);
      
      // Determine recipients
      let recipients: string[] = [];
      if (formData.recipientType === "individual" && formData.recipientEmail) {
        recipients = [formData.recipientEmail];
      } else if (formData.recipientType === "group") {
        recipients = formData.recipientIds;
      } else if (formData.recipientType === "all") {
        recipients = users.map(u => u.email);
      }
      
      // Schedule time
      let scheduledDateTime = null;
      if (formData.scheduledDate && formData.scheduledTime) {
        scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();
      }
      
      // Create communication records
      const promises = recipients.map(recipientEmail => {
        const recipientUser = users.find(u => u.email === recipientEmail);
        return client.models.Communication.create({
          type: formData.type,
          subject: formData.subject,
          content: formData.content,
          recipientEmail: recipientEmail,
          recipientId: recipientUser?.id || currentUserId,
          senderId: currentUserId,
          status: scheduledDateTime ? "scheduled" : "sent",
          sentDate: scheduledDateTime ? null : new Date().toISOString(),
          scheduledDate: scheduledDateTime,
        });
      });
      
      await Promise.all(promises);
      
      // Reset form
      setShowComposeModal(false);
      setFormData({
        type: "email",
        subject: "",
        content: "",
        recipientType: "individual",
        recipientIds: [],
        recipientEmail: "",
        recipientGroup: "",
      });
      setSelectedTemplate(null);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };
  
  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      type: template.type,
      subject: template.subject,
      content: template.content,
      templateId: template.id,
    });
  };
  
  const handleRecipientTypeChange = (type: "individual" | "group" | "all") => {
    setFormData({
      ...formData,
      recipientType: type,
      recipientIds: [],
      recipientEmail: "",
      recipientGroup: "",
    });
  };
  
  const filterUsersByGroup = (group: string) => {
    switch (group) {
      case "interns":
        return users.filter(u => u.role === "intern");
      case "staff":
        return users.filter(u => u.role === "staff");
      case "managers":
        return users.filter(u => ["admin", "mentor", "team_lead"].includes(u.role || ""));
      case "new_hires":
        return users.filter(u => {
          if (!u.startDate) return false;
          const daysSinceStart = (Date.now() - new Date(u.startDate).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceStart <= 30;
        });
      default:
        return [];
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-5 h-5" />;
      case "slack":
        return <MessageSquare className="w-5 h-5" />;
      case "notification":
        return <Bell className="w-5 h-5" />;
      default:
        return <Mail className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "scheduled":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "email":
        return "bg-blue-100 text-blue-700";
      case "slack":
        return "bg-purple-100 text-purple-700";
      case "notification":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredCommunications = communications.filter((comm) => {
    const matchesSearch = 
      comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.recipientEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || comm.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <NeoLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          {hasPermission(userRole, "canSendCommunications") && (
            <button 
              onClick={() => setShowComposeModal(true)}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Message
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sent Today</p>
                <p className="text-2xl font-bold">
                  {communications.filter(c => 
                    c.status === "sent" && 
                    new Date(c.sentDate || c.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold">
                  {communications.filter(c => c.status === "scheduled").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold">
                  {communications.filter(c => c.status === "failed").length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold">{communications.length}</p>
              </div>
              <Send className="w-8 h-8 text-black" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="email">Email</option>
              <option value="slack">Slack</option>
              <option value="notification">Notification</option>
            </select>
          </div>
        </div>

        {/* Communications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredCommunications.map((comm) => (
                <div key={comm.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${getTypeColor(comm.type || undefined)}`}>
                        {getTypeIcon(comm.type || undefined)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{comm.subject}</h3>
                          {getStatusIcon(comm.status || undefined)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{comm.content}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>To: {comm.recipientEmail || "User"}</span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(comm.sentDate || comm.scheduledDate || comm.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredCommunications.length === 0 && !loading && (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No communications found</p>
          </div>
        )}

        {/* Compose Modal */}
        {showComposeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Compose Message</h2>
                <button
                  onClick={() => {
                    setShowComposeModal(false);
                    setSelectedTemplate(null);
                    setFormData({
                      type: "email",
                      subject: "",
                      content: "",
                      recipientType: "individual",
                      recipientIds: [],
                      recipientEmail: "",
                      recipientGroup: "",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Templates */}
                <div className="lg:col-span-1">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Message Templates</h3>
                  <div className="space-y-2">
                    {messageTemplates.filter(t => t.type === formData.type).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedTemplate?.id === template.id
                            ? "border-black bg-gray-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{template.name}</p>
                            <p className="text-xs text-gray-500">{template.category}</p>
                          </div>
                          <FileText className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right column - Message form */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Message Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Type
                    </label>
                    <div className="flex space-x-4">
                      {["email", "slack", "notification"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setFormData({ ...formData, type: type as any })}
                          className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                            formData.type === type
                              ? "border-black bg-black text-white"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {type === "email" && <Mail className="w-4 h-4 mr-2" />}
                          {type === "slack" && <MessageSquare className="w-4 h-4 mr-2" />}
                          {type === "notification" && <Bell className="w-4 h-4 mr-2" />}
                          <span className="capitalize">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recipients */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipients
                    </label>
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        {["individual", "group", "all"].map((type) => (
                          <button
                            key={type}
                            onClick={() => handleRecipientTypeChange(type as any)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              formData.recipientType === type
                                ? "bg-black text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {type === "individual" && <User className="w-3 h-3 inline mr-1" />}
                            {type === "group" && <Users className="w-3 h-3 inline mr-1" />}
                            <span className="capitalize">{type}</span>
                          </button>
                        ))}
                      </div>

                      {formData.recipientType === "individual" && (
                        <select
                          value={formData.recipientEmail}
                          onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        >
                          <option value="">Select a recipient...</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.email}>
                              {user.firstName} {user.lastName} ({user.email})
                            </option>
                          ))}
                        </select>
                      )}

                      {formData.recipientType === "group" && (
                        <div className="space-y-2">
                          <select
                            value={formData.recipientGroup}
                            onChange={(e) => {
                              const group = e.target.value;
                              const groupUsers = filterUsersByGroup(group);
                              setFormData({
                                ...formData,
                                recipientGroup: group,
                                recipientIds: groupUsers.map(u => u.email),
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          >
                            <option value="">Select a group...</option>
                            <option value="interns">All Interns</option>
                            <option value="staff">All Staff</option>
                            <option value="managers">All Managers</option>
                            <option value="new_hires">New Hires (less than 30 days)</option>
                          </select>
                          {formData.recipientGroup && (
                            <p className="text-sm text-gray-500">
                              {formData.recipientIds.length} recipients selected
                            </p>
                          )}
                        </div>
                      )}

                      {formData.recipientType === "all" && (
                        <p className="text-sm text-gray-500">
                          This message will be sent to all {users.length} users
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter message subject..."
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message Content
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Type your message here..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available variables: {"{{firstName}}"}, {"{{lastName}}"}, {"{{email}}"}
                    </p>
                  </div>

                  {/* Schedule */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Schedule (Optional)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="date"
                        value={formData.scheduledDate || ""}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <input
                        type="time"
                        value={formData.scheduledTime || ""}
                        onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowComposeModal(false);
                        setSelectedTemplate(null);
                        setFormData({
                          type: "email",
                          subject: "",
                          content: "",
                          recipientType: "individual",
                          recipientIds: [],
                          recipientEmail: "",
                          recipientGroup: "",
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!formData.subject || !formData.content || sending || 
                        (formData.recipientType === "individual" && !formData.recipientEmail) ||
                        (formData.recipientType === "group" && formData.recipientIds.length === 0)}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {sending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {formData.scheduledDate ? "Schedule" : "Send"} Message
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </NeoLayout>
  );
}

export default function CommunicationsPageWrapper() {
  return (
    <AuthWrapper>
      {({ user }) => <CommunicationsPage user={user} />}
    </AuthWrapper>
  );
}
