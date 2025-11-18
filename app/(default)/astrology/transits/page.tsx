// app/astrology/transits/page.tsx
import AstrologyTransits from './astrology-transits';

export const metadata = {
  title: 'Archetypal Astrology | Current World Transits',
  description: 'Explore current astrological world transits with detailed interpretations using Archetypal Astrology framework.',
  keywords: 'astrology, transits, planets, aspects, interpretations',
};

export default function Page() {
  return <AstrologyTransits />;
}