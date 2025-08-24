export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface EmailTemplateData {
  firstName?: string;
  lastName?: string;
  position?: string;
  startDate?: string;
  mentorName?: string;
  companyName?: string;
  [key: string]: string | undefined;
}

const replaceTemplateVariables = (template: string, data: EmailTemplateData): string => {
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    if (value) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
  });
  return result;
};

export const emailTemplates = {
  welcome: (data: EmailTemplateData): EmailTemplate => ({
    subject: `Welcome to ${data.companyName || 'Chinchilla AI'}, ${data.firstName}!`,
    body: replaceTemplateVariables(`
      <h2>Welcome to ${data.companyName || 'Chinchilla AI'}!</h2>
      
      <p>Dear {{firstName}},</p>
      
      <p>We are thrilled to welcome you to our team as our new {{position}}! Your first day is scheduled for {{startDate}}, and we're excited to have you join us.</p>
      
      <p>Here's what you can expect in the coming days:</p>
      <ul>
        <li>You'll receive your onboarding checklist with all necessary documents</li>
        <li>Your mentor, {{mentorName}}, will reach out to schedule an introductory meeting</li>
        <li>IT will contact you about setting up your workstation and accounts</li>
      </ul>
      
      <p>If you have any questions before your start date, please don't hesitate to reach out to HR.</p>
      
      <p>Once again, welcome aboard!</p>
      
      <p>Best regards,<br>
      The HR Team</p>
    `, data),
  }),

  onboardingChecklist: (data: EmailTemplateData): EmailTemplate => ({
    subject: 'Your Onboarding Checklist - Action Required',
    body: replaceTemplateVariables(`
      <h2>Onboarding Checklist</h2>
      
      <p>Hi {{firstName}},</p>
      
      <p>To ensure a smooth onboarding process, please complete the following items before your start date ({{startDate}}):</p>
      
      <h3>Documents to Submit:</h3>
      <ul>
        <li>✓ Sign and return your offer letter</li>
        <li>✓ Complete and sign the NDA</li>
        <li>✓ Submit W-4 tax withholding form</li>
        <li>✓ Provide emergency contact information</li>
      </ul>
      
      <h3>Pre-boarding Tasks:</h3>
      <ul>
        <li>✓ Review the employee handbook</li>
        <li>✓ Complete background check authorization</li>
        <li>✓ Submit a professional headshot for your ID badge</li>
      </ul>
      
      <p>You can track your progress and submit documents through our HR portal. Login credentials will be sent separately.</p>
      
      <p>Questions? Reply to this email or contact HR directly.</p>
      
      <p>Best regards,<br>
      The HR Team</p>
    `, data),
  }),

  mentorIntroduction: (data: EmailTemplateData): EmailTemplate => ({
    subject: `Meet Your Mentor - ${data.mentorName}`,
    body: replaceTemplateVariables(`
      <h2>Introducing Your Mentor</h2>
      
      <p>Hi {{firstName}},</p>
      
      <p>I'm {{mentorName}}, and I'll be your mentor during your onboarding at {{companyName}}. I'm looking forward to helping you get settled in and supporting your success here!</p>
      
      <p>As your mentor, I'll be:</p>
      <ul>
        <li>Your go-to person for questions about our team and company culture</li>
        <li>Helping you navigate your first few weeks</li>
        <li>Introducing you to key team members and stakeholders</li>
        <li>Providing guidance on projects and workflows</li>
      </ul>
      
      <p>I'd love to schedule a quick call before your start date to:</p>
      <ul>
        <li>Get to know you better</li>
        <li>Answer any questions you might have</li>
        <li>Share some tips for your first day</li>
      </ul>
      
      <p>Please let me know your availability for a 30-minute call this week. You can reply to this email with some times that work for you.</p>
      
      <p>Looking forward to meeting you!</p>
      
      <p>Best,<br>
      {{mentorName}}</p>
    `, data),
  }),

  firstDayReminder: (data: EmailTemplateData): EmailTemplate => ({
    subject: 'Ready for Tomorrow? First Day Reminders',
    body: replaceTemplateVariables(`
      <h2>Your First Day at {{companyName}} - Tomorrow!</h2>
      
      <p>Hi {{firstName}},</p>
      
      <p>We're excited to see you tomorrow for your first day! Here are some important reminders:</p>
      
      <h3>📍 When & Where:</h3>
      <ul>
        <li><strong>Date:</strong> {{startDate}}</li>
        <li><strong>Time:</strong> 9:00 AM</li>
        <li><strong>Location:</strong> Main Office - Reception Desk</li>
      </ul>
      
      <h3>📋 What to Bring:</h3>
      <ul>
        <li>Government-issued ID</li>
        <li>Signed offer letter (if not already submitted)</li>
        <li>Any remaining onboarding documents</li>
      </ul>
      
      <h3>👔 Dress Code:</h3>
      <p>Business casual - feel free to dress comfortably!</p>
      
      <h3>🍽️ Lunch:</h3>
      <p>We'll be taking you out for a welcome lunch with your team.</p>
      
      <h3>💻 First Day Schedule:</h3>
      <ul>
        <li>9:00 AM - Check-in and badge pickup</li>
        <li>9:30 AM - HR orientation</li>
        <li>10:30 AM - IT setup and workstation configuration</li>
        <li>12:00 PM - Team lunch</li>
        <li>2:00 PM - Meet with your mentor</li>
        <li>3:00 PM - Team introductions</li>
      </ul>
      
      <p>If you have any last-minute questions, feel free to reach out!</p>
      
      <p>See you tomorrow!</p>
      
      <p>Best regards,<br>
      The HR Team</p>
    `, data),
  }),

  documentReminder: (data: EmailTemplateData): EmailTemplate => ({
    subject: 'Reminder: Pending Documents Required',
    body: replaceTemplateVariables(`
      <h2>Action Required: Pending Documents</h2>
      
      <p>Hi {{firstName}},</p>
      
      <p>This is a friendly reminder that we're still waiting for some documents to complete your onboarding process.</p>
      
      <h3>Documents Still Needed:</h3>
      <ul>
        <li>{{pendingDocuments}}</li>
      </ul>
      
      <p>Please submit these documents as soon as possible through our HR portal or reply to this email with the attachments.</p>
      
      <p>If you're having any issues or need assistance, please let us know immediately so we can help.</p>
      
      <p>Thank you for your prompt attention to this matter!</p>
      
      <p>Best regards,<br>
      The HR Team</p>
    `, data),
  }),
};