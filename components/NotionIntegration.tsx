"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Database, 
  Sync, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Search,
  User,
  Calendar,
  Tag,
  ExternalLink,
  BookOpen,
  Loader2,
  Settings
} from "lucide-react";
import { NotionService } from "@/lib/notionService";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

interface NotionIntegrationProps {
  applicantId?: string;
  onSync?: () => void;
}

export default function NotionIntegration({ 
  applicantId,
  onSync 
}: NotionIntegrationProps) {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [databases, setDatabases] = useState<any[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [showSetup, setShowSetup] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [syncStatus, setSyncStatus] = useState<{
    success?: boolean;
    message?: string;
    pageUrl?: string;
  }>({});

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const key = localStorage.getItem('notion_api_key');
    if (key) {
      NotionService.initialize({ apiKey: key });
      const result = await NotionService.testConnection();
      setConnected(result.success);
      if (result.success) {
        loadDatabases();
      }
    }
  };

  const handleSetup = async () => {
    if (!apiKey) {
      setSyncStatus({ success: false, message: "Please enter an API key" });
      return;
    }

    setLoading(true);
    try {
      // Save API key
      localStorage.setItem('notion_api_key', apiKey);
      NotionService.initialize({ apiKey });

      // Test connection
      const result = await NotionService.testConnection();
      if (result.success) {
        setConnected(true);
        setShowSetup(false);
        setSyncStatus({ success: true, message: "Connected to Notion!" });
        
        // Create HR database
        const dbResult = await NotionService.createHRDatabase();
        if (dbResult.success) {
          setSelectedDatabase(dbResult.databaseId!);
          loadDatabases();
        }
      } else {
        setSyncStatus({ success: false, message: result.error });
      }
    } catch (error) {
      setSyncStatus({ 
        success: false, 
        message: error instanceof Error ? error.message : "Connection failed" 
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDatabases = async () => {
    const result = await NotionService.listDatabases();
    if (result.success && result.databases) {
      setDatabases(result.databases);
    }
  };

  const handleSyncApplicant = async () => {
    if (!applicantId) return;

    setSyncing(true);
    try {
      const result = await NotionService.syncApplicant(applicantId);
      if (result.success) {
        setSyncStatus({
          success: true,
          message: "Applicant synced to Notion!",
          pageUrl: result.pageUrl,
        });
        if (onSync) onSync();
      } else {
        setSyncStatus({
          success: false,
          message: result.error || "Sync failed",
        });
      }
    } catch (error) {
      setSyncStatus({
        success: false,
        message: error instanceof Error ? error.message : "Sync failed",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAllApplicants = async () => {
    setSyncing(true);
    try {
      const applicants = await client.models.Applicant.list();
      let syncedCount = 0;
      let failedCount = 0;

      for (const applicant of applicants.data || []) {
        const result = await NotionService.syncApplicant(applicant.id);
        if (result.success) {
          syncedCount++;
        } else {
          failedCount++;
        }
      }

      setSyncStatus({
        success: failedCount === 0,
        message: `Synced ${syncedCount} applicants${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      });
    } catch (error) {
      setSyncStatus({
        success: false,
        message: error instanceof Error ? error.message : "Sync failed",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateTask = async (title: string, details: any) => {
    setLoading(true);
    try {
      const result = await NotionService.createTask(title, details);
      if (result.success) {
        setSyncStatus({
          success: true,
          message: "Task created in Notion!",
          pageUrl: result.pageUrl,
        });
      } else {
        setSyncStatus({
          success: false,
          message: result.error || "Failed to create task",
        });
      }
    } catch (error) {
      setSyncStatus({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create task",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect to Notion
          </h3>
          <p className="text-gray-600 mb-4">
            Sync applicants and create tasks in your Notion workspace
          </p>
          <button
            onClick={() => setShowSetup(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Setup Notion Integration
          </button>
        </div>

        {showSetup && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Setup Instructions:</h4>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1 mb-4">
              <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Notion Integrations</a></li>
              <li>Click "New integration"</li>
              <li>Name it "Chinchilla HR Portal"</li>
              <li>Select your workspace</li>
              <li>Copy the "Internal Integration Token"</li>
            </ol>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notion API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="secret_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={handleSetup}
                disabled={loading || !apiKey}
                className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect to Notion"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Notion Integration</h3>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            Connected
          </span>
        </div>
        <button
          onClick={() => setShowSetup(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {syncStatus.message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
            syncStatus.success
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {syncStatus.success ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm">{syncStatus.message}</p>
            {syncStatus.pageUrl && (
              <a
                href={syncStatus.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline hover:no-underline mt-1 inline-flex items-center gap-1"
              >
                View in Notion
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {/* Sync Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applicantId && (
            <button
              onClick={handleSyncApplicant}
              disabled={syncing}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  Sync This Applicant
                </>
              )}
            </button>
          )}
          
          <button
            onClick={handleSyncAllApplicants}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Sync className="w-4 h-4" />
                Sync All Applicants
              </>
            )}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => {
                const title = prompt("Task title:");
                if (title) {
                  handleCreateTask(title, {
                    priority: 'medium',
                    tags: ['HR'],
                  });
                }
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
            
            <button
              onClick={() => {
                window.open('https://notion.so', '_blank');
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Notion
            </button>
          </div>
        </div>

        {/* Database Info */}
        {databases.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Connected Databases ({databases.length})
            </h4>
            <div className="space-y-1">
              {databases.slice(0, 3).map((db) => (
                <div
                  key={db.id}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <BookOpen className="w-4 h-4" />
                  {db.title}
                </div>
              ))}
              {databases.length > 3 && (
                <p className="text-sm text-gray-500">
                  And {databases.length - 3} more...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Notion Settings
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={apiKey || localStorage.getItem('notion_api_key') || ''}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="secret_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSetup(false);
                  setApiKey("");
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('notion_api_key');
                  setConnected(false);
                  setShowSetup(false);
                  setSyncStatus({ success: true, message: "Disconnected from Notion" });
                }}
                className="px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
              >
                Disconnect
              </button>
              <button
                onClick={handleSetup}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}