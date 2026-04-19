// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { logAuditFromRequest, AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/auditLogger';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;
    
    console.log('🚪 Logout request, session:', sessionId);

    // Get user info before deleting session (for audit log)
    let userId = null;
    if (sessionId) {
      const sessionResult = await query(
        'SELECT user_id FROM sessions WHERE session_id = ?',
        [sessionId]
      );
      
      if (sessionResult.length > 0) {
        userId = sessionResult[0].user_id;
        
        // Log logout action
        await logAuditFromRequest(request, {
          userId: userId,
          action: AUDIT_ACTIONS.LOGOUT,
          entityType: AUDIT_ENTITIES.USER,
          entityId: userId,
          newValues: {
            logout_time: new Date().toISOString(),
            session_id: sessionId,
          },
        });
        
        console.log('📝 Audit log created for user:', userId);
      }

      // Delete session from database
      await query('DELETE FROM sessions WHERE session_id = ?', [sessionId]);
      console.log('✅ Session deleted from database');
    }

    // Clear the session cookie
    cookieStore.delete('session');
    console.log('🍪 Session cookie cleared');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    // Even if there's an error, clear the cookie
    try {
      const cookieStore = await cookies();
      cookieStore.delete('session');
    } catch {
      // Ignore cookie deletion errors
    }

    return NextResponse.json(
      { success: true, message: 'Logged out' },
      { status: 200 }
    );
  }
}