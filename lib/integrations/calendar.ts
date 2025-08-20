// Google Calendar integration stub
export interface CalendarInvite {
  title: string;
  startISO: string;
  endISO: string;
  attendees: string[];
}

export async function createCalendarEvent(invite: CalendarInvite): Promise<{ id: string }>{
  if (process.env.NEXT_PUBLIC_CALENDAR_ENABLED !== '1') {
    return { id: `cal_disabled_${Date.now()}` };
  }
  return { id: `cal_${Date.now()}` };
}

