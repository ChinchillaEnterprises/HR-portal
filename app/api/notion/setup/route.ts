import { NextResponse } from 'next/server';
import { NotionService } from '@/lib/notionService';

export async function GET() {
  try {
    // Check if Notion is configured
    const apiKey = process.env.NOTION_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'Notion API key not configured. Add NOTION_API_KEY to your environment variables.',
      });
    }

    // Initialize Notion
    NotionService.initialize({ apiKey });

    // Test connection
    const connectionTest = await NotionService.testConnection();

    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        configured: true,
        connected: false,
        error: connectionTest.error,
        message: 'Failed to connect to Notion. Please check your API key.',
      }, { status: 500 });
    }

    // Get workspace info
    const workspaceInfo = {
      connected: true,
      configured: true,
      workspace: connectionTest.workspace,
    };

    return NextResponse.json({
      success: true,
      ...workspaceInfo,
      message: 'Notion integration is properly configured',
    });
  } catch (error) {
    console.error('Notion setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to setup Notion integration',
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // Initialize Notion
    const apiKey = process.env.NOTION_API_KEY || data.apiKey;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key required',
      }, { status: 400 });
    }

    NotionService.initialize({ apiKey });

    switch (action) {
      case 'create_database':
        const dbResult = await NotionService.createHRDatabase();
        return NextResponse.json(dbResult);

      case 'sync_applicant':
        if (!data.applicantId) {
          return NextResponse.json({
            success: false,
            error: 'Applicant ID required',
          }, { status: 400 });
        }
        const syncResult = await NotionService.syncApplicant(data.applicantId);
        return NextResponse.json(syncResult);

      case 'create_task':
        if (!data.title) {
          return NextResponse.json({
            success: false,
            error: 'Task title required',
          }, { status: 400 });
        }
        const taskResult = await NotionService.createTask(data.title, data.details || {});
        return NextResponse.json(taskResult);

      case 'create_interview_notes':
        if (!data.applicantName || !data.interviewDetails) {
          return NextResponse.json({
            success: false,
            error: 'Applicant name and interview details required',
          }, { status: 400 });
        }
        const notesResult = await NotionService.createInterviewNotes(
          data.applicantName,
          data.interviewDetails
        );
        return NextResponse.json(notesResult);

      case 'list_databases':
        const dbList = await NotionService.listDatabases();
        return NextResponse.json(dbList);

      case 'search':
        if (!data.query) {
          return NextResponse.json({
            success: false,
            error: 'Search query required',
          }, { status: 400 });
        }
        const searchResult = await NotionService.searchPages(data.query);
        return NextResponse.json(searchResult);

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}