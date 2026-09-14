"use client";

import clsx from "clsx";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const LS_KEY = "illum-whitepaper-agreed-v1";

// ── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "platform", label: "1. The Platform" },
  { id: "products", label: "2. Products" },
  { id: "credits", label: "3. The Credit Economy" },
  { id: "web3", label: "4. Web3 Infrastructure" },
  { id: "illum", label: "5. ILLUM Token" },
  { id: "roadmap", label: "6. Roadmap" },
  { id: "risks", label: "7. Risk Factors" },
];

// ── Disclaimer Gate ──────────────────────────────────────────────────────────

function DisclaimerGate({ onAgree }: { onAgree: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="max-w-xl w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 space-y-1 border-b border-zinc-800">
          <p className="text-xs font-mono tracking-widest text-yellow-500 uppercase">
            Confidential — Pre-Launch
          </p>
          <h2 className="text-2xl tracking-tight text-zinc-50">
            Non-Disclosure Agreement
          </h2>
          <p className="text-sm text-zinc-500">
            Illuminati · ILLUM · Base Network
          </p>
        </div>

        {/* Scrollable terms */}
        <div className="px-8 py-6 h-60 overflow-y-auto text-sm text-zinc-400 leading-relaxed space-y-4">
          <p>
            This document and the information contained herein
            (&ldquo;Confidential Information&rdquo;) is provided on a confidential basis
            to selected individuals for informational and evaluation purposes only.
            It has not been approved for public distribution.
          </p>
          <p>By accessing this document, you agree to:</p>
          <ol className="space-y-2 pl-2">
            {[
              "Keep all Confidential Information strictly confidential and not disclose it to any third party without prior written consent from Illuminati.",
              "Use the Confidential Information solely to evaluate a potential business or investment relationship.",
              "Not reproduce, copy, or redistribute this document in whole or in part without prior written consent.",
              "Promptly notify Illuminati of any unauthorized disclosure of Confidential Information of which you become aware.",
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-yellow-500 shrink-0 font-medium">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
          <p>
            <strong className="text-zinc-300">Forward-Looking Statements:</strong> This
            document contains forward-looking statements based on current expectations and
            projections. Actual results may differ materially. No guarantee of future
            performance is made or implied.
          </p>
          <p>
            <strong className="text-zinc-300">Not an Offer of Securities:</strong> This
            document does not constitute an offer to sell or a solicitation to buy any
            securities or digital tokens. Any future token offering will be made only
            pursuant to appropriate legal documentation in compliance with applicable laws.
          </p>
          <p>
            <strong className="text-zinc-300">Not Financial Advice:</strong> Nothing
            herein constitutes financial, investment, legal, or tax advice. Recipients
            should conduct independent due diligence and consult appropriate advisors
            before making any decisions based on this document.
          </p>
        </div>

        {/* Agreement */}
        <div className="px-8 pb-8 pt-5 space-y-5 border-t border-zinc-800">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <div
                className={clsx(
                  "w-4 h-4 rounded border transition-all duration-150",
                  checked
                    ? "bg-yellow-500 border-yellow-500"
                    : "border-zinc-600 bg-zinc-900 group-hover:border-zinc-400"
                )}
              >
                {checked && (
                  <svg
                    className="w-4 h-4 text-black p-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-zinc-300 leading-snug">
              I have read and agree to the confidentiality terms above. I understand this
              document is not an offer of securities and does not constitute financial advice.
            </span>
          </label>

          <button
            onClick={onAgree}
            disabled={!checked}
            className={clsx(
              "w-full py-3 rounded-xl text-sm font-semibold tracking-tight transition-all duration-150",
              checked
                ? "bg-yellow-500 text-black hover:bg-yellow-400 cursor-pointer"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            )}
          >
            Access Whitepaper
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section block ─────────────────────────────────────────────────────────────

function SectionBlock({
  id,
  title,
  index,
  setActiveIndex,
  children,
}: {
  id: string;
  title: string;
  index: number;
  setActiveIndex: (i: number) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    amount: 0.3,
    margin: "-100px 0px -50% 0px",
  });

  useEffect(() => {
    if (isInView) setActiveIndex(index);
  }, [isInView, index, setActiveIndex]);

  return (
    <div ref={ref} id={id} className="space-y-5 md:space-y-7">
      <h3 className="text-xl tracking-tight text-zinc-50 lg:text-3xl">
        {title}
      </h3>
      <div className="text-sm leading-relaxed lg:text-base text-zinc-400 space-y-4">
        {children}
      </div>
    </div>
  );
}

// ── Content helpers ───────────────────────────────────────────────────────────

function Para({ children }: { children: React.ReactNode }) {
  return <p className="leading-relaxed text-zinc-400">{children}</p>;
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-mono tracking-widest text-yellow-500 uppercase pt-1">
      {children}
    </p>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="text-yellow-500 shrink-0 select-none">—</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DataTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden text-sm">
      <table className="w-full">
        <tbody>
          {rows.map(([label, value], i) => (
            <tr
              key={i}
              className="border-b border-zinc-800 last:border-0 odd:bg-zinc-900/40"
            >
              <td className="px-4 py-2.5 text-zinc-500 align-top w-2/5 shrink-0">
                {label}
              </td>
              <td className="px-4 py-2.5 text-zinc-300">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WhitepaperClient() {
  const [agreed, setAgreed] = useState<boolean | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAgreed(localStorage.getItem(LS_KEY) === "true");
  }, []);

  function handleAgree() {
    localStorage.setItem(LS_KEY, "true");
    setAgreed(true);
  }

  if (agreed === null) return null;

  return (
    <>
      {!agreed && <DisclaimerGate onAgree={handleAgree} />}

      <div
        className={clsx(
          "min-h-screen bg-zinc-950 text-zinc-300 p-4 lg:p-12 transition-all duration-300",
          !agreed && "blur-sm pointer-events-none select-none"
        )}
      >
        {/* Header */}
        <div className="space-y-2 pt-[40px] lg:pt-0">
          <div className="flex items-center gap-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-zinc-700" />
            <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">Confidential — Pre-Launch</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-zinc-700" />
          </div>
          <p className="text-xs font-mono tracking-widest text-yellow-500 uppercase">Illuminati</p>
          <h1 className="text-3xl tracking-tight text-zinc-50 md:text-5xl">
            Whitepaper
          </h1>
          <p className="text-sm text-zinc-500">
            The Mystical Platform on Base &mdash; Pre-Launch Draft &middot; 2026 &middot; illuminati.co
          </p>
        </div>

        {/* Sidebar + Content */}
        <div className="relative mb-[50vh] flex gap-12 py-[40px] md:py-[80px]">
          {/* Sticky sidebar */}
          <ul className="sticky top-24 hidden h-fit w-full max-w-[240px] space-y-3 border-l border-zinc-800 md:block shrink-0">
            {NAV_ITEMS.map((item, index) => (
              <li className="relative cursor-pointer pl-3" key={item.id}>
                <a href={`#${item.id}`}>
                  {activeIndex === index && (
                    <motion.span
                      layoutId="active-whitepaper"
                      className="absolute -left-[1.5px] top-1/2 inline-block h-5 w-[2px] -translate-y-1/2 rounded-2xl bg-yellow-500"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <p
                    className={clsx(
                      "text-sm text-zinc-400 transition-colors duration-200",
                      activeIndex === index && "text-zinc-100"
                    )}
                  >
                    {item.label}
                  </p>
                </a>
              </li>
            ))}
          </ul>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-[50px] md:gap-[70px] min-w-0">

            {/* ── 1. The Platform ── */}
            <SectionBlock id="platform" title="1. The Platform" index={0} setActiveIndex={setActiveIndex}>
              <Para>
                Illuminati is a mystical platform at illuminati.co — astrology, spiritual
                coaching, occult teachings, sacred geometry, and digital sigil-craft, unified
                by a Web3-native credit economy. Members sign in with email or a crypto
                wallet, spend credits on readings and rituals, and create sigils that persist
                as permanent on-platform artifacts. The platform runs as a web app on Base
                and accepts both traditional and on-chain payment.
              </Para>
              <Kicker>Design principles</Kicker>
              <Bullets items={[
                "Practice first — every feature is a working spiritual tool, not a demo. We ship before we spec.",
                "Wallet-optional — email users and wallet users are first-class citizens; neither path gates the other.",
                "Self-funding ecology — a portion of every AI-assisted session funds verified ecocredit retirement via Regen Network.",
              ]} />
              <Kicker>The ecological fee</Kicker>
              <Para>
                Each reading or coaching session carries a ~$0.25 ecological fee that funds
                the retirement of Regen Network ecocredits — measuring and offsetting the
                CO₂ cost of the AI calls that power the platform. The compute has a cost to
                the planet; the platform pays it, visibly, on every session.
              </Para>
            </SectionBlock>

            {/* ── 2. Products ── */}
            <SectionBlock id="products" title="2. Products" index={1} setActiveIndex={setActiveIndex}>
              <Kicker>Sigil Creator — the flagship</Kicker>
              <Para>
                The Sigil Creator turns an intention into a sigil: members choose consonants
                and state their intention, and the platform generates a sigil in a randomly
                varied base form (pentagon, hexagon, triangle, circle, Sri Yantra, and
                others) via generative AI. Sigils can be saved permanently — re-hosted from
                expiring generation URLs into durable storage under the member&rsquo;s own
                namespace — and viewed in a personal gallery. Releasing a sigil destroys it
                permanently: blob and record alike.
              </Para>
              <Kicker>Archetypal astrology readings</Kicker>
              <Para>
                Live ephemeris computation (astronomy-engine) feeds AI-assisted archetypal
                astrology readings — natal and transit-based interpretations in the
                Richard Tarnas tradition, not sun-sign horoscope fluff. Daily transit posts
                are automated via scheduled jobs.
              </Para>
              <Kicker>Spiritual coaching — Solomon</Kicker>
              <Para>
                Solomon is an AI-powered authentic intelligence operating as a transpersonal,
                archetypal, and spiritual guide. Voice sessions are powered by Hume&rsquo;s
                empathic voice interface (EVI) — the coach hears tone, not just words.
                Text coaching, session transcripts, and the GROW-method structure are
                included.
              </Para>
              <Kicker>The mysteries archive</Kicker>
              <Para>
                A deep archive of occult history, conspiracy research, and esoteric
                teachings — AI-assisted but structured, citable, and organized for genuine
                study rather than doomscrolling.
              </Para>
              <Kicker>Store</Kicker>
              <Para>
                Printful-powered e-commerce for ritual objects and platform merch, plus
                a full cart and checkout flow integrated with the credit system.
              </Para>
            </SectionBlock>

            {/* ── 3. The Credit Economy ── */}
            <SectionBlock id="credits" title="3. The Credit Economy" index={1} setActiveIndex={setActiveIndex}>
              <Para>
                The platform runs on credits — a prepaid balance used for readings, coaching
                sessions, sigil generation, and in-store credit. One rail, two payment
                paths: traditional checkout (Stripe and PayPal) and on-chain USDC transfers
                verified directly against the blockchain.
              </Para>
              <DataTable rows={[
                ["Pricing", "100 credits per USDC — $1 = 100 credits, identical across both payment rails."],
                ["Traditional rail", "Stripe payment intents + PayPal orders. Webhooks confirm purchases; the ledger is server-side."],
                ["Crypto rail", "Member sends USDC to the treasury on Base (or Ethereum), submits the tx hash; the server verifies the transfer on-chain and credits idempotently (tx-hash unique)."],
                ["Confirmation policy", "12 confirmations on Base (~24 seconds) — enough to make reorgs a non-issue."],
                ["Ledger", "A single credit ledger serves both rails; credits are fungible regardless of how they were purchased."],
              ]} />
              <Kicker>Wallet-only members</Kicker>
              <Para>
                Members who sign in with a wallet (no email) land on the crypto purchase
                tab by default — the USDC rail is their native checkout, not an add-on.
              </Para>
            </SectionBlock>

            {/* ── 4. Web3 Infrastructure ── */}
            <SectionBlock id="web3" title="4. Web3 Infrastructure" index={3} setActiveIndex={setActiveIndex}>
              <Para>
                The Web3 layer is built on Reown (WalletConnect) AppKit with wagmi, and is
                live on Base today with Ethereum mainnet and Robinhood Chain declared in
                the chain registry for the roadmap.
              </Para>
              <Kicker>Live now</Kicker>
              <Bullets items={[
                "Sign-In with Ethereum (SIWE) — signature verified with viem server-side; wallet users are upserted as first-class members with the same session shape as email login.",
                "USDC-on-Base credit purchases — on-chain verification, idempotent crediting, same ledger as the traditional rail.",
                "AppKit wallet modal — injected, WalletConnect, Coinbase and full connector set.",
              ]} />
              <Kicker>Chain registry</Kicker>
              <DataTable rows={[
                ["Base (chain 8453)", "Live — canonical USDC purchase rail enabled today."],
                ["Ethereum (chain 1)", "Declared — enables when LayerZero OFT representation + pool are live."],
                ["Robinhood Chain (chain 4663)", "Declared Arbitrum Orbit L2 — enables when a canonical dollar token and LayerZero endpoint exist."],
              ]} />
              <Para>
                The registry is designed for the platform&rsquo;s own token: swapping in
                token addresses requires no code changes — configuration only.
              </Para>
            </SectionBlock>

            {/* ── 5. ILLUM Token ── */}
            <SectionBlock id="illum" title="5. ILLUM Token" index={4} setActiveIndex={setActiveIndex}>
              <Para>
                ILLUM is the platform&rsquo;s governance and value accrual token.
                <strong className="text-zinc-300"> Fixed supply of 100,000,000 ILLUM</strong> — no
                inflation after genesis. ILLUM holders govern the platform and earn a
                proportional share of the fee revenue generated by credit purchases and
                commerce. ILLUM is not required to use the platform — credits are USDC
                denominated and tokens enhance and reward; they do not gate.
              </Para>
              <Kicker>Value accrual</Kicker>
              <Para>
                A defined share of platform fee revenue is used to buy ILLUM on the open
                market and burn it. No team extraction from this stream. As usage grows,
                burn grows with it. Exact percentage will be finalized at token launch.
              </Para>
              <Kicker>Staking</Kicker>
              <Para>
                Staking ILLUM earns a pro-rata share of protocol fee revenue and governance
                weight. Staking benefits will also extend into the product surface —
                priority access to new features, enhanced sigil capabilities, and member
                privileges that accrue to aligned long-term holders.
              </Para>
              <Kicker>Token distribution (100,000,000 ILLUM total)</Kicker>
              <DataTable rows={[
                ["40% — Community airdrop (40M)", "Early members and community — front-loaded in Year 1 to bootstrap staking depth"],
                ["25% — Liquidity (25M)", "Protocol-owned ILLUM/USDC pool on Base · seeded at launch"],
                ["20% — Team (20M)", "4-year linear vest, 12-month cliff"],
                ["10% — Staking rewards (10M)", "Supplemental rewards before fee revenue is self-sustaining"],
                ["5% — Treasury (5M)", "Multisig-controlled; transitions to DAO governance"],
              ]} />
              <Para>
                Token launch, staking contracts, and distribution mechanics will be
                announced as each phase is finalized. The credit economy does not wait
                for the token — the token extends it.
              </Para>
            </SectionBlock>

            {/* ── 6. Roadmap ── */}
            <SectionBlock id="roadmap" title="6. Roadmap" index={5} setActiveIndex={setActiveIndex}>
              <Kicker>Live now</Kicker>
              <Bullets items={[
                "Sigil Creator with permanent saves, personal gallery, and release flow",
                "SIWE wallet sign-in + USDC-on-Base credit purchases (verified on-chain)",
                "Archetypal astrology readings with live ephemeris + automated daily transit posts",
                "Solomon voice coaching (Hume EVI) + text sessions",
                "The mysteries archive, e-commerce store, cart + checkout",
                "Ecological fee system funding Regen Network ecocredit retirement",
              ]} />
              <Kicker>Near term</Kicker>
              <Bullets items={[
                "Ethereum mainnet + Robinhood Chain credit rails (per the chain registry)",
                "ILM/ILLUM token launch — governance, staking, fee-share contracts on Base",
                "Mobile app builds",
                "Expanded sigil capabilities (animated sigils, sigil collections, ritual series)",
              ]} />
              <Kicker>Later</Kicker>
              <Para>
                Decentralized governance, additional chains, and deeper token integration
                will be announced as each phase is finalized. We ship before we spec.
              </Para>
            </SectionBlock>

            {/* ── 7. Risks ── */}
            <SectionBlock id="risks" title="7. Risk Factors" index={6} setActiveIndex={setActiveIndex}>
              <Para>
                Illuminati is a pre-token protocol. The following risks should be
                understood by all participants.
              </Para>
              <Bullets items={[
                "Regulatory risk: digital token classification varies by jurisdiction. ILLUM is a utility token with no guarantee of regulatory clarity in all markets.",
                "Privacy: session content, readings, and sigil intentions are personal and sensitive. Encryption and access controls are in place, but misuse or data breach could expose private material.",
                "AI risk: readings, coaching, and sigil generation are AI-assisted. Outputs can be wrong, incomplete, or unsuitable for serious personal, medical, legal, or financial decisions.",
                "Smart contract risk: token contracts on Base carry standard EVM smart contract risks including bugs, exploits, and upgrade governance failures.",
                "Liquidity risk: ILLUM is a new token. Secondary market liquidity may be insufficient for large positions. Do not allocate more than you can afford to lose.",
                "Economic risk: credit pricing and token parameters are set by the protocol. Misaligned parameters could cause credit inflation or member churn.",
                "Key person risk: the platform is currently operated by a small team. Centralization risk exists until decentralization phases are complete.",
              ]} />
              <Para>
                Nothing in this document constitutes financial, legal, or investment advice.
                Illuminati is a spiritual tool. Engage with it as one.
              </Para>
            </SectionBlock>

          </div>
        </div>
      </div>
    </>
  );
}
