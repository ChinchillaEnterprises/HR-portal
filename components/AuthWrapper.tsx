"use client";

import { useState, useEffect } from "react";
import { Authenticator } from '@aws-amplify/ui-react';
import MockAuthenticator from "./MockAuthenticator";

interface AuthWrapperProps {
  children: (props: { user: any; signOut?: () => void }) => React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Avoid hydration mismatch
  }

  // Check if we should use mock auth (for development/demo)
  const useMockAuth = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

  if (useMockAuth) {
    return (
      <MockAuthenticator>
        {({ user, signOut }) => children({ user, signOut })}
      </MockAuthenticator>
    );
  }

  // Use real AWS Amplify authentication in production
  return (
    <Authenticator>
      {({ user, signOut }) => children({ user, signOut })}
    </Authenticator>
  );
}