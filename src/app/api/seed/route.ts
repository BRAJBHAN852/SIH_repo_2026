import { NextResponse } from 'next/server';
import { reseedDatabase } from '@/lib/db';
export const dynamic = 'force-dynamic';


export async function POST() {
  try {
    reseedDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database reseeded successfully with 6 months of retail business data.',
    });
  } catch (error) {
    console.error('Error reseeding database:', error);
    return NextResponse.json({ error: 'Failed to reseed database' }, { status: 500 });
  }
}
