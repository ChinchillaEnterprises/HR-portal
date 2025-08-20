import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

let configured = false;
export function ensureAmplifyConfigured() {
  if (configured) return;
  try {
    Amplify.configure(outputs as any);
    configured = true;
  } catch (e) {
    // swallow in dev if outputs not ready
    console.warn('Amplify configure failed (dev):', e);
  }
}

