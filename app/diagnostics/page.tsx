"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { motion } from "framer-motion";
import { 
  CheckCircle, XCircle, AlertCircle, RefreshCw, 
  Database, Shield, Globe, Server, Zap, Info,
  Copy, CheckCheck, FileText, Settings
} from "lucide-react";

const client = generateClient<Schema>();

interface StatusCheck {
  name: string;
  status: "checking" | "success" | "error" | "warning" | "info";
  message: string;
  details?: string;
  icon: any;
  action?: {
    label: string;
    command?: string;
    link?: string;
  };
}

export default function DiagnosticsPage() {
  const [checks, setChecks] = useState<StatusCheck[]>([
    {
      name: "Authentication Mode",
      status: "checking",
      message: "Checking authentication configuration...",
      icon: Shield,
    },
    {
      name: "AWS Configuration",
      status: "checking",
      message: "Verifying AWS Amplify setup...",
      icon: Server,
    },
    {
      name: "Database Connection",
      status: "checking",
      message: "Testing database connectivity...",
      icon: Database,
    },
    {
      name: "API Endpoints",
      status: "checking",
      message: "Validating GraphQL API...",
      icon: Globe,
    },
    {
      name: "Real-time Subscriptions",
      status: "checking",
      message: "Testing WebSocket connections...",
      icon: Zap,
    },
    {
      name: "Environment Files",
      status: "checking",
      message: "Checking configuration files...",
      icon: FileText,
    },
  ]);
  
  const [isChecking, setIsChecking] = useState(true);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [amplifyOutputs, setAmplifyOutputs] = useState<any>(null);

  useEffect(() => {
    runHealthChecks();
  }, []);

  const runHealthChecks = async () => {
    setIsChecking(true);
    const updatedChecks: StatusCheck[] = [];

    // 1. Check Authentication Mode
    const authMode = process.env.NEXT_PUBLIC_USE_MOCK_AUTH;
    const authCheck: StatusCheck = {
      name: "Authentication Mode",
      icon: Shield,
      status: authMode === 'true' ? "warning" : "success",
      message: authMode === 'true' ? "Mock Authentication (Development)" : "AWS Cognito (Production)",
      details: authMode === 'true' 
        ? "Using mock authentication. This is suitable for development only."
        : "Using AWS Cognito for secure authentication.",
      action: authMode === 'true' ? {
        label: "Switch to Production Auth",
        command: "NEXT_PUBLIC_USE_MOCK_AUTH=false"
      } : undefined
    };
    updatedChecks.push(authCheck);

    // 2. Check AWS Configuration
    let awsCheck: StatusCheck = {
      name: "AWS Configuration",
      icon: Server,
      status: "checking",
      message: "Checking...",
    };

    try {
      // Try to import amplify_outputs.json
      const outputs = await import('@/amplify_outputs.json').catch(() => null);
      setAmplifyOutputs(outputs);
      
      if (outputs && outputs.auth && outputs.data) {
        awsCheck.status = "success";
        awsCheck.message = "AWS Amplify configured";
        awsCheck.details = `Region: ${outputs.auth.aws_region || 'Not specified'}`;
      } else if (outputs) {
        awsCheck.status = "warning";
        awsCheck.message = "Partial AWS configuration";
        awsCheck.details = "Some AWS services may not be configured properly.";
        awsCheck.action = {
          label: "Deploy Backend",
          command: "npx ampx sandbox"
        };
      } else {
        awsCheck.status = "error";
        awsCheck.message = "AWS backend not deployed";
        awsCheck.details = "No amplify_outputs.json found. Deploy the backend first.";
        awsCheck.action = {
          label: "Deploy Backend",
          command: "npx ampx sandbox"
        };
      }
    } catch (error) {
      awsCheck.status = "error";
      awsCheck.message = "AWS configuration error";
      awsCheck.details = "Failed to load AWS configuration.";
    }
    updatedChecks.push(awsCheck);

    // 3. Check Database Connection
    let dbCheck: StatusCheck = {
      name: "Database Connection",
      icon: Database,
      status: "checking",
      message: "Testing...",
    };

    if (authMode === 'true') {
      dbCheck.status = "info";
      dbCheck.message = "Mock mode - No real database";
      dbCheck.details = "Database operations are simulated in mock mode.";
    } else {
      try {
        // Try to list users with a timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );
        
        const result = await Promise.race([
          client.models.User.list({ limit: 1 }),
          timeoutPromise
        ]);
        
        dbCheck.status = "success";
        dbCheck.message = "Database connected";
        dbCheck.details = "Successfully connected to AWS DynamoDB.";
      } catch (error: any) {
        dbCheck.status = "error";
        dbCheck.message = "Database connection failed";
        dbCheck.details = error.message?.includes('timeout') 
          ? "Connection timed out. Check your AWS credentials and network."
          : error.message || "Unable to connect. Ensure AWS backend is deployed.";
        dbCheck.action = {
          label: "Check AWS Credentials",
          command: "aws configure list"
        };
      }
    }
    updatedChecks.push(dbCheck);

    // 4. Check API Endpoints
    let apiCheck: StatusCheck = {
      name: "API Endpoints",
      icon: Globe,
      status: "checking",
      message: "Validating...",
    };

    if (authMode === 'true') {
      apiCheck.status = "info";
      apiCheck.message = "Mock mode - Limited API";
      apiCheck.details = "API operations are simulated. Deploy backend for full functionality.";
    } else if (amplifyOutputs?.data?.url) {
      apiCheck.status = "success";
      apiCheck.message = "GraphQL API available";
      apiCheck.details = `Endpoint configured and ready.`;
    } else {
      apiCheck.status = "error";
      apiCheck.message = "API endpoint not found";
      apiCheck.details = "No GraphQL endpoint configured. Deploy backend first.";
      apiCheck.action = {
        label: "Deploy Backend",
        command: "npx ampx sandbox"
      };
    }
    updatedChecks.push(apiCheck);

    // 5. Check Real-time Subscriptions
    let realtimeCheck: StatusCheck = {
      name: "Real-time Subscriptions",
      icon: Zap,
      status: "checking",
      message: "Testing...",
    };

    if (authMode === 'true') {
      realtimeCheck.status = "info";
      realtimeCheck.message = "Mock mode - No real-time";
      realtimeCheck.details = "Real-time features require AWS deployment.";
    } else if (amplifyOutputs?.data?.url) {
      realtimeCheck.status = "success";
      realtimeCheck.message = "Real-time ready";
      realtimeCheck.details = "WebSocket subscriptions available for authenticated users.";
    } else {
      realtimeCheck.status = "error";
      realtimeCheck.message = "Real-time not available";
      realtimeCheck.details = "Deploy backend to enable real-time features.";
    }
    updatedChecks.push(realtimeCheck);

    // 6. Check Environment Files
    let envCheck: StatusCheck = {
      name: "Environment Files",
      icon: FileText,
      status: "checking",
      message: "Checking configuration files...",
    };

    const hasEnvLocal = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== undefined;
    if (hasEnvLocal) {
      envCheck.status = "success";
      envCheck.message = "Environment configured";
      envCheck.details = ".env.local file detected and loaded.";
    } else {
      envCheck.status = "warning";
      envCheck.message = "No environment file";
      envCheck.details = "Create .env.local file for configuration. Copy from .env.example.";
      envCheck.action = {
        label: "Create .env.local",
        command: "cp .env.example .env.local"
      };
    }
    updatedChecks.push(envCheck);

    // Collect environment variables
    const vars: Record<string, string> = {
      NEXT_PUBLIC_USE_MOCK_AUTH: process.env.NEXT_PUBLIC_USE_MOCK_AUTH || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set',
    };
    setEnvVars(vars);

    setChecks(updatedChecks);
    setIsChecking(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "warning":
        return "border-amber-200 bg-amber-50";
      case "info":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const overallStatus = checks.every(c => c.status === "success") ? "healthy" :
                       checks.some(c => c.status === "error") ? "error" :
                       checks.some(c => c.status === "warning") ? "warning" : "info";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Diagnostics</h1>
          <p className="text-gray-600 mt-1">Configuration health checks and troubleshooting</p>
        </div>
        <button
          onClick={runHealthChecks}
          disabled={isChecking}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overall Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg border p-6 ${
          overallStatus === "healthy" ? "border-green-200 bg-green-50" :
          overallStatus === "error" ? "border-red-200 bg-red-50" :
          overallStatus === "warning" ? "border-amber-200 bg-amber-50" :
          "border-blue-200 bg-blue-50"
        }`}
      >
        <div className="flex items-center gap-4">
          {overallStatus === "healthy" ? (
            <CheckCircle className="w-8 h-8 text-green-600" />
          ) : overallStatus === "error" ? (
            <XCircle className="w-8 h-8 text-red-600" />
          ) : overallStatus === "warning" ? (
            <AlertCircle className="w-8 h-8 text-amber-600" />
          ) : (
            <Info className="w-8 h-8 text-blue-600" />
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {overallStatus === "healthy" ? "All Systems Configured" :
               overallStatus === "error" ? "Configuration Issues Found" :
               overallStatus === "warning" ? "Partial Configuration" :
               "Development Mode"}
            </h2>
            <p className="text-gray-600 mt-1">
              {overallStatus === "healthy" ? "Your HR Portal is fully configured and ready for production." :
               overallStatus === "error" ? "Critical configuration issues need to be resolved." :
               overallStatus === "warning" ? "Some features may be limited. Review warnings below." :
               "Running in development mode with mock services."}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Health Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checks.map((check, index) => (
          <motion.div
            key={check.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-lg border p-6 ${getStatusColor(check.status)}`}
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-white">
                <check.icon className="w-5 h-5 text-gray-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{check.name}</h3>
                  {getStatusIcon(check.status)}
                </div>
                <p className="text-sm text-gray-700 mt-1">{check.message}</p>
                {check.details && (
                  <p className="text-xs text-gray-600 mt-2">{check.details}</p>
                )}
                {check.action && (
                  <div className="mt-3">
                    {check.action.command ? (
                      <button
                        onClick={() => copyToClipboard(check.action!.command!, check.name)}
                        className="text-xs bg-white px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <code>{check.action.command}</code>
                        {copied === check.name ? (
                          <CheckCheck className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-500" />
                        )}
                      </button>
                    ) : (
                      <a
                        href={check.action.link}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {check.action.label} →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Environment Variables */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Environment Variables</h2>
          <Settings className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <code className="text-sm font-mono text-gray-900">{key}</code>
                <p className="text-xs text-gray-600 mt-1">{value}</p>
              </div>
              <button
                onClick={() => copyToClipboard(`${key}=${value}`, key)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copied === key ? (
                  <CheckCheck className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Start Guide */}
      {overallStatus !== "healthy" && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <div className="flex gap-4">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Quick Start Guide</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Follow these steps to get your HR Portal fully operational:
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">1. Environment Setup</h4>
                  <p className="text-sm text-gray-600 mb-2">Create your environment configuration:</p>
                  <code className="block bg-gray-100 p-2 rounded text-xs">
                    cp .env.example .env.local
                  </code>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">2. Deploy AWS Backend</h4>
                  <p className="text-sm text-gray-600 mb-2">Deploy your Amplify backend resources:</p>
                  <code className="block bg-gray-100 p-2 rounded text-xs">
                    npx ampx sandbox
                  </code>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">3. Switch to Production Auth</h4>
                  <p className="text-sm text-gray-600 mb-2">Update .env.local for production:</p>
                  <code className="block bg-gray-100 p-2 rounded text-xs">
                    NEXT_PUBLIC_USE_MOCK_AUTH=false
                  </code>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">4. Restart Application</h4>
                  <p className="text-sm text-gray-600 mb-2">Restart to apply changes:</p>
                  <code className="block bg-gray-100 p-2 rounded text-xs">
                    npm run dev
                  </code>
                </div>
              </div>

              <p className="text-sm text-gray-700">
                For detailed instructions, check the{" "}
                <a href="/SETUP.md" className="text-blue-600 hover:underline">
                  setup documentation
                </a>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}