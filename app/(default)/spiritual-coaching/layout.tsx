import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solomon — Authentic Intelligence Spiritual Coach',
  description:
    'Talk with Solomon, an Authentic Intelligence spiritual coach. Ask anything about your inner journey, purpose, relationships, or life path. Real-time voice coaching powered by AI — no scripts, no limits.',
  keywords: [
    'spiritual coaching',
    'AI spiritual coach',
    'authentic intelligence',
    'spiritual guidance',
    'voice coaching',
    'inner journey',
    'self discovery',
    'spiritual mentor',
    'enlightenment coaching',
    'life purpose coaching',
    'Solomon coach',
  ],
  openGraph: {
    title: 'Solomon — Authentic Intelligence Spiritual Coach',
    description:
      'Real-time voice sessions with Solomon, your personal AI spiritual guide. Ask anything. No scripts. No limits. Only truth.',
    type: 'website',
  },
};

export default function CoachingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
