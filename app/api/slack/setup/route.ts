import { NextResponse } from 'next/server';
import { SlackService } from '@/lib/slackService';

export async function GET() {
  try {
    // Initialize Slack with environment variables
    SlackService.initialize({
      botToken: process.env.SLACK_BOT_TOKEN || '',
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      appId: process.env.SLACK_APP_ID,
      defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '#general',
    });

    // Test connection
    const connectionTest = await SlackService.testConnection();

    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: connectionTest.error,
        message: 'Failed to connect to Slack. Please check your configuration.',
      }, { status: 500 });
    }

    // Get workspace info
    const workspaceInfo = {
      connected: true,
      workspace: connectionTest.workspace,
      configured: !!process.env.SLACK_BOT_TOKEN,
    };

    return NextResponse.json({
      success: true,
      ...workspaceInfo,
      message: 'Slack integration is properly configured',
    });
  } catch (error) {
    console.error('Slack setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to setup Slack integration',
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // Initialize Slack
    SlackService.initialize({
      botToken: process.env.SLACK_BOT_TOKEN || '',
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      appId: process.env.SLACK_APP_ID,
      defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '#general',
    });

    switch (action) {
      case 'test_message':
        const messageResult = await SlackService.sendMessage({
          channel: data.channel || '#general',
          text: 'Test message from Chinchilla HR Portal! 🎉',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '✅ *Slack integration is working!*\n\nThis is a test message from your HR Portal.',
              },
            },
          ],
        });

        return NextResponse.json({
          success: messageResult.success,
          error: messageResult.error,
        });

      case 'create_channels':
        // Create default HR channels
        const channels = [
          { name: 'hr-onboarding', description: 'New employee onboarding notifications' },
          { name: 'hr-interviews', description: 'Interview schedules and reminders' },
          { name: 'hr-documents', description: 'Document signature requests and updates' },
          { name: 'hr-general', description: 'General HR notifications' },
        ];

        const results = [];
        for (const channel of channels) {
          const result = await SlackService.createChannel(channel.name, false);
          results.push({
            name: channel.name,
            ...result,
          });
        }

        return NextResponse.json({
          success: true,
          channels: results,
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Slack API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}