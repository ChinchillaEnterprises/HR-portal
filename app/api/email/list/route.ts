import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { GmailService } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in with Google" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const maxResults = parseInt(searchParams.get("maxResults") || "20");

    const gmail = new GmailService(session.accessToken, session.refreshToken);
    const messages = await gmail.getMessages(query, maxResults);

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch emails" },
      { status: 500 }
    );
  }
}