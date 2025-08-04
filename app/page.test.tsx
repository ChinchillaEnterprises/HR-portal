"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import Layout from "@/components/Layout";

function Dashboard({ user }: { user: any }) {
  return (
    <Layout user={user}>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <h1>Test Dashboard</h1>
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        user ? <Dashboard user={user} /> : null
      )}
    </Authenticator>
  );
}