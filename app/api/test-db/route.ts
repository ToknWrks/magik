// app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import { testConnection } from '../../../lib/db';

export async function GET() {
  const connected = await testConnection();
  return NextResponse.json({ 
    connected,
    timestamp: new Date().toISOString()
  });
}