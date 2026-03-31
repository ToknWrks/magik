import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';

// Define LinkStatus inline to resolve the undefined error
function LinkStatus({ status }: { status: string }) {
  const colorClass = status === 'Verified' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  return <span className={`text-xs ${colorClass}`}>{status}</span>;
}

export default function IlluminatiArchive() {
  // Use static data - NO database calls in server components
  const sections = [
    
    {
      name: 'Members',
      items: [
        {
          name: 'The Illuminati',
          status: '',
          slug: 'mysteries/illuminati-history',
          description: 'A secret society founded in 1776 that allegedly controls world events? Or an ancient brotherhood of mystics seeking enlightenment?',
        },
        {
          name: 'Astrology',
          status: '',
          slug: 'astrology',
          description: 'astrology is the study of the movements and relative positions of celestial bodies interpreted as having an influence on human affairs and the natural world.',
        },
        {
          name: 'Chakra Toner',
          status: '',
          slug: 'chakra-sound',
          description: 'A sound therapy product designed to balance and align the body\'s energy centers, or chakras, using specific frequencies and vibrations.',
        },
        {
          name: 'Solomon',
          status: '',
          slug: 'spiritual-coaching',
          description: 'A highly revered mantra from the Rig Veda, dedicated to Savitr, the sun deity.',
        },
        {
          name: 'Spiritual Teachings ',
          status: '',
          slug: 'enlightenment',
          description: 'The Illuminati are said to have access to ancient spiritual teachings and esoteric knowledge that they use to guide their actions and help the human race evolve spiritually.',
        },
        {
          name: 'Daily Sigil',
          status: '',
          slug: 'sigil-creator',
          description: 'The practice of using symbols, rituals, and intentions to manifest desired outcomes or influence reality.',
        },
      ],
    },
    
    {
      name: 'Mysteries',
      items: [
        {
          name: 'Maui Fires',
          status: 'Debunked',
          slug: 'mysteries/maui-fires-illuminati',
          description: 'The theory that the 2023 Maui wildfires were orchestrated by the Illuminati as part of a larger plan.',
        },
        {
          name: 'Moon Landing Hoax',
          status: 'Debunked',
          slug: 'articles/moon-landing',
          description: 'The theory that the 1969 moon landing was faked by NASA.',
        },
        {
          name: 'Pizza Gate',
          status: 'Fnord',
          slug: 'articles/pizza-gate',
          description: 'A highly classified facility allegedly housing liberal pedophiles. Or a pizza shop?',
        },
        {
          name: 'Time Travel Trump',
          status: 'Fnord',
          slug: 'conspiracies/donald-trump-time-traveler-messiah',
          description: 'The belief that former President Donald Trump used time travel technology to influence political events.',
        },
        {
          name: 'Flat Earth Theory',
          status: 'Debunked',
          slug: 'conspiracies/flat-earth-theory',
          description: 'The controversial theory that the Earth is flat.',
        },
        {
          name: 'Chemtrails',
          status: 'Under Review',
          slug: 'conspiracies/chemtrails',
          description: 'The theory that aircraft trails contain harmful chemicals.',
        },
      ],
    },
  ];

  return (
    <Boundary
      label="Illuminati - Singing and Dancing are the voice of the law"
      animateRerendering={false}
      kind="solid"
      className="flex flex-col gap-6 sm:gap-9 pt-4 sm:pt-8"
    >
      {sections.map((section) => {
        return (
          <div key={section.name} className="flex flex-col gap-3">
            <div className="font-mono text-xs font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
              {section.name}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {section.items.map((item) => {
                return (
                  <Link
                    href={`/${item.slug}`}
                    key={item.name}
                    className="group flex flex-col gap-1 rounded-lg bg-gray-50 px-5 py-3 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-950"
                  >
                    <div className="flex items-center justify-between font-medium text-gray-900 group-hover:text-gray-700 dark:text-gray-200 dark:group-hover:text-gray-50">
                    {item.name} <LinkStatus status={item.status} />
                    </div>

                    {item.description ? (
                      <div className="line-clamp-3 text-[13px] text-gray-600 group-hover:text-gray-800 dark:text-gray-500 dark:group-hover:text-gray-300">
                        {item.description}
                      </div>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </Boundary>
  );
}