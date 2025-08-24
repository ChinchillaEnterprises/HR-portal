import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { Handler } from 'aws-lambda';

const ses = new SESClient({ region: process.env.EMAIL_REGION || 'us-east-1' });

interface EmailEvent {
  to: string | string[];
  subject: string;
  templateType: 'welcome' | 'offer_letter' | 'task_reminder' | 'document_shared' | 'custom';
  templateData?: Record<string, any>;
  htmlContent?: string;
  textContent?: string;
}

const emailTemplates = {
  welcome: (data: any) => ({
    subject: `Welcome to Chinchilla Flow, ${data.firstName}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f4f4f4; }
            .button { display: inline-block; padding: 10px 20px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Chinchilla Flow!</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.firstName},</h2>
              <p>We're excited to have you join our team! Your onboarding journey starts here.</p>
              <p>Here's what happens next:</p>
              <ul>
                <li>Complete your profile information</li>
                <li>Review and sign your documents</li>
                <li>Connect with your team members</li>
                <li>Access training materials</li>
              </ul>
              <p>If you have any questions, don't hesitate to reach out to your HR representative.</p>
              <a href="${data.loginUrl}" class="button">Get Started</a>
            </div>
            <div class="footer">
              <p>&copy; 2025 Chinchilla Flow. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Chinchilla Flow, ${data.firstName}!

We're excited to have you join our team! Your onboarding journey starts here.

Here's what happens next:
- Complete your profile information
- Review and sign your documents
- Connect with your team members
- Access training materials

Get started: ${data.loginUrl}

If you have any questions, don't hesitate to reach out to your HR representative.

© 2025 Chinchilla Flow. All rights reserved.`
  }),

  offer_letter: (data: any) => ({
    subject: `Your Offer Letter from Chinchilla Flow`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f4f4f4; }
            .button { display: inline-block; padding: 10px 20px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Offer Letter is Ready</h1>
            </div>
            <div class="content">
              <h2>Congratulations ${data.firstName}!</h2>
              <p>We're pleased to extend an offer for the position of <strong>${data.position}</strong> at Chinchilla Flow.</p>
              <p>Your offer letter is now available for review and signature. Please review the details carefully and sign the document within ${data.deadline || '48 hours'}.</p>
              <a href="${data.documentUrl}" class="button">View & Sign Offer Letter</a>
              <p style="margin-top: 20px;">If you have any questions about the offer, please contact your recruiter at ${data.recruiterEmail}.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Chinchilla Flow. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Your Offer Letter from Chinchilla Flow

Congratulations ${data.firstName}!

We're pleased to extend an offer for the position of ${data.position} at Chinchilla Flow.

Your offer letter is now available for review and signature. Please review the details carefully and sign the document within ${data.deadline || '48 hours'}.

View & Sign Offer Letter: ${data.documentUrl}

If you have any questions about the offer, please contact your recruiter at ${data.recruiterEmail}.

© 2025 Chinchilla Flow. All rights reserved.`
  }),

  task_reminder: (data: any) => ({
    subject: `Reminder: ${data.taskName} needs your attention`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f39c12; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f4f4f4; }
            .button { display: inline-block; padding: 10px 20px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Task Reminder</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.firstName},</h2>
              <p>This is a friendly reminder about the following task:</p>
              <h3>${data.taskName}</h3>
              <p><strong>Due Date:</strong> ${data.dueDate}</p>
              <p><strong>Description:</strong> ${data.description}</p>
              <a href="${data.taskUrl}" class="button">Complete Task</a>
            </div>
            <div class="footer">
              <p>&copy; 2025 Chinchilla Flow. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Task Reminder

Hi ${data.firstName},

This is a friendly reminder about the following task:

${data.taskName}
Due Date: ${data.dueDate}
Description: ${data.description}

Complete Task: ${data.taskUrl}

© 2025 Chinchilla Flow. All rights reserved.`
  }),

  document_shared: (data: any) => ({
    subject: `${data.sharedBy} shared a document with you`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3498db; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f4f4f4; }
            .button { display: inline-block; padding: 10px 20px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Document Shared</h1>
            </div>
            <div class="content">
              <h2>Hi ${data.firstName},</h2>
              <p>${data.sharedBy} has shared a document with you:</p>
              <h3>${data.documentName}</h3>
              <p><strong>Type:</strong> ${data.documentType}</p>
              ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}
              <a href="${data.documentUrl}" class="button">View Document</a>
            </div>
            <div class="footer">
              <p>&copy; 2025 Chinchilla Flow. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Document Shared

Hi ${data.firstName},

${data.sharedBy} has shared a document with you:

${data.documentName}
Type: ${data.documentType}
${data.message ? `Message: ${data.message}` : ''}

View Document: ${data.documentUrl}

© 2025 Chinchilla Flow. All rights reserved.`
  })
};

export const handler: Handler<EmailEvent> = async (event) => {
  try {
    const { to, subject, templateType, templateData, htmlContent, textContent } = event;
    
    let emailSubject = subject;
    let emailHtml = htmlContent || '';
    let emailText = textContent || '';

    // Use template if specified
    if (templateType && templateType !== 'custom' && templateData) {
      const template = emailTemplates[templateType];
      if (template) {
        const generated = template(templateData);
        emailSubject = generated.subject;
        emailHtml = generated.html;
        emailText = generated.text;
      }
    }

    const toAddresses = Array.isArray(to) ? to : [to];

    const params = {
      Destination: {
        ToAddresses: toAddresses,
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: emailHtml,
          },
          Text: {
            Charset: "UTF-8",
            Data: emailText,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: emailSubject,
        },
      },
      Source: process.env.EMAIL_FROM || 'noreply@chinchillaflow.com',
    };

    const command = new SendEmailCommand(params);
    const response = await ses.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: response.MessageId,
        recipients: toAddresses
      }),
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
    };
  }
};