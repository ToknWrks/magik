import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chakra Toner — Free Chakra Toning & Tuning App',
  description:
    'The free online Chakra Toning & Tuning App. Sing or hum into your microphone and watch your chakras illuminate in real time. Each note resonates with a specific energy center — Root to Crown. Vocal toning, chakra activation, and sound healing in your browser.',
  keywords: [
    'chakra toning app',
    'chakra tuning app',
    'chakra toner',
    'chakra sound healing',
    'vocal toning',
    'chakra frequencies',
    'sound meditation',
    'chakra activation',
    'chakra pitch detector',
    'free chakra app',
    'online chakra tool',
    'solfeggio frequencies',
    'chakra colors',
    'root chakra sound',
    'crown chakra sound',
    'energy centers',
    'spiritual sound tool',
  ],
  alternates: {
    canonical: '/chakra-toner',
  },
};

export default function ChakraTunerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
