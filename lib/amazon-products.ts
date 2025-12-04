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
    slug: 'cosmos-and-psyche',
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
    slug: 'way-of-the-psychonaut',
    description: 'A comprehensive guide to the use of psychoactive plants for spiritual growth and exploration.',
    price: 24.95,
    category: 'Books',
    image: 'https://m.media-amazon.com/images/I/71bdBacryqL._SL1500_.jpg',
    amazonUrl: 'https://amzn.to/4pf3bmJ',
    featured: false,
  },
  {
    id: 'the-perennial-philosophy',
    name: 'The Perennial Philosophy',
    slug: 'the-perennial-philosophy',
    description: 'Aldous Huxley\'s classic work on the universal truths found in all spiritual traditions.',
    price: 12.99,
    category: 'Books',
    image: 'https://m.media-amazon.com/images/I/71EOf+r+mHL._SL1360_.jpg',
    amazonUrl: 'https://amzn.to/4pQQfne',
  },
  {
    id: 'the-coming-world-nation',
    name: 'The coming world nation',
    slug: 'the-coming-world-nation',
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
    name: 'JFK to 9/11: Everything Is a Rich Man\'s Trick',
    slug: 'jfk-911-documentary',
    description: 'A comprehensive documentary examining major events through a conspiracy lens.',
    price: 19.99,
    category: 'Documentaries',
    image: 'https://m.media-amazon.com/images/I/81H3aWnIHbL._SL1500_.jpg',
    amazonUrl: 'https://www.amazon.com/dp/B07XXXXXXX?tag=illuminat0005-20',
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

export const amazonCategories = ['Books', 'Documentaries', 'Gear'];