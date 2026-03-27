// app/astrology/transits/wheel/page.tsx
import TransitChartClient from '../transit-chart-client';

export const metadata = {
  title: 'Archetypal Astrology | Transit Chart',
  description: 'Your personal astrological transit chart — see how current planetary positions aspect your natal birth chart.',
  keywords: 'astrology, transits, natal chart, birth chart, aspects, planets',
};

export default function Page() {
  return <TransitChartClient />;
}
