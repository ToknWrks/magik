import PersonalReadingClient from './personal-reading-client';

export const metadata = {
  title: 'Personal Transit Reading | Illuminati',
  description: 'Get a personalized archetypal astrology transit reading based on your natal chart and today\'s planetary positions.',
};

export default function Page() {
  return <PersonalReadingClient />;
}
