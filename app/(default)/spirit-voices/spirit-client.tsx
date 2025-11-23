// app/store/store-client.tsx
'use client';

import { useState } from 'react';
import { Boundary } from '@/components/ui/boundary';
import Link from 'next/link';
import Image from 'next/image';
import SpiritImage1 from '@/public/images/Spirit1.png'
import SpiritImage2 from '@/public/images/Spirit2.png'
import SpiritImage3 from '@/public/images/Spirit3.png'
import SpiritImage4 from '@/public/images/Spirit4.png'
import SpiritImage5 from '@/public/images/Spirit5.png'
import SpiritImage6 from '@/public/images/Spirit6.png'
import SpiritImage7 from '@/public/images/Spirit7.png'
import SpiritImage8 from '@/public/images/Spirit8.png'
import SpiritImage9 from '@/public/images/Spirit9.png'
import SpiritImage10 from '@/public/images/Spirit10.png'
import SpiritImage11 from '@/public/images/Spirit11.png'
import SpiritImage12 from '@/public/images/Spirit12.png'
import SpiritImage13 from '@/public/images/Spirit12.png'
import SpiritImage14 from '@/public/images/Spirit12.png'

const spirits = [
  {
    id: 1,
    name: "Aatma",
    chakra: 0,
    category: "~",
    image: "SpiritImage1",
    description: "All beings by nature are Buddha, As ice by nature is water. Apart from water there is no ice; Apart from beings, no Buddha.",
    inStock: true,
    featured: false,
    essence: "The essence of Aatma is the eternal soul that transcends physical existence, embodying purity, consciousness, and the infinite nature of being."
    
  },
  {
    id: 2,
    name: "Brahma",
    chakra: 0,
    category: "~",
    category2: "Aatma",
    category3: "Brahma",
    image: "SpiritImage2",
    description: "How sad that people ignore the near, and search for truth afar: Like someone in the midst of water Crying out in thirst",
    inStock: true,
    featured: false,
    essence: "The essence of Brahma is the cosmic principle of creation, representing the infinite potential and interconnectedness of all existence."
  },
  {
    id: 3,
    name: "Vishnu",
    chakra: 0,
    category: "~",
    category2: "Aatma",
    category3: "Brahma",
    category4: "Vishnu",
    image: "SpiritImage3",
    description: "Like a child of a wealthy home wandering among the poor.",
    inStock: true,
    featured: false,
    essence: "The essence of Vishnu is the divine preserver and protector of the universe, embodying compassion, balance, and the sustenance of life."
  },
  {
    id: 4,
    name: "Shiva",
    chakra: 0,
    category: "~",
    category2: "Aatma",
    category3: "Brahma",
    category4: "Vishnu",
    category5: "Shiva",
    image: "SpiritImage4",
    description: "Lost on dark paths of ignorance, we wander through the Six Worlds, from dark path to dark path",
    inStock: true,
    featured: false,
    essence: "The essence of Shiva is the transformative power of destruction and renewal, symbolizing the cyclical nature of life, death, and rebirth."
  },
  {
    id: 5,
    name: "Lakshmi",
    chakra: 1,
    category: "Anahata",
    category2: "Aatma",
    category3: "Brahma",
    category4: "Vishnu",
    category5: "Shiva",
    category6: "Lakshmi",
    image: "SpiritImage5",
    description: "When shall we be freed from birth and death? Oh, the Zazen of the Mahayana! To this the highest praise!",
    inStock: true,
    featured: false,
    essence: "The essence of Lakshmi is the embodiment of wealth, prosperity, and abundance, representing both material and spiritual richness in life."
  },
  {
    id: 6,
    name: "Bhu-Devi",
    chakra: 1,
    category: "Anahata",
    category2: "Aatma",
    category3: "Brahma",
    category4: "Vishnu",
    category5: "Shiva",
    category6: "Lakshmi",
    category7: "Bhu-Devi",
    image: "SpiritImage6",
    description: "Devotion, repentance, training, The many paramitas -- All have their source in Zazen.",
    inStock: true,
    featured: false,
    essence: "The essence of Bhu-Devi is the nurturing and sustaining force of the Earth, symbolizing fertility, growth, and the interconnectedness of all life."
  },
  {
    id: 7,
    name: "Sarasvati",
    chakra: 2,
    category: "Visuddha",
    category2: "Aatma",
    category3: "Brahma",
    category4: "Vishnu",
    category5: "Shiva",
    category6: "Lakshmi",
    category7: "Bhu-Devi",
    category8: "Sarasvati",
    image: "SpiritImage7",
    description: "Those who try Zazen even once wipe away beginning-less crimes. Where are all the dark paths then?",
    inStock: true,
    featured: false,
    essence: "The essence of Sarasvati is the divine embodiment of knowledge, wisdom, and the arts, inspiring creativity, learning, and eloquence."
  },
  {
    id: 8,
    name: "Gayatri Devi",
    chakra: 3,
    category: "Ajna",
    category2: "Aatma",
    category3: "Brahma",
    category4: "Vishnu",
    category5: "Shiva",
    category6: "Lakshmi",
    category7: "Bhu-Devi",
    category8: "Sarasvati",
    category9: "Gayatri Devi",
    image: "SpiritImage8",
    description: "The pure land itself is near. Those who hear this truth even once, and listen with a grateful heart,treasuring it, revering it, gain blessings without end.",
    inStock: true,
    featured: false,
    essence: "The essence of Gayatri Devi is the personification of the sacred Gayatri Mantra, symbolizing spiritual illumination, divine wisdom, and the awakening of consciousness."
  },
  {
    id: 9,
    name: "Parvati",
    chakra: 3,
    category: "Ajna",
    category2: "Aatma",
    category3: "Brahma",
    category4: "Vishnu",
    category5: "Shiva",
    category6: "Lakshmi",
    category7: "Bhu-Devi",
    category8: "Sarasvati",
    category9: "Gayatri Devi",
    category10: "Parvati",
    image: "SpiritImage9",
    description: "Much more, those who turn about and bear witness to self-nature, Self-nature that is no-nature, go far beyond mere doctrine.",
    inStock: true,
    featured: false,
    essence: "The essence of Parvati is the divine feminine energy that embodies love, devotion, and strength, representing the dynamic balance of power and compassion."
  },
  {
    id: 10,
    name: "Durga",
    chakra: 4,
    category: "Manipura",
    category2: "Aatma",
    category3: "Brahma",
    category4: "Vishnu",
    category5: "Shiva",
    category6: "Lakshmi",
    category7: "Bhu-Devi",
    category8: "Sarasvati",
    category9: "Gayatri Devi",
    category10: "Parvati",
    category11: "Durga",
    image: "SpiritImage10",
    description: "Here effect and cause are the same, The Way is neither two nor three.",
    inStock: true,
    featured: false,
    essence: "The essence of Durga is the fierce and protective goddess who embodies strength, courage, and the triumph of good over evil."
  },
  {
    id: 11,
    name: "Kali",
    chakra: 4,
    category: "Manipura",
    category2: "Aatma",
    category3: "Brahma",
    category4: "Vishnu",
    category5: "Shiva",
    category6: "Lakshmi",
    category7: "Bhu-Devi",
    category8: "Sarasvati",
    category9: "Gayatri Devi",
    category10: "Parvati",
    category11: "Durga",
    category12: "Kali",
    image: "SpiritImage11",
    description: "With form that is no-form, going and coming, we are never astray",
    inStock: true,
    featured: false,
    essence: "The essence of Kali is the powerful goddess of time and transformation, symbolizing destruction of ego, liberation, and the cyclical nature of life."
  },
  {
    id: 12,
    name: "Isvara",
    chakra: 5,
    category: "Svadhisthana",
    category2: "Aatma",
    category3: "Brahma",
    category4: "Vishnu",
    category5: "Shiva",
    category6: "Lakshmi",
    category7: "Bhu-Devi",
    category8: "Sarasvati",
    category9: "Gayatri Devi",
    category10: "Parvati",
    category11: "Durga",
    category12: "Kali",
    category13: "Isvara",
    image: "SpiritImage12",
    description: "With thought that is no-thought,Singing and dancing are the voice of the Law.",
    inStock: true,
    featured: false,
    essence: "The essence of Isvara is the supreme divine consciousness that governs the universe, embodying omnipotence, omniscience, and the ultimate reality."
  },
  {
    id: 13,
    name: "Ayyapa",
    chakra: 6,
    category: "Muladhara",
    category2: "Aatma",
    category3: "Brahma",
    category4: "Vishnu",
    category5: "Shiva",
    category6: "Lakshmi",
    category7: "Bhu-Devi",
    category8: "Sarasvati",
    category9: "Gayatri Devi",
    category10: "Parvati",
    category11: "Durga",
    category12: "Kali",
    category13: "Isvara",
    category14: "Ayyapa",
    image: "SpiritImage13",
    description: "Boundless and free is the sky of Samádhi! Bright the full moon of wisdom! Truly, is anything missing now?",
    inStock: true,
    featured: false,
    essence: "The essence of Ayyapa is the embodiment of dharma and righteousness, symbolizing the union of divine energies and the triumph of good over evil."
  },
  {
    id: 14,
    name: "Brahman",
    chakra: 7,
    category: "Sahasrara",
    category2: "Aatma",
    category3: "Brahma",
    category4: "Vishnu",
    category5: "Shiva",
    category6: "Lakshmi",
    category7: "Bhu-Devi",
    category8: "Sarasvati",
    category9: "Gayatri Devi",
    category10: "Parvati",
    category11: "Durga",
    category12: "Kali",
    category13: "Isvara",
    category14: "Ayyapa",
    category15: "Brahman",
    image: "SpiritImage14",
    description: "Nirvana is right here, before our eyes, This very place is the Lotus Land, This very body, the Buddha",
    inStock: true,
    featured: false,
    essence: "The essence of Brahman is the ultimate, unchanging reality amidst and beyond the world, representing the infinite, eternal, and all-encompassing nature of existence."
  }
];

export function StoreClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [selectedSpirit, setSelectedSpirit] = useState<Spirit | null>(null);

  interface Spirit {
    id: number;
    name: string;
    chakra: number;
    category: string;
    category2?: string;
    category3?: string;
    category4?: string;
    category5?: string;
    category6?: string;
    category7?: string;
    category8?: string;
    category9?: string;
    category10?: string;
    category11?: string;
    category12?: string;
    category13?: string;
    category14?: string;
    category15?: string;
    image: string;
    description: string;
    inStock: boolean;
    featured: boolean;
    essence: string;
    originalPrice?: number;
  }

  const openModal = (spirit: Spirit) => {
    setSelectedSpirit(spirit);
  };

  const closeModal = () => {
    setSelectedSpirit(null);
  };

  const categories = ['All', ...Array.from(new Set(spirits.map(p => p.category)))];
  const spiritImageMap: { [key: string]: string } = {
    "SpiritImage1": SpiritImage1.src,
    "SpiritImage2": SpiritImage2.src,
    "SpiritImage3": SpiritImage3.src,
    "SpiritImage4": SpiritImage4.src,
    "SpiritImage5": SpiritImage5.src,
    "SpiritImage6": SpiritImage6.src,
    "SpiritImage7": SpiritImage7.src,
    "SpiritImage8": SpiritImage8.src,
    "SpiritImage9": SpiritImage9.src,
    "SpiritImage10": SpiritImage10.src,
    "SpiritImage11": SpiritImage11.src,
    "SpiritImage12": SpiritImage12.src,
    "SpiritImage13": SpiritImage13.src,
    "SpiritImage14": SpiritImage14.src,  };
  const filteredSpirits = spirits.filter(spirit => {
    return selectedCategory === 'All' || spirit.category === selectedCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.chakra - b.chakra;
      case 'price-high':
        return b.chakra - a.chakra;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'featured':
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });

  return (
    <Boundary
      label="Spirit Voices"
      animateRerendering={false}
      kind="solid"
      className="flex flex-col gap-9"
    >
      <div className="text-center mb-8">
        
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
          An ode to the "Song of Zazen" by Hakuin Zenji, this collection invites you to explore the depths of Zen practice and philosophy. Each piece is a meditation on the nature of existence, mindfulness, and the path to enlightenment.
        </p>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <div className="flex gap-2 flex-wrap justify-center">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
          >
            <option value="featured">Chakra</option>
            <option value="price-low">Chakra: Low to High</option>
            <option value="price-high">Chakra: High to Low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpirits.map((spirit) => (
          <div
            key={spirit.id}
            className="group flex flex-col gap-4 rounded-lg bg-gray-50 px-6 py-6 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 transition-all duration-200 hover:shadow-lg cursor-pointer"
            onClick={() => openModal(spirit)}
          >
            <div className="relative">
              <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                <img
                  src={spiritImageMap[spirit.image]}
                  alt={spirit.name}
                  width={286}
                  height={286}
                  className="w-full h-48 object-cover"
                />
              </div>
              
              {spirit.featured && (
                <span className="absolute top-2 left-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  Featured
                </span>
              )}
              
              {!spirit.inStock && (
                <span className="absolute top-2 right-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  Out of Stock
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {spirit.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                   
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => openModal(spirit)}
              className="text-sm font-medium text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
            >
              View More -&gt;
            </button>
          </div>
        ))}
      </div>
          {/* Modal */}
      {selectedSpirit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">{selectedSpirit.name}</h2>
            <img
              src={spiritImageMap[selectedSpirit.image]}
              alt={selectedSpirit.name}
              className="w-full h-64 md:h-96 object-cover pb-2"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-bold">{selectedSpirit.description}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedSpirit.essence}</p>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                {selectedSpirit.category}
              </span>
              {selectedSpirit.category2 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedSpirit.category2}
                </span>
              )}
              {selectedSpirit.category3 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedSpirit.category3}
                </span>
              )}
              {selectedSpirit.category4 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedSpirit.category4}
                </span>
              )}
              {selectedSpirit.category5 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedSpirit.category5}
                </span>
              )}
              {selectedSpirit.category6 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedSpirit.category6}
                </span>
              )}
              {selectedSpirit.category7 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedSpirit.category7}
                </span>
              )}
              {selectedSpirit.category8 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedSpirit.category8}
                </span>
              )}
              {selectedSpirit.category9 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedSpirit.category9}
                </span>
              )}
              {selectedSpirit.category10 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedSpirit.category10}
                </span>
              )}
              {selectedSpirit.category11 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedSpirit.category11}
                </span>
              )}
              {selectedSpirit.category12 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedSpirit.category12}
                </span>
              )}
              {selectedSpirit.category13 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedSpirit.category13}
                </span>
              )}
              {selectedSpirit.category14 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedSpirit.category14}
                </span>
              )}
              {selectedSpirit.category15 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedSpirit.category15}
                </span>
              )}
            </div>
            <button onClick={closeModal} className="px-4 py-2 bg-gray-600 text-white rounded">Close</button>
          </div>
        </div>
      )}

      {filteredSpirits.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No products found in this category.
          </p>
        </div>
      )}

      
    </Boundary>
  );
}