import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const PACKAGES: Record<string, { amount: number; label: string }> = {
  single:   { amount: 500,  label: 'Single Session — 100 credits' },
  standard: { amount: 1200, label: '3-Pack — 300 credits' },
  premium:  { amount: 2000, label: '6-Pack — 600 credits' },
};

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const { packageId } = await request.json();
    const pkg = PACKAGES[packageId];
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pkg.amount,
      currency: 'usd',
      description: pkg.label,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Create credit intent error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
