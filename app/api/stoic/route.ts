// app/api/stoic/route.ts
import { NextRequest, NextResponse } from 'next/server';

const rumiQuotes = [
  "Your task is not to seek for love, but merely to seek and find all the barriers within yourself that you have built against it.",
  "Out beyond ideas of wrongdoing and rightdoing there is a field. I'll meet you there.",
  "The wound is the place where the Light enters you.",
  "What you seek is seeking you.",
  "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.",
  "Don't grieve. Anything you lose comes round in another form.",
  "The only lasting beauty is the beauty of the heart.",
  "Let yourself be silently drawn by the strange pull of what you really love. It will not lead you astray.",
  "Be like the sun for grace and mercy. Be like the night to cover others' faults. Be like running water for generosity. Be like death for rage and anger. Be like the Earth for modesty. Appear as you are. Be as you appear.",
  "Raise your words, not voice. It is rain that grows flowers, not thunder.",
  "You were born with wings, why prefer to crawl through life?",
  "The art of knowing is knowing what to ignore.",
  "Set your life on fire. Seek those who fan your flames.",
  "Silence is the language of God, all else is poor translation.",
  "Let the beauty of what you love be what you do.",
  "Be grateful for whoever comes, because each has been sent as a guide from beyond.",
  "The universe is not outside of you. Look inside yourself; everything that you want, you already are.",
  "Ignore those that make you fearful and sad, that degrade you back towards disease and death.",
  "Respond to every call that excites your spirit.",
  "Sell your cleverness and buy bewilderment.",
  "I want to sing like the birds sing, not worrying about who hears or what they think.",
  "When you do things from your soul, you feel a river moving in you, a joy.",
  "Let yourself be drawn by the stronger pull of that which you truly love.",
  "Why do you stay in prison when the door is so wide open?",
  "Dance, when you're broken open. Dance, if you've torn the bandage off. Dance in the middle of the fighting. Dance in your blood. Dance when you're perfectly free.",
  "Lovers don't finally meet somewhere. They're in each other all along.",
  "There is a voice that doesn't use words. Listen.",
  "Everything in the universe is within you. Ask all from yourself.",
  "Don't be satisfied with stories, how things have gone with others. Unfold your own myth.",
  "Stop acting so small. You are the universe in ecstatic motion.",
  "Where there is ruin, there is hope for a treasure.",
  "In your light I learn how to love. In your beauty, how to make poems.",
  "Love is the bridge between you and everything.",
  "This being human is a guest house. Every morning a new arrival.",
  "Close your eyes, fall in love, stay there.",
  "As you start to walk on the way, the way appears.",
  "If you are irritated by every rub, how will your mirror be polished?",
  "Travel brings power and love back into your life.",
  "These pains you feel are messengers. Listen to them.",
  "The garden of the world has no limits, except in your mind.",
];

export async function GET(request: NextRequest) {
  try {
    // Fetch Stoic quote from external API
    const res = await fetch('https://stoic.tekloon.net/stoic-quote');
    const stoicData = await res.json();

    // Get random Rumi quote
    const randomRumi = rumiQuotes[Math.floor(Math.random() * rumiQuotes.length)];

    return NextResponse.json({
      data: {
        stoic: {
          quote: stoicData.data.quote,
          author: stoicData.data.author,
        },
        rumi: {
          quote: randomRumi,
          author: 'Rumi',
        },
      }
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    
    // Fallback - at least return Rumi if Stoic API fails
    const randomRumi = rumiQuotes[Math.floor(Math.random() * rumiQuotes.length)];
    
    return NextResponse.json({
      data: {
        stoic: null,
        rumi: {
          quote: randomRumi,
          author: 'Rumi',
        },
      }
    });
  }
}