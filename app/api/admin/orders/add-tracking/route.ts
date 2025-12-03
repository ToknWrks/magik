// app/api/admin/orders/add-tracking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export async function POST(request: NextRequest) {
  try {
    const { orderId, trackingNumber, carrier } = await request.json();

    // Verify admin
    const userId = request.cookies.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Generate tracking URL based on carrier
    let trackingUrl = null;
    const carrierLower = carrier.toLowerCase();
    if (carrierLower.includes('usps')) {
      trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
    } else if (carrierLower.includes('ups')) {
      trackingUrl = `https://www.ups.com/track?tracknum=${trackingNumber}`;
    } else if (carrierLower.includes('fedex')) {
      trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    } else if (carrierLower.includes('dhl')) {
      trackingUrl = `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
    }

    await pool.query(
      `UPDATE orders SET tracking_number = $1, carrier = $2, tracking_url = $3, status = 'shipped' WHERE id = $4`,
      [trackingNumber, carrier, trackingUrl, orderId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add tracking error:', error);
    return NextResponse.json({ error: 'Failed to add tracking' }, { status: 500 });
  }
}