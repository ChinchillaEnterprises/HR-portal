// Mock authentication for demo purposes
export const mockUser = {
  username: "admin@hrportal.com",
  userId: "mock-admin-user-123",
  attributes: {
    email: "admin@hrportal.com",
    email_verified: "true",
    sub: "mock-admin-user-123",
    name: "Admin User"
  },
  signInDetails: {
    loginId: "admin@hrportal.com",
    authFlowType: "MOCK_AUTH"
  }
};

export const mockSignIn = async (email: string, password: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Accept any email/password for demo
  return {
    isSignedIn: true,
    nextStep: { signInStep: 'DONE' }
  };
};

export const mockSignOut = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {};
};

export const mockGetCurrentUser = async () => {
  return mockUser;
};

export const isRunningInAmplify = () => {
  // Check if we're running in Amplify by looking for the domain
  return typeof window !== 'undefined' && 
    window.location.hostname.includes('amplifyapp.com');
};