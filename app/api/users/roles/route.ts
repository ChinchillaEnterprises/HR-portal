import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { 
  getUserRole, 
  assignRole, 
  removeRole, 
  listUserRoles,
  PERMISSIONS,
  hasPermission
} from '@/lib/auth/rbac';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const userRole = await getUserRole(session.user.email);
    if (!userRole || !hasPermission(userRole, PERMISSIONS.USER_VIEW)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const roles = await listUserRoles();
    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const userRole = await getUserRole(session.user.email);
    if (!userRole || !hasPermission(userRole, PERMISSIONS.USER_ASSIGN_ROLES)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role, action } = body;

    if (!email || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    switch (action) {
      case 'assign':
        if (!role) {
          return NextResponse.json({ error: 'Role required for assignment' }, { status: 400 });
        }
        const assigned = await assignRole(email, role, session.user.email);
        if (assigned) {
          return NextResponse.json({ success: true, message: 'Role assigned successfully' });
        } else {
          return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 });
        }

      case 'remove':
        const removed = await removeRole(email);
        if (removed) {
          return NextResponse.json({ success: true, message: 'Role removed successfully' });
        } else {
          return NextResponse.json({ error: 'Failed to remove role' }, { status: 500 });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error managing roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}