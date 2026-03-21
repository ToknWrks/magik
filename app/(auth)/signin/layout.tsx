import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Illuminati Members Sign In',
  description: 'Sign in to your Illuminati membership account to access exclusive esoteric content, guided meditations, and celestial insights.',
  keywords: ['illuminati members', 'sign in', 'login', 'membership', 'esoteric'],
};

export default function SigninLayout({ children }: { children: React.ReactNode }) {
  return children;
}
