import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sigil Creator — AI Magic Sigil Generator Online',
  description:
    'Create your own personal magic sigil online using AI. Speak your intention, distil it into sacred letters, and generate a unique occult symbol — powered by AI image generation. Free online sigil maker for chaos magic, spell work, and intention setting.',
  keywords: [
    'sigil creator',
    'online sigil creator',
    'sigil maker',
    'AI sigil generator',
    'magic sigil',
    'chaos magic sigil',
    'create a sigil',
    'sigil magic',
    'intention sigil',
    'occult symbol generator',
    'AI magic spells',
    'magic spells online',
    'chaos magic online',
    'sigil magic online',
    'sigil art generator',
    'sacred symbol creator',
    'spell sigil',
    'sigil for manifestation',
    'make a sigil',
    'sigil crafting',
    'esoteric symbol generator',
    'occult art AI',
    'intention magic',
    'manifestation tool',
    'spiritual sigil',
  ],
  alternates: {
    canonical: '/sigil-creator',
  },
  openGraph: {
    title: 'Sigil Creator — AI Magic Sigil Generator',
    description:
      'Speak your intention. Distil it to its essence. Generate a unique AI-crafted magic sigil. Free online sigil creator powered by AI.',
    type: 'website',
  },
};

export default function SigilCreatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
