import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateRecommendations } from '@/lib/recommendationEngine';
import { DateRangeKey } from '@/lib/types';
export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') as DateRangeKey) || 'last_30_days';

    const db = getDb();
    const recommendations = generateRecommendations(db, range);

    // Grouping counts for summary badges
    const actionNeededCount = recommendations.filter(r => r.severity === 'action_needed').length;
    const watchCount = recommendations.filter(r => r.severity === 'watch').length;
    const opportunityCount = recommendations.filter(r => r.severity === 'opportunity').length;

    return NextResponse.json({
      recommendations,
      counts: {
        total: recommendations.length,
        actionNeeded: actionNeededCount,
        watch: watchCount,
        opportunity: opportunityCount,
      },
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
