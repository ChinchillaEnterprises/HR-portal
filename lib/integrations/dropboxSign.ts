// Dropbox Sign (HelloSign) integration stub
export interface SignatureRequest {
  title: string;
  signerEmail: string;
  fileUrl: string;
}

export async function sendForSignature(req: SignatureRequest): Promise<{ requestId: string }>{
  if (process.env.NEXT_PUBLIC_DROPBOX_SIGN_ENABLED !== '1') {
    return { requestId: `sign_disabled_${Date.now()}` };
  }
  return { requestId: `sign_${Date.now()}` };
}

