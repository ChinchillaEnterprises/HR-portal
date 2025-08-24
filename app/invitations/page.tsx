"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  UserPlus, Mail, Clock, CheckCircle, XCircle, 
  RefreshCw, Send, Trash2, AlertTriangle,
  Calendar, User, Briefcase, Building
} from "lucide-react";
import { InvitationService } from "@/lib/invitationService";
import { useAuth } from "@/contexts/AuthContext";
import PermissionGate from "@/components/PermissionGate";
import { PERMISSIONS } from "@/lib/auth/rbac";

interface Invitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  position?: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  reminderSentAt?: string;
  note?: string;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await InvitationService.getAllInvitations();
      setInvitations(data);
      setError("");
    } catch (error) {
      console.error("Failed to load invitations:", error);
      setError("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    if (!user?.email) return;
    
    setActionLoading(invitationId);
    try {
      const result = await InvitationService.resendInvitation(invitationId, user.email);
      if (result.success) {
        await loadInvitations(); // Reload to get updated reminderSentAt
      } else {
        setError(result.error || "Failed to resend invitation");
      }
    } catch (error) {
      console.error("Failed to resend invitation:", error);
      setError("Failed to resend invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!user?.email) return;
    
    setActionLoading(invitationId);
    try {
      const result = await InvitationService.cancelInvitation(invitationId, user.email);
      if (result.success) {
        await loadInvitations(); // Reload to show cancelled status
      } else {
        setError(result.error || "Failed to cancel invitation");
      }
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
      setError("Failed to cancel invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "accepted":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "expired":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "accepted":
        return "bg-green-100 text-green-700";
      case "expired":
        return "bg-red-100 text-red-700";
      case "cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiration = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiration <= 24 && hoursUntilExpiration > 0;
  };

  if (loading && invitations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-blue-600" />
            User Invitations
          </h1>
          <p className="mt-2 text-gray-600">
            Manage pending invitations and track invitation status
          </p>
        </div>

        <PermissionGate
          permission={PERMISSIONS.USERS_MANAGE}
          fallback={
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600">
                You don't have permission to manage user invitations.
              </p>
            </div>
          }
        >
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  All Invitations ({invitations.length})
                </h2>
              </div>
              <button
                onClick={loadInvitations}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Invitations List */}
          <div className="space-y-4">
            {invitations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Invitations Found
                </h3>
                <p className="text-gray-600">
                  When you invite new users, they'll appear here.
                </p>
              </div>
            ) : (
              invitations.map((invitation) => (
                <motion.div
                  key={invitation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <h3 className="font-semibold text-gray-900">
                            {invitation.firstName} {invitation.lastName}
                          </h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(invitation.status)}`}>
                          {getStatusIcon(invitation.status)}
                          {invitation.status}
                        </span>
                        {invitation.status === "pending" && isExpiringSoon(invitation.expiresAt) && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Expires Soon
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {invitation.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          {invitation.role}
                        </div>
                        {invitation.department && (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            {invitation.department}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Expires: {formatDate(invitation.expiresAt)}
                        </div>
                      </div>

                      {invitation.note && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 italic">"{invitation.note}"</p>
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-500">
                        Invited by {invitation.invitedBy} on {formatDate(invitation.invitedAt)}
                        {invitation.reminderSentAt && (
                          <span className="ml-2">• Reminder sent {formatDate(invitation.reminderSentAt)}</span>
                        )}
                        {invitation.acceptedAt && (
                          <span className="ml-2">• Accepted {formatDate(invitation.acceptedAt)}</span>
                        )}
                      </div>
                    </div>

                    {invitation.status === "pending" && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleResendInvitation(invitation.id)}
                          disabled={actionLoading === invitation.id}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Resend invitation"
                        >
                          {actionLoading === invitation.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCancelInvitation(invitation.id)}
                          disabled={actionLoading === invitation.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </PermissionGate>
      </div>
    </div>
  );
}