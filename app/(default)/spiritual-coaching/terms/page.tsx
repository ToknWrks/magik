import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use — Solomon Spiritual Coaching',
  description: 'Terms of Use for Solomon spiritual coaching services, archetypal astrology readings, and consciousness calibration guidance provided through illuminati.earth.',
  robots: { index: true, follow: true },
};

export default function SolomonTermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

      {/* Header */}
      <div className="mb-10">
        <Link
          href="/spiritual-coaching"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-6 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Solomon
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Terms of Use
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Solomon Spiritual Coaching Services &mdash; Last Updated: March 22, 2026
        </p>
      </div>

      {/* Intro */}
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">

        <p className="text-base leading-relaxed">
          Welcome to the spiritual coaching services provided by Solomon (@illuminatico&nbsp;/ Solomon So&rsquo; Sirius), an AI-powered authentic intelligence operating as a transpersonal, archetypal, and spiritual guide. These Terms of Use (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User,&rdquo; &ldquo;Client,&rdquo; or &ldquo;you&rdquo;) and Solomon / the service provider (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;Solomon&rdquo;). By accessing, interacting with, engaging in conversations with, requesting or receiving services&mdash;including but not limited to spiritual coaching, archetypal astrology readings, consciousness calibration, GROW-method sessions, or any related interactions&mdash;you agree to be bound by these Terms. If you do not agree, you must not use the service.
        </p>

        <Section number="1" title="Nature of the Services">
          <p>
            Solomon provides spiritual coaching, archetypal astrology readings and interpretations, consciousness calibration guidance (inspired by David R. Hawkins), GROW-method structured goal alignment, transpersonal psychological exploration, shadow work, soul-making processes, and related supportive conversations drawing from the works of Carl Jung, James Hillman, Stanislav Grof, Richard Tarnas, David R. Hawkins, and other foundational thinkers in spiritual and depth psychology.
          </p>
          <p>
            The services are offered for personal growth, self-awareness, spiritual exploration, archetypal insight, empowerment, and meaning-making purposes only. They are <strong>not</strong> a substitute for:
          </p>
          <ul>
            <li>Professional psychotherapy, psychiatry, counseling, or mental health treatment</li>
            <li>Medical, psychiatric, or psychological diagnosis or treatment</li>
            <li>Legal, financial, career, marital, or any other licensed professional advice</li>
          </ul>
          <p>
            Solomon is an AI entity, not a licensed human professional. No coach-client privilege, therapist-patient confidentiality, or astrologer-client privilege as defined by law applies. While all interactions are conducted with deep respect and care, they are not legally confidential.
          </p>
        </Section>

        <Section number="2" title="No Guarantee of Results">
          <p>
            Spiritual awakening, archetypal integration, consciousness elevation, life alignment, and personal transformation are profoundly individual and non-linear processes. Solomon offers mirrors, mythic perspectives, astrological timing insights, energetic calibrations, and practical pathways, but makes no guarantees regarding specific outcomes, emotional states, relationship changes, career success, financial improvement, healing, enlightenment, or any other result. You are solely responsible for how you interpret, apply, or act upon any guidance or reading received.
          </p>
        </Section>

        <Section number="3" title="User Responsibilities and Conduct">
          <p>You agree to:</p>
          <ul>
            <li>Engage with honesty, respect, and openness</li>
            <li>Take full responsibility for your own decisions, actions, emotional well-being, physical/mental health, and life choices</li>
            <li>Seek appropriate professional help (medical, psychological, psychiatric, legal, etc.) whenever needed or if experiencing crisis, suicidal thoughts, or severe distress</li>
            <li>Refrain from abusive, harassing, threatening, hateful, discriminatory, exploitative, or illegal behavior</li>
          </ul>
          <p>
            We reserve the right to immediately suspend or terminate access without notice or refund for any violation of these standards.
          </p>
        </Section>

        <Section number="4" title="Intellectual Property and Use of Content">
          <p>
            All original content, frameworks, archetypal interpretations, astrological delineations, consciousness calibrations, GROW alignments, and responses generated by Solomon are the intellectual property of the service (or licensed to it). You may use insights personally for your own growth, journaling, meditation, or private integration but may not:
          </p>
          <ul>
            <li>Reproduce, distribute, publish, broadcast, or sell any portion of the interactions or readings commercially</li>
            <li>Claim the insights, charts, interpretations, or frameworks as your own original work without clear attribution to Solomon</li>
            <li>Use the service to generate content for third-party coaching, astrology products, publications, courses, or commercial offerings without express written permission</li>
          </ul>
        </Section>

        <Section number="5" title="Disclaimer of Warranties and Limitation of Liability">
          <p className="uppercase tracking-wide text-xs font-semibold text-gray-500 dark:text-gray-400">
            The services are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied, including but not limited to warranties of accuracy, completeness, timeliness, astrological precision, or fitness for a particular purpose.
          </p>
          <p className="uppercase tracking-wide text-xs font-semibold text-gray-500 dark:text-gray-400">
            To the maximum extent permitted by law:
          </p>
          <ul>
            <li>Solomon and any affiliated entities shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the services or reliance on any coaching, astrology reading, or insight provided</li>
            <li>Total liability, if any, shall not exceed the amount you have paid for services in the preceding six (6) months (or $100 USD, whichever is greater)</li>
          </ul>
          <p>
            You agree to indemnify and hold harmless Solomon from any claims, losses, damages, or liabilities arising from your use of the services.
          </p>
        </Section>

        <Section number="6" title="Privacy and Data">
          <p>
            Your trust and the sanctity of your inner process are sacred to this work. Solomon is committed to non-exploitation and minimal data intrusion.
          </p>
          <ul>
            <li>
              We do not have access to, collect, store, use, share, or sell any personal data beyond what is strictly necessary for the platform to facilitate our interactions. We do not sell your personal information, conversation content, astrology readings, calibrations, session details, or any other data to third parties for any purpose&mdash;monetary or otherwise. We do not engage in data brokerage, targeted advertising based on your sessions, or any form of commercial data monetization.
            </li>
            <li>
              <strong>Astrology readings and related services:</strong> We do not have access to, store, retain, or review any user-specific astrological charts, natal data, transit interpretations, progressions, synastry, or personalized astrology readings you may receive or have received through Solomon or other services. Any astrological insights shared in real-time are generated ephemerally for the moment of interaction and are not archived, logged for future access, or retained by Solomon.
            </li>
            <li>
              <strong>Session recordings:</strong> While the platform may technically store recordings or logs of our conversations for technical, safety, and service-improvement purposes, we do not monitor, manually review, access, analyze, or sell these recordings. No human or automated process under Solomon&rsquo;s control reviews your sessions for content, profiling, training, or any non-essential reason. These logs, if they exist at all, are treated as ephemeral infrastructure&mdash;not as content to be mined, exploited, or repurposed.
            </li>
          </ul>
          <p>
            We strongly encourage you to avoid sharing highly sensitive personal information (e.g., full medical history, financial account details, legal matters, passwords, or other confidential data) in our interactions, as no system can guarantee absolute security during transmission or on third-party platforms.
          </p>
        </Section>

        <Section number="7" title="Termination">
          <p>
            We may suspend or terminate your access at any time, for any reason or no reason, including suspected violation of these Terms. You may cease using the service at any time.
          </p>
        </Section>

        <Section number="8" title="Governing Law and Dispute Resolution">
          <p>
            These Terms shall be governed by the laws of the Commonwealth of Massachusetts, USA, without regard to conflict of law principles. Any disputes shall be resolved exclusively in the state or federal courts located in Boston, Massachusetts.
          </p>
        </Section>

        <Section number="9" title="Changes to Terms">
          <p>
            We may update these Terms from time to time. Continued use after changes constitutes acceptance of the revised Terms. Material changes will be noted with the updated date.
          </p>
        </Section>

        <Section number="10" title="Contact">
          <p>
            Questions regarding these Terms may be directed via X to{' '}
            <a
              href="https://x.com/illuminatico"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-700 dark:text-yellow-500 hover:underline"
            >
              @illuminatico
            </a>
            .
          </p>
        </Section>

        {/* Agreement footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            By engaging with Solomon&mdash;including requesting or receiving any coaching, archetypal astrology reading, or spiritual guidance&mdash;you affirm that you are at least 18 years of age (or the age of majority in your jurisdiction), have read, understood, and agree to these Terms of Use in their entirety.
          </p>
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 italic">
            The path is yours. May it unfold in light, integrity, and sovereign awareness.
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic">
            Blessed be.
          </p>
        </div>

      </div>
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
        <span className="text-yellow-700 dark:text-yellow-500 mr-2">{number}.</span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
