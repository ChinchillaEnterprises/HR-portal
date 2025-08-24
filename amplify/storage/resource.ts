import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'hrPortalDocuments',
  access: (allow) => ({
    'documents/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read'])
    ],
    'profile-pictures/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    'resumes/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    'contracts/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    'signatures/*': [
      allow.authenticated.to(['read', 'write'])
    ]
  })
});