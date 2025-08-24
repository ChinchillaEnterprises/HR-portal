"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Mail,
  MessageSquare,
  FileText,
  Calendar,
  Users,
  Database,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Link,
  Zap
} from "lucide-react";
import GmailInbox from "@/components/GmailInbox";
import SlackIntegration from "@/components/SlackIntegration";
import NotionIntegration from "@/components/NotionIntegration";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'connected' | 'disconnected' | 'error';
  color: string;
  setupUrl?: string;
  docsUrl?: string;
}

export default function IntegrationsPage() {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Manage HR emails directly from the portal',
      icon: Mail,
      status: 'disconnected',
      color: 'red',
      docsUrl: '/docs/GMAIL_SETUP.md',
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Send notifications and updates to your team',
      icon: MessageSquare,
      status: 'disconnected',
      color: 'purple',
      docsUrl: '/docs/SLACK_SETUP.md',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      description: 'Import candidate profiles and post jobs',
      icon: Link,
      status: 'disconnected',
      color: 'blue',
      docsUrl: '/docs/LINKEDIN_SETUP.md',
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Sync applicants and create collaborative workflows',
      icon: Database,
      status: 'disconnected',
      color: 'gray',
      docsUrl: '/docs/NOTION_SETUP.md',
    },
    {
      id: 'dropbox-sign',
      name: 'Dropbox Sign',
      description: 'Send documents for e-signature',
      icon: FileText,
      status: 'disconnected',
      color: 'blue',
      setupUrl: '/api/signatures/setup',
    },
    {
      id: 'calendar',
      name: 'Calendar',
      description: 'Schedule interviews and meetings',
      icon: Calendar,
      status: 'connected',
      color: 'green',
    },
  ]);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    // Check Gmail
    const gmailConnected = localStorage.getItem('gmail_connected') === 'true';
    
    // Check Slack
    const slackResponse = await fetch('/api/slack/setup');
    const slackData = await slackResponse.json();
    
    // Check Notion
    const notionConnected = localStorage.getItem('notion_api_key') !== null;
    
    // Check Dropbox Sign
    const dropboxResponse = await fetch('/api/signatures/setup');
    const dropboxData = await dropboxResponse.json();

    setIntegrations(prev => prev.map(integration => {
      switch (integration.id) {
        case 'gmail':
          return { ...integration, status: gmailConnected ? 'connected' : 'disconnected' };
        case 'slack':
          return { ...integration, status: slackData.success ? 'connected' : 'disconnected' };
        case 'notion':
          return { ...integration, status: notionConnected ? 'connected' : 'disconnected' };
        case 'dropbox-sign':
          return { ...integration, status: dropboxData.configured ? 'connected' : 'disconnected' };
        case 'linkedin':
          return { ...integration, status: localStorage.getItem('linkedin_token') ? 'connected' : 'disconnected' };
        default:
          return integration;
      }
    }));
  };

  const renderIntegrationDetail = () => {
    switch (selectedIntegration) {
      case 'gmail':
        return <GmailInbox className="h-[600px]" />;
      case 'slack':
        return <SlackIntegration />;
      case 'notion':
        return <NotionIntegration />;
      case 'linkedin':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">LinkedIn Integration</h3>
            <p className="text-gray-600 mb-4">
              LinkedIn integration allows you to import candidate profiles and streamline your recruitment process.
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Features:</h4>
                <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                  <li>Import candidate profiles directly from LinkedIn</li>
                  <li>Verify LinkedIn profile URLs</li>
                  <li>Extract LinkedIn URLs from resumes</li>
                  <li>Share job postings on LinkedIn</li>
                </ul>
              </div>
              <a
                href="/docs/LINKEDIN_SETUP.md"
                target="_blank"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                View Setup Guide
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        );
      case 'dropbox-sign':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dropbox Sign Integration</h3>
            <p className="text-gray-600 mb-4">
              Send documents for e-signature directly from the portal.
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Status:</h4>
                <p className="text-sm text-green-700">
                  {integrations.find(i => i.id === 'dropbox-sign')?.status === 'connected'
                    ? '✅ Connected and ready to use'
                    : '⚠️ Not configured - Add DROPBOX_SIGN_API_KEY to environment variables'}
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/api/signatures/setup'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Check Configuration
              </button>
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendar Integration</h3>
            <p className="text-gray-600 mb-4">
              Built-in calendar functionality for scheduling interviews and meetings.
            </p>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                ✅ Calendar is integrated and available in the portal
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-600">Select an integration to view details</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-600" />
            Integrations
          </h1>
          <p className="mt-2 text-gray-600">
            Connect your favorite tools to streamline your HR workflow
          </p>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <motion.div
                key={integration.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedIntegration(integration.id)}
                className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all ${
                  selectedIntegration === integration.id
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${integration.color}-100`}>
                    <Icon className={`w-6 h-6 text-${integration.color}-600`} />
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      integration.status === 'connected'
                        ? 'bg-green-100 text-green-700'
                        : integration.status === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {integration.status === 'connected' ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {integration.name}
                </h3>
                <p className="text-sm text-gray-600">{integration.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Integration Detail */}
        {selectedIntegration && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            {renderIntegrationDetail()}
          </motion.div>
        )}

        {/* All Integrations Summary */}
        <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Integration Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Connected</h3>
              <div className="space-y-2">
                {integrations
                  .filter(i => i.status === 'connected')
                  .map(integration => {
                    const Icon = integration.icon;
                    return (
                      <div
                        key={integration.id}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <Icon className="w-4 h-4" />
                        {integration.name}
                      </div>
                    );
                  })}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Available to Connect</h3>
              <div className="space-y-2">
                {integrations
                  .filter(i => i.status !== 'connected')
                  .map(integration => {
                    const Icon = integration.icon;
                    return (
                      <div
                        key={integration.id}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                        <Icon className="w-4 h-4" />
                        {integration.name}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Need Help?
          </h3>
          <p className="text-blue-700 mb-4">
            Check our documentation for detailed setup guides and troubleshooting tips.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="/docs"
              className="text-blue-600 hover:text-blue-700 underline text-sm"
            >
              View Documentation
            </a>
            <a
              href="mailto:support@chinchilla.ai"
              className="text-blue-600 hover:text-blue-700 underline text-sm"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}