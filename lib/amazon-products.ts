// lib/amazon-products.ts
export interface AmazonProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  image: string;
  amazonUrl: string;
  featured?: boolean;
}

export const amazonProducts: AmazonProduct[] = [
  // Books
  {
    id: 'cosmos-psyche',
    name: 'Cosmos and Psyche',
    slug: 'book-cosmos-and-psyche-richard-tarnas',
    description: 'Richard Tarnas explores the connection between planetary movements and human events.',
    price: 19.99,
    category: 'Books',
    image: 'https://m.media-amazon.com/images/I/81gl8GPj-9L._SL1500_.jpg',
    amazonUrl: 'https://amzn.to/4izeGmx',
    featured: false,
  },
  {
    id: 'Way-of-the-psychonaut',
    name: 'Way of the Psychonaut',
    slug: 'book-way-of-the-psychonaut-stanislav-grof',
    description: 'A comprehensive guide to the use of psychoactive plants for spiritual growth and exploration.',
    price: 24.95,
    category: 'Books',
    image: 'https://m.media-amazon.com/images/I/71bdBacryqL._SL1500_.jpg',
    amazonUrl: 'https://amzn.to/4pf3bmJ',
    featured: false,
  },
  {
    id: 'illuminatus-trilogy',
    name: 'The Illuminatus! Trilogy',
    slug: 'book-illuminatus-trilogy-robert-shea-robert-anton-wilson',
    description: 'A satirical, postmodern adventure into conspiracy theories by Robert Shea and Robert Anton Wilson.',
    price: 24.95,
    category: 'Books',
    image: 'https://m.media-amazon.com/images/I/71SpV6hWDhL._SL1200_.jpg',
    amazonUrl: 'https://amzn.to/4rD8s9q',
    featured: false,
  },

  {
    id: 'prometheus-rising',
    name: 'Prometheus Rising',
    slug: 'book-prometheus-rising-robert-anton-wilson',
    description: 'Robert Anton Wilson\'s exploration of human consciousness and the potential for personal transformation.',
    price: 19.00,
    category: 'Books',
    image: 'https://m.media-amazon.com/images/I/71pKT5G3xGL._SL1360_.jpg',
    amazonUrl: 'https://amzn.to/4azRfYh',
    featured: false,
  },
  {
    id: 'cosmic-trigger',
    name: 'Cosmic Trigger: The Final Secret of the Illuminati',
    slug: 'book-cosmic-trigger-robert-anton-wilson',
    description: 'Robert Anton Wilson\'s autobiographical account of his experiences with altered states of consciousness and esoteric knowledge.',
    price: 19.00,
    category: 'Books',
    image: 'https://m.media-amazon.com/images/I/71B68Wv2p9L._SL1360_.jpg',
    amazonUrl: 'https://amzn.to/3Mjn6m6',
    featured: true,
  },
  {
    id: 'the-perennial-philosophy',
    name: 'The Perennial Philosophy',
    slug: 'book-the-perennial-philosophy-aldous-huxley',
    description: 'Aldous Huxley\'s classic work on the universal truths found in all spiritual traditions.',
    price: 12.99,
    category: 'Books',
    image: 'https://m.media-amazon.com/images/I/71EOf+r+mHL._SL1360_.jpg',
    amazonUrl: 'https://amzn.to/4pQQfne',
  },
  {
    id: 'the-coming-world-nation',
    name: 'The coming world nation',
    slug: 'book-the-coming-world-nation',
    description: 'Why world government is inevitable by Alexander Sachon.',
    price: 22.95,
    category: 'Books',
    image: 'https://m.media-amazon.com/images/I/71+PU-JQrTL._SL1499_.jpg',
    amazonUrl: 'https://amzn.to/4aqB67t',
    featured: true,
  },
  {
    id: 'amazon-book-5',
    name: 'Secret Societies and Psychological Warfare',
    slug: 'secret-societies-psychological-warfare',
    description: 'Michael Hoffman explores the hidden influence of secret societies on modern culture.',
    price: 15.00,
    category: 'Books',
    image: 'https://m.media-amazon.com/images/I/81hofagq2GL._SL1500_.jpg',
    amazonUrl: 'https://amzn.to/4oRzRC9',
  },
  {
    id: 'amazon-book-6',
    name: 'Psychology of the future',
    slug: 'psychology-of-the-future',
    description: 'Stanislav Grof delves into the transformative potential of human consciousness.',
    price: 25.00,
    category: 'Books',
    image: 'https://m.media-amazon.com/images/I/613oUhCyAeL._SL1360_.jpg',
    amazonUrl: 'https://amzn.to/3Y4EPAa',
  },
  {
    id: 'amazon-book-7',
    name: 'The secret teachings of all ages',
    slug: 'the-secret-teachings-of-all-ages',
    description: 'Manly P. Hall\'s encyclopedic work on esoteric traditions and hidden knowledge throughout history.',
    price: 25.00,
    category: 'Books',
    image: 'https://m.media-amazon.com/images/I/81PhshiUbNL._SL1500_.jpg',
    amazonUrl: 'https://amzn.to/4oBimWt',
  },
  // Documentaries/DVDs
  {
    id: 'amazon-dvd-1',
    name: 'Cloak of The Illuminati',
    slug: 'cloak-of-the-illuminati',
    description: 'Illuminati Stargate Secrets of the Anunnaki 2 DVD Set',
    price: 29.99,
    category: 'Documentaries',
    image: 'https://m.media-amazon.com/images/I/41amm8kt0vL.jpg',
    amazonUrl: 'https://amzn.to/48PqjCB',
  },
   // Oracles/Divination
   {
    id: 'amazon-oracle-1',
    name: 'The Illuminati Oracle',
    slug: 'divination/illuminati-oracle',
    description: 'Dvination Tool for Discerning Truth in Conspiracy by A.J. Blackwood - 70 Card Divination Game to Decode Current Events, Expose Hidden Agendas & Manifest Higher Timelines',
    price: 19.99,
    category: 'Divination',
    image: 'https://m.media-amazon.com/images/I/91rnOp3ESaL._AC_SL1500_.jpg',
    amazonUrl: 'https://amzn.to/4pQxpfO',
  },
  {
    id: 'amazon-oracle-2',
    name: 'The Thoth Tarot Deck',
    slug: 'divination/thoth-tarot-deck',
    description: 'The Thoth Tarot Deck by Aleister Crowley and Lady Frieda Harris - A Powerful Tool for Divination and Self-Discovery',
    price: 19.99,
    category: 'Divination',
    image: 'https://m.media-amazon.com/images/I/81J7TNOay-L._SL1500_.jpg',
    amazonUrl: 'https://amzn.to/3XH71Jo',
  },
    {
    id: 'amazon-oracle-3',
    name: 'Archetypal Astrology Oracle Cards',
    slug: 'divination/archetypal-astrology-oracle-cards',
    description: 'Includes 55 full-color cards featuring each planetary archetype—the Sun, Moon, and planets individually—as well as each aspect or pairing of two celestial bodies',
    price: 29.99,
    category: 'Divination',
    image: 'https://m.media-amazon.com/images/I/81nqXHXrc4L._SL1500_.jpg',
    amazonUrl: 'https://amzn.to/48mesMf',
    },
    {
        id: 'amazon-oracle-4',
        name: 'Osho Zen Tarot Deck',
        slug: 'divination/osho-zen-tarot-deck',
        description: 'Osho Zen Tarot Deck - A Unique Approach to Tarot Based on Zen Philosophy',
        price: 29.99,
        category: 'Divination',
        image: 'https://m.media-amazon.com/images/I/71ldp3E8N1L._SL1500_.jpg',
        amazonUrl: 'https://amzn.to/3KjCNt0',
        featured: true,
        },



  // Equipment/Gear
  {
    id: 'amazon-gear-1',
    name: 'Faraday Bag for Phones',
    slug: 'faraday-bag-phones',
    description: 'Block all signals and protect your privacy with this military-grade faraday bag.',
    price: 49.99,
    category: 'Gear',
    image: 'https://m.media-amazon.com/images/I/91bCr13NOML._AC_SL1500_.jpg',
    amazonUrl: 'https://amzn.to/4iVgve1',
    featured: false,
  },
  {
    id: 'amazon-gear-2',
    name: 'EMF Detector',
    slug: 'emf-detector',
    description: 'Detect electromagnetic fields and investigate anomalies in your environment.',
    price: 34.99,
    category: 'Gear',
    image: 'https://m.media-amazon.com/images/I/71ryi3DTdLL._SL1500_.jpg',
    amazonUrl: 'https://amzn.to/49WIh7g',
  },
  {
    id: 'amazon-gear-3',
    name: 'Night Vision Monocular',
    slug: 'night-vision-monocular',
    description: 'See in the dark with this high end night vision device.',
    price: 399.99,
    category: 'Gear',
    image: 'https://m.media-amazon.com/images/I/61xKL-Z44SL._AC_SL1500_.jpg',
    amazonUrl: 'https://amzn.to/4oxtLXi',
  },
];

export const amazonCategories = ['Books','Divination','Documentaries','Gear'];