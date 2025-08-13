"use client";

import { useState, useEffect } from "react";
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

  // Always use mock auth to bypass Cognito issues
  return (
    <MockAuthenticator>
      {({ user, signOut }) => children({ user, signOut })}
    </MockAuthenticator>
  );
}