// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, updateUserRole, validateSession } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = await validateSession(token);
    if (!sessionData || sessionData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = await validateSession(token);
    if (!sessionData || sessionData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, role } = await request.json();
    
    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role required' }, { status: 400 });
    }

    const updatedUser = await updateUserRole(userId, role);
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update user role' 
    }, { status: 500 });
  }
}