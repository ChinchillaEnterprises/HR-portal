"use client";

import { useState, useEffect } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import MockAuthenticator from "./MockAuthenticator";
import { isRunningInAmplify } from "@/lib/mock-auth";

interface AuthWrapperProps {
  children: (props: { user: any; signOut?: () => void }) => React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [usesMockAuth, setUsesMockAuth] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    setUsesMockAuth(isRunningInAmplify());
  }, []);

  if (!isClient) {
    return null; // Avoid hydration mismatch
  }

  if (usesMockAuth) {
    return (
      <MockAuthenticator>
        {({ user, signOut }) => children({ user, signOut })}
      </MockAuthenticator>
    );
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        user ? children({ user, signOut }) : <div>Loading...</div>
      )}
    </Authenticator>
  );
}