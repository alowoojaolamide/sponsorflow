import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Mail, Sparkles, Building2, TrendingUp, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas-night text-on-primary selection:bg-aloe-10 selection:text-ink">
      {/* 1. Cinematic Navigation Bar (nav-bar-dark) */}
      <header className="w-full border-b border-hairline-dark/40 bg-canvas-night/80 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl font-medium tracking-tight text-on-primary">
            SPONSOR<span className="text-aloe-10 font-normal">FLOW</span>
          </span>
          <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-pill text-[11px] font-medium bg-hairline-dark text-link-mint">
            UK Visa Tech Engine
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-normal text-shade-40">
          <a href="#how-it-works" className="hover:text-on-primary transition-colors">How It Works</a>
          <a href="#sponsors" className="hover:text-on-primary transition-colors">54 Curated Sponsors</a>
          <a href="#anti-spam" className="hover:text-on-primary transition-colors">Anti-Spam Guarantee</a>
          <Link href="/analytics" className="hover:text-on-primary transition-colors">Live Pipeline</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-on-primary hover:bg-hairline-dark hover:text-on-primary text-sm">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline-dark" size="sm" className="text-sm">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Hero Section: Cinematic Typography & Headline (display-xxl at weight 330) */}
      <section className="relative px-6 lg:px-16 pt-24 pb-28 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill bg-hairline-dark/60 border border-hairline-dark mb-8 text-xs font-medium text-aloe-10">
          <Sparkles className="w-3.5 h-3.5" />
          <span>UK Skilled Worker Visa Outreach • 54 Verified Tech Sponsors</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-[0.02em] font-display leading-[1.05] text-on-primary max-w-5xl">
          Get hired by UK tech sponsors. <br className="hidden md:block" />
          <span className="text-shade-40">Without sending spam.</span>
        </h1>

        <p className="mt-8 text-lg md:text-xl font-normal text-shade-40 max-w-2xl leading-relaxed">
          SponsorFlow is your personal AI-powered job acquisition engine. We pair your verified experience with curated UK sponsor intelligence to generate high-conversion outreach emails—reviewed and approved by you.
        </p>

        {/* Hero CTAs */}
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
          <Link href="/signup">
            <Button variant="outline-dark" size="lg" className="min-w-[200px] text-base group">
              Start Your Outreach
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="lg" className="text-shade-40 hover:text-on-primary text-base">
              View Demo Dashboard
            </Button>
          </Link>
        </div>

        {/* Stats Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 mt-20 pt-12 border-t border-hairline-dark/40 w-full max-w-4xl text-left">
          <div>
            <div className="text-3xl md:text-4xl font-light font-display text-on-primary">54</div>
            <div className="text-xs text-shade-40 mt-1 uppercase tracking-wider">Curated Tech Sponsors</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-light font-display text-aloe-10">100%</div>
            <div className="text-xs text-shade-40 mt-1 uppercase tracking-wider">Human Approved Drafts</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-light font-display text-on-primary">20/day</div>
            <div className="text-xs text-shade-40 mt-1 uppercase tracking-wider">Reputation Safety Cap</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-light font-display text-on-primary">6–8 wks</div>
            <div className="text-xs text-shade-40 mt-1 uppercase tracking-wider">Target to 5–10 Interviews</div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Pipeline Preview Section (card-feature-cinematic) */}
      <section id="how-it-works" className="px-6 lg:px-16 py-24 bg-canvas-night-elevated border-y border-hairline-dark">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold tracking-widest text-link-mint uppercase">System Architecture</span>
            <h2 className="text-3xl md:text-5xl font-light font-display mt-3 text-on-primary">
              Engineered for signal, not volume.
            </h2>
            <p className="text-shade-40 mt-4 text-base">
              Mass automated emails get ignored or flagged. SponsorFlow crafts precision emails that speak directly to each company&apos;s product challenges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-lg bg-canvas-night border border-hairline-dark/60 space-y-4">
              <div className="w-10 h-10 rounded-pill bg-hairline-dark flex items-center justify-center text-aloe-10">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-medium font-display text-on-primary">1. Curated UK Sponsors</h3>
              <p className="text-sm text-shade-40 leading-relaxed">
                Pre-loaded with 54 top UK licensed tech companies (ClearBank, Monzo, Canva, Airbnb) and flexible CSV import for your own company targets.
              </p>
            </div>

            <div className="p-8 rounded-lg bg-canvas-night border border-hairline-dark/60 space-y-4">
              <div className="w-10 h-10 rounded-pill bg-hairline-dark flex items-center justify-center text-aloe-10">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-medium font-display text-on-primary">2. AI Personalization</h3>
              <p className="text-sm text-shade-40 leading-relaxed">
                Connects your verified project impact to the company&apos;s specific niche (Fintech, Health, SaaS). Strict 70–150 word limit with zero corporate fluff.
              </p>
            </div>

            <div className="p-8 rounded-lg bg-canvas-night border border-hairline-dark/60 space-y-4">
              <div className="w-10 h-10 rounded-pill bg-hairline-dark flex items-center justify-center text-aloe-10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-medium font-display text-on-primary">3. You Approve Every Send</h3>
              <p className="text-sm text-shade-40 leading-relaxed">
                No autonomous blasting. Review, edit, or regenerate each draft in seconds. Sends natively from your Gmail with duplicate prevention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Trust & Safety Section */}
      <section id="anti-spam" className="px-6 lg:px-16 py-20 max-w-5xl mx-auto">
        <div className="p-8 md:p-12 rounded-xl bg-gradient-to-b from-hairline-dark/40 to-transparent border border-hairline-dark flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-aloe-10 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" /> Career Tool, Not a Marketing Bot
            </div>
            <h3 className="text-2xl md:text-3xl font-light font-display text-on-primary">
              Protecting your reputation and inbox score.
            </h3>
            <p className="text-sm text-shade-40 leading-relaxed">
              We enforce strict 20 email/day caps, OAuth domain authorization, recipient duplicate hashing, and automated reply sentiment analysis.
            </p>
          </div>

          <Link href="/signup">
            <Button variant="outline-dark" size="md" className="whitespace-nowrap">
              Create Your Profile
            </Button>
          </Link>
        </div>
      </section>

      {/* 5. Footer (footer-dark) */}
      <footer className="border-t border-hairline-dark/40 bg-canvas-night px-6 lg:px-16 py-12 text-center text-xs text-shade-50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="font-display tracking-tight text-on-primary">
          SPONSORFLOW &copy; {new Date().getFullYear()} • Personal UK Visa Acquisition Engine
        </div>
        <div className="flex gap-6 text-shade-40">
          <Link href="/login" className="hover:text-on-primary transition-colors">Login</Link>
          <Link href="/signup" className="hover:text-on-primary transition-colors">Signup</Link>
          <Link href="/companies" className="hover:text-on-primary transition-colors">Companies</Link>
          <Link href="/analytics" className="hover:text-on-primary transition-colors">Pipeline</Link>
        </div>
      </footer>
    </div>
  );
}
