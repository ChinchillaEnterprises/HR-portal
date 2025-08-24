# Chinchilla Flow Portal 🚀

A modern, AI-powered HR operations platform built with Next.js, AWS Amplify, and TypeScript. Designed to streamline hiring, onboarding, document management, and team communications.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![AWS Amplify](https://img.shields.io/badge/AWS-Amplify-orange)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

### Core HR Modules
- **📊 Dashboard** - Real-time analytics and system overview
- **👥 Applicant Tracking** - Complete hiring pipeline management
- **📋 Onboarding Automation** - Customizable workflows with task tracking
- **📄 Document Management** - Secure storage with e-signature integration
- **📧 Email & Communication** - Unified inbox with automated templates
- **👨‍👩‍👧‍👦 Team Directory** - Employee profiles and contact management
- **📈 Reports & Analytics** - Export-ready insights and performance metrics

### 🔐 Security & Compliance
- **Invitation-Only Access** - Secure token-based user registration system
- **Role-Based Access Control (RBAC)** - 6 hierarchical permission levels
- **Audit Logging** - Complete activity tracking and compliance reporting
- **Secure Document Storage** - AWS S3 with encryption
- **Session Management** - Secure authentication with NextAuth.js
- **Invitation Management** - Admin interface for managing user invitations

### 🔌 Integrations
- **Gmail API** - Full email management and automation
- **Dropbox Sign** - Document e-signature workflows
- **LinkedIn API** - Profile import and candidate sourcing
- **Slack** - Team notifications and updates
- **Notion** - Collaborative workspace sync

### 🤖 AI Features
- **Smart Applicant Analysis** - AI-powered candidate evaluation
- **Resume Parsing** - Automatic skill and experience extraction
- **Intelligent Recommendations** - Data-driven hiring insights

### ⚡ Performance Optimizations
- **Lazy Loading** - Optimized component rendering
- **Caching Layer** - In-memory cache for frequent operations
- **Infinite Scroll** - Efficient data pagination
- **Real-time Updates** - GraphQL subscriptions
- **Performance Monitoring** - Built-in metrics dashboard

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization

### Backend
- **AWS Amplify Gen2** - Serverless backend
- **GraphQL API** - AWS AppSync
- **DynamoDB** - NoSQL database
- **AWS Lambda** - Serverless functions
- **AWS S3** - File storage
- **AWS SES** - Email service

### Authentication & Security
- **NextAuth.js** - Authentication framework
- **AWS Cognito** - User management
- **Google OAuth** - Social login

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- AWS Account
- Google Cloud Console access (for Gmail integration)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/chinchilla-ai/hr-portal.git
cd hr-portal
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Update `.env.local` with your credentials:
```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AWS (optional - Amplify will auto-configure)
AWS_REGION=us-east-1

# Integrations
DROPBOX_SIGN_API_KEY=your-dropbox-sign-key
SLACK_BOT_TOKEN=xoxb-your-slack-token
NOTION_API_KEY=secret_your-notion-key

# Email Service
NEXT_PUBLIC_USE_AWS_SES=false # Set to true for production
```

4. **Initialize Amplify backend**
```bash
npx ampx sandbox
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### First Time Setup

**Important**: This application uses an invitation-only registration system for security.

1. **Initial Admin Access**: Use the demo credentials to log in as an administrator:
   - Email: `admin@chinchilla.ai`
   - Password: `Test123!`

2. **Invite New Users**: Once logged in as admin:
   - Go to "People" → Add new team member
   - Fill in their details and role
   - System automatically sends invitation email
   - New users must use the invitation link to create their account

3. **No Open Registration**: Users cannot sign up without a valid invitation token.

## 🔧 Troubleshooting

### System Diagnostics

If you encounter issues with the application, use the built-in diagnostics page:

1. **Access Diagnostics**: Navigate to `/diagnostics` or click "Diagnostics" in the sidebar
2. **Review Health Checks**: The page shows the status of:
   - Authentication mode (Mock vs AWS Cognito)
   - AWS configuration status
   - Database connectivity
   - API endpoints
   - Real-time subscriptions
   - Environment file configuration

3. **Common Issues**:
   - **"Most functionalities not working"**: Check if you're in mock mode (NEXT_PUBLIC_USE_MOCK_AUTH=true)
   - **Database connection failed**: Deploy AWS backend with `npx ampx sandbox`
   - **Authentication errors**: Ensure correct auth mode for your environment
   - **Missing environment variables**: Copy `.env.example` to `.env.local`

4. **Quick Fix Commands**:
   ```bash
   # Create environment file
   cp .env.example .env.local
   
   # Deploy AWS backend
   npx ampx sandbox
   
   # Switch to production auth
   # Edit .env.local: NEXT_PUBLIC_USE_MOCK_AUTH=false
   
   # Restart application
   npm run dev
   ```

For detailed setup instructions, see [SETUP.md](SETUP.md).

## 📁 Project Structure

```
hr-portal/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (auth)/           # Authentication pages
│   └── (dashboard)/      # Main app pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── features/         # Feature-specific components
├── lib/                   # Utility functions and services
│   ├── auth/             # Authentication utilities
│   ├── performance/      # Performance monitoring
│   └── integrations/     # Third-party integrations
├── amplify/              # AWS Amplify configuration
│   ├── auth/             # Cognito setup
│   ├── data/             # GraphQL schema
│   └── storage/          # S3 configuration
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
└── public/               # Static assets
```

## 🔑 User Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Super Admin** | System administrator | All permissions |
| **Admin** | HR administrator | Manage users, full data access |
| **HR Manager** | HR team lead | Manage applicants, reports |
| **HR Staff** | HR team member | View/edit applicants |
| **Interviewer** | Interview panel | View assigned applicants |
| **Viewer** | Read-only access | View data only |

## 📚 Documentation

### Setting Up Integrations
- [Gmail Setup Guide](docs/GMAIL_SETUP.md)
- [Slack Setup Guide](docs/SLACK_SETUP.md)
- [LinkedIn Setup Guide](docs/LINKEDIN_SETUP.md)
- [Notion Setup Guide](docs/NOTION_SETUP.md)

### Development Guides
- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## 📦 Deployment

### Deploy to AWS Amplify

1. **Create production branch**
```bash
git checkout -b production
```

2. **Deploy backend**
```bash
npx ampx pipeline-deploy --branch production --app-id YOUR_APP_ID
```

3. **Configure environment variables in Amplify Console**

4. **Deploy frontend**
```bash
git push origin production
```

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chinchilla-ai/hr-portal)

## 🔒 Security Features

### Invitation-Only Registration
- **No Open Signup**: Users cannot create accounts without a valid invitation
- **Secure Tokens**: Cryptographically secure invitation tokens with expiration
- **Role Pre-Assignment**: Users automatically get correct roles from invitations
- **Email Verification**: Built-in email verification through Cognito

### Access Control
- **6-Tier RBAC**: Super Admin, Admin, HR Manager, HR Staff, Interviewer, Viewer
- **Permission Gates**: UI components restricted based on user permissions
- **Audit Trail**: Complete logging of all user actions and system events

### Data Protection
- **Encrypted Storage**: All documents encrypted in AWS S3
- **Session Security**: Secure session management with automatic expiration
- **API Security**: All GraphQL endpoints protected with authentication

### Admin Security Tools
- **Invitation Management**: Track and manage all pending/expired invitations
- **User Status Control**: Activate/deactivate users instantly
- **Audit Logs**: Real-time monitoring of all system activities

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Known Issues & Limitations

- Lambda functions require manual deployment configuration
- Email sending only works in production with AWS SES configured (development mode simulates emails)
- Some integrations require paid API access (LinkedIn, Dropbox Sign)
- Mobile app views are responsive but not yet PWA-optimized
- Demo admin credentials should be changed in production

## 🗺️ Roadmap

### Week 1: Foundation & Core Setup ✅
- [x] Next.js 14 App Router setup with TypeScript
- [x] AWS Amplify Gen2 backend configuration
- [x] DynamoDB schema design and implementation
- [x] NextAuth.js with Google OAuth integration
- [x] Basic UI components with Tailwind CSS
- [x] User authentication flow (sign up, sign in, sign out)
- [x] Role-based access control (RBAC) foundation

### Week 2-3: Core HR Modules ✅
- [x] **Applicant Management**
  - [x] CRUD operations for applicants
  - [x] Application status workflow
  - [x] Resume upload to S3
  - [x] Applicant search and filtering
- [x] **Document Management**
  - [x] File upload/download with S3
  - [x] Document categorization
  - [x] Access control per document
  - [x] E-signature integration (Dropbox Sign)
- [x] **Team Directory**
  - [x] Employee profiles
  - [x] Organizational structure
  - [x] Contact information management

### Week 4-5: Communication & Automation ✅
- [x] **Email Integration**
  - [x] AWS SES configuration
  - [x] Email templates (offer letters, rejections, etc.)
  - [x] Bulk email functionality
  - [x] Email tracking and analytics
- [x] **Calendar Integration**
  - [x] Interview scheduling
  - [x] Calendar event management
  - [x] Reminder notifications
- [x] **Onboarding Automation**
  - [x] Customizable onboarding workflows
  - [x] Task assignment and tracking
  - [x] Progress monitoring
  - [x] Automated reminders

### Week 6-7: Analytics & Integrations ✅
- [x] **Reporting Dashboard**
  - [x] Hiring funnel analytics
  - [x] Time-to-hire metrics
  - [x] Source effectiveness
  - [x] Custom report builder
  - [x] PDF export functionality
- [x] **Third-party Integrations**
  - [x] Gmail API for email sync
  - [x] LinkedIn API for profile import
  - [x] Slack for notifications
  - [x] Notion for documentation sync

### Week 8-9: Advanced Features ✅
- [x] **AI-Powered Features**
  - [x] Smart candidate matching
  - [x] Resume keyword extraction
  - [x] Automated screening suggestions
- [x] **Performance Optimization**
  - [x] Lazy loading implementation
  - [x] Caching layer (Redis-like)
  - [x] Database query optimization
  - [x] Real-time updates with GraphQL subscriptions
- [x] **Security & Compliance**
  - [x] Audit logging system
  - [x] Data encryption
  - [x] RBAC implementation
  - [x] Session management

### Week 10-12: Polish & Scale ✅
- [x] Mobile-responsive design
- [x] Advanced search with filters
- [x] Bulk operations
- [x] Real-time notifications
- [x] **Secure Invitation System** - Token-based user invitations with email templates
- [x] **Invitation Management UI** - Admin interface for managing pending invitations
- [x] **Authentication Security** - Disabled open registration, invitation-only access
- [ ] Two-Factor Authentication (2FA)
- [ ] SSO integration (SAML/OAuth)
- [ ] API rate limiting
- [ ] Comprehensive test coverage

### Future Enhancements: Enterprise & SaaS Features 📋
- [ ] **Multi-tenant Architecture**
  - [ ] Tenant isolation
  - [ ] Custom subdomains
  - [ ] Tenant-specific configurations
- [ ] **Advanced Authentication**
  - [ ] Two-Factor Authentication (2FA)
  - [ ] SSO (SAML/OAuth)
  - [ ] Passwordless authentication
- [ ] **Calendar Deep Integration**
  - [ ] Google Calendar sync
  - [ ] Outlook calendar sync
  - [ ] Automated interview scheduling with availability matching
- [ ] **Advanced AI Capabilities**
  - [ ] NLP-powered resume parsing
  - [ ] Predictive analytics for hiring success
  - [ ] Automated candidate ranking
  - [ ] Chatbot for candidate FAQs
- [ ] **Video Interview Platform**
  - [ ] Built-in video conferencing
  - [ ] Interview recording
  - [ ] AI-powered interview analysis
- [ ] **Background Check Integration**
  - [ ] Criminal background checks
  - [ ] Employment verification
  - [ ] Education verification
- [ ] **White-label Customization**
  - [ ] Custom branding
  - [ ] Theme customization
  - [ ] Custom domains
- [ ] **Billing & Subscription Management**
  - [ ] Stripe integration
  - [ ] Usage-based pricing
  - [ ] Invoice generation
- [ ] **Mobile Applications**
  - [ ] Progressive Web App (PWA)
  - [ ] iOS native app
  - [ ] Android native app
- [ ] **Advanced Compliance**
  - [ ] GDPR compliance tools
  - [ ] SOC 2 compliance
  - [ ] HIPAA compliance options
- [ ] **Public API & Webhooks**
  - [ ] RESTful API
  - [ ] GraphQL API
  - [ ] Webhook management
  - [ ] API documentation
- [ ] **Advanced Reporting**
  - [ ] Custom dashboard builder
  - [ ] Scheduled reports
  - [ ] Data warehouse integration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ by the Chinchilla AI team
- Powered by AWS Amplify Gen2
- UI components from Tailwind UI
- Icons from Lucide React

## 📞 Support

- 📧 Email: support@chinchilla.ai
- 💬 Slack: [Join our community](https://chinchilla-ai.slack.com)
- 📖 Docs: [docs.chinchilla.ai](https://docs.chinchilla.ai)
- 🐛 Issues: [GitHub Issues](https://github.com/chinchilla-ai/hr-portal/issues)

---

**Built for HR teams, by developers who understand the importance of great hiring and onboarding experiences.** 🚀