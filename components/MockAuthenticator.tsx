"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, User, Shield, AlertCircle, Check } from "lucide-react";
import { mockSignIn, mockUser, isRunningInAmplify } from "@/lib/mock-auth";

interface MockAuthenticatorProps {
  children: (props: { user: any; signOut: () => void }) => React.ReactNode;
}

export default function MockAuthenticator({ children }: MockAuthenticatorProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Auto-sign in for demo if in Amplify
    if (isRunningInAmplify()) {
      const savedAuth = sessionStorage.getItem('mockAuth');
      if (savedAuth === 'true') {
        setIsSignedIn(true);
      }
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await mockSignIn(email, password);
      setShowSuccess(true);
      sessionStorage.setItem('mockAuth', 'true');
      setTimeout(() => {
        setIsSignedIn(true);
      }, 1500);
    } catch (err) {
      setError("Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('mockAuth');
    setIsSignedIn(false);
    setEmail("");
    setPassword("");
    setShowSuccess(false);
  };

  if (isSignedIn) {
    return <>{children({ user: mockUser, signOut: handleSignOut })}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gradient mb-2">Welcome to HR Portal</h2>
            <p className="text-gray-600">AI-Powered Human Resources Management</p>
          </div>

          {isRunningInAmplify() && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900">Demo Mode</p>
                  <p className="text-amber-700 mt-1">
                    Sign in with any email and password to explore the app. 
                    No data will be saved.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter any password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 gradient-primary text-white font-medium rounded-xl shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : showSuccess ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  Success! Redirecting...
                </span>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Demo credentials work with any email/password combination
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center text-sm text-gray-500"
        >
          <p>Powered by AI • Built with Next.js & AWS Amplify</p>
        </motion.div>
      </motion.div>
    </div>
  );
}