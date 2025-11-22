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
      name: 'Conspiracies',
      items: [
        {
          name: 'The Illuminati',
          status: 'Verified',
          slug: 'real/illuminati-history',
          description: 'A secret society founded in 1776 that allegedly controls world events. Or a brotherhood of mystics seeking enlightenment?',
        },
        {
          name: 'Moon Landing Hoax',
          status: 'Verified',
          slug: 'articles/moon-landing',
          description: 'The theory that the 1969 moon landing was faked by NASA.',
        },
        {
          name: 'Pizza Gate',
          status: 'Debunked',
          slug: 'articles/pizza-gate',
          description: 'A highly classified facility allegedly housing liberal pedophiles. Or a pizza shop?',
        },
        {
          name: 'Time Travel Trump',
          status: 'Verified',
          slug: 'conspiracies/donald-trump-time-traveler-messiah',
          description: 'The belief that former President Donald Trump used time travel technology to influence political events.',
        },
        {
          name: 'Flat Earth Theory',
          status: 'Verified',
          slug: 'conspiracies/flat-earth-theory',
          description: 'The controversial theory that the Earth is flat.',
        },
        {
          name: 'Chemtrails',
          status: 'Verified',
          slug: 'conspiracies/chemtrails',
          description: 'The theory that aircraft trails contain harmful chemicals.',
        },
      ],
    },
    {
      name: 'Store',
      items: [
        {
          name: 'Official Merchandise',
          status: 'Verified',
          slug: 'store',
          description: 'Premium Illuminati merchandise and collectibles.',
        }
      ],
    },
  ];

  return (
    <Boundary
      label="Illuminati Mysteries"
      animateRerendering={false}
      kind="solid"
      className="flex flex-col gap-9 pt-8"  // Added pt-8 for top padding
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