"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp, confirmSignUp, signIn, autoSignIn } from "aws-amplify/auth";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Layers, Shield, AlertTriangle, UserPlus } from "lucide-react";
import { InvitationService } from "@/lib/invitationService";

export default function SignUp() {
  const [step, setStep] = useState<'invitation_check' | 'signup' | 'verify'>('invitation_check');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    confirmationCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState<any>(null);
  const [invitationToken, setInvitationToken] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for invitation token on component mount
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setInvitationToken(token);
      validateInvitation(token);
    } else {
      // No token provided - show error
      setError("An invitation is required to create an account. Please check your invitation email for the correct link.");
      setStep('invitation_check');
    }
  }, [searchParams]);

  const validateInvitation = async (token: string) => {
    setLoading(true);
    setError("");

    try {
      const validation = await InvitationService.validateToken(token);
      
      if (validation.isValid && validation.invitation) {
        setInvitation(validation.invitation);
        // Pre-populate form with invitation data
        setFormData(prev => ({
          ...prev,
          email: validation.invitation.email,
          firstName: validation.invitation.firstName,
          lastName: validation.invitation.lastName,
        }));
        setStep('signup');
      } else {
        setError(validation.error || "Invalid invitation token");
        setStep('invitation_check');
      }
    } catch (error) {
      console.error('Invitation validation error:', error);
      setError("Failed to validate invitation. Please try again.");
      setStep('invitation_check');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email,
            given_name: formData.firstName,
            family_name: formData.lastName,
          },
        },
      });

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setStep('verify');
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      if (err.code === 'UsernameExistsException') {
        setError("An account with this email already exists");
      } else if (err.code === 'InvalidPasswordException') {
        setError("Password must be at least 8 characters with uppercase, lowercase, number, and symbol");
      } else {
        setError(err.message || "An error occurred during sign up");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username: formData.email,
        confirmationCode: formData.confirmationCode,
      });

      if (isSignUpComplete) {
        // Accept the invitation (creates user record with correct role)
        if (invitationToken && invitation) {
          try {
            await InvitationService.acceptInvitation(invitationToken, formData.email);
          } catch (invitationError) {
            console.error('Failed to accept invitation:', invitationError);
            // Continue anyway since the user is already created in Cognito
          }
        }

        // Try to auto sign in
        try {
          const signInResult = await autoSignIn();
          if (signInResult.isSignedIn) {
            router.push("/modern");
          }
        } catch {
          // If auto sign-in fails, redirect to login
          router.push("/login");
        }
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-lg bg-gray-900 mb-4">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Chinchilla Flow</h1>
            <p className="text-gray-600 mt-2">
              {step === 'invitation_check' && 'Invitation Required'}
              {step === 'signup' && 'Create your account'}
              {step === 'verify' && 'Verify your email'}
            </p>
          </div>

          {step === 'invitation_check' ? (
            <div className="text-center space-y-6">
              <div className="inline-flex p-4 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Valid Invitation Required
                </h2>
                <p className="text-gray-600">
                  You need a valid invitation to create an account. Please check your email for an invitation link.
                </p>
                <p className="text-sm text-gray-500">
                  If you believe you should have access, please contact your administrator.
                </p>
              </div>
              
              <button
                onClick={() => router.push('/login')}
                className="w-full py-2 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Return to Login
              </button>
            </div>
          ) : step === 'signup' ? (
            <div className="space-y-6">
              {/* Invitation Success Message */}
              {invitation && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Invitation Validated
                      </p>
                      <p className="text-xs text-green-600">
                        You're invited as {invitation.role} {invitation.department ? `in ${invitation.department}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="John"
                      readOnly={!!invitation}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Doe"
                    readOnly={!!invitation}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="you@example.com"
                    readOnly={!!invitation}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  At least 8 characters with uppercase, lowercase, number & symbol
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleVerification} className="space-y-5">
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-full bg-green-100 mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">
                  We've sent a verification code to <strong>{formData.email}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification code
                </label>
                <input
                  type="text"
                  value={formData.confirmationCode}
                  onChange={(e) => setFormData({ ...formData, confirmationCode: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-center text-lg font-mono"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Verify email"
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="text-gray-900 hover:underline font-medium">
                Sign in
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}