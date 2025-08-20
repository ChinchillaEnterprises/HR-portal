// Gmail integration stub (no network). Replace with real API calls later.
export interface GmailMessage {
  to: string;
  subject: string;
  html: string;
}

export async function sendGmail(msg: GmailMessage): Promise<{ id: string }> {
  // Mock behavior only when enabled
  if (process.env.NEXT_PUBLIC_GMAIL_ENABLED !== '1') {
    return { id: `gmail_disabled_${Date.now()}` };
  }
  // In production, exchange OAuth tokens and call Gmail API
  return { id: `gmail_${Date.now()}` };
}

