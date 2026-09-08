# SponsorFlow: Quick Start Guide

**What:** Personal AI-powered UK job acquisition engine for you + your friend  
**Goal:** Get 5–10 interviews from 100+ UK tech sponsors in 6–8 weeks  
**Status:** Ready to build (validation → build → scale)  

---

## 🎯 The Idea in 60 Seconds

1. **You upload your profile** (CV, portfolio, story, positioning)
2. **System loads 54 curated UK tech companies** (from your Excel)
3. **AI generates personalized emails** (using your profile + company data)
4. **You approve each email** (final control, no spam)
5. **System sends daily** (respecting limits, tracking replies)
6. **Dashboard shows pipeline** (who replied, next steps, patterns)
7. **Result:** Systematic, personalized outreach at scale

---

## 📦 What You Get

### 4 Complete Documents

| Document | Purpose | Read Time |
|---|---|---|
| **SPONSORFLOW-ONBOARDING-TEMPLATE.md** | Detailed form for capturing your personal info | 20 min |
| **SPONSORFLOW-DATA-ANALYSIS.md** | Analysis of your Excel file + how system uses it | 15 min |
| **SPONSORFLOW-IMPLEMENTATION-PLAN.md** | Phase-by-phase build roadmap | 25 min |
| **SPONSORFLOW-QUICK-START.md** | This file — overview + next steps | 10 min |

### Your Excel File Analysis

**What's in your data:**
- ✅ **54 London Tech Sponsors** (well-known, verified, curated)
  - All have websites, careers pages, personalization angles
  - Perfect starting point for outreach
  
- ✅ **2,056 London Tech Companies** (comprehensive list)
  - Broader but less researched
  - Use after validating on the 54

**Data quality:** Excellent. Ready to use immediately.

---

## ⏱️ Timeline (6–8 Weeks)

### Weeks 1–2: Validation (You Do Manual Testing)
- Pick 5 companies from shortlist
- Research each, find HR contact
- Hand-write 5 personalized emails
- Send manually, track replies
- **Goal:** Prove concept works before building system

### Weeks 3–6: Build MVP System
- Dev team builds: Onboarding, company import, email drafting, Gmail integration
- You complete profile, import companies, generate emails, send
- **Goal:** Functional system ready for scale

### Weeks 7–12: Scale & Optimize
- Expand outreach to 200+ companies
- Add analytics, follow-up automation, contact research
- Optimize based on reply patterns
- **Goal:** 20+ replies, 5+ interviews, ready to validate

---

## 🚀 Immediate Next Steps (This Week)

### You Do:

**Step 1: Complete the Onboarding Template** (20 minutes)
- Read: SPONSORFLOW-ONBOARDING-TEMPLATE.md
- Complete all 10 sections about your profile, experience, positioning
- This becomes the knowledge base for all personalized emails

**Step 2: Validate Concept Manually** (2 hours)
- Pick 5 companies from your shortlist
- Research each company (10 min each)
- Find HR/recruiter contact on LinkedIn
- Write 1 personalized email per company (using template from examples)
- Send manually (from your Gmail)
- Wait for replies

**Step 3: Document Results** (30 min)
- Track: Who replied, what they said, timing
- Note: What worked, what didn't
- Share findings with dev team

### Dev Team Does:

**Step 1: Setup Infrastructure** (1 day)
- Create Supabase account (PostgreSQL database)
- Create Vercel account (hosting)
- Configure Gmail OAuth (for sending)
- Set up Claude API key (for AI)

**Step 2: Start Building Phase 2** (Week 3)
- Database schema
- API routes
- User authentication

---

## 🎯 Success Criteria

### Week 2 (After Validation)
- ✅ You've sent 5 manual emails
- ✅ Got 1–2 replies (20%+ response rate)
- ✅ Learned what positioning works

### Week 6 (After MVP)
- ✅ System is functional
- ✅ You've sent 20+ emails through system
- ✅ Got 2–5 replies
- ✅ Dashboard shows pipeline

### Week 12 (After Scale)
- ✅ Sent 200+ personalized emails
- ✅ Got 20+ replies
- ✅ 5+ positive conversations
- ✅ 2+ interviews scheduled
- ✅ Ready to validate product works before selling

---

## 📋 What System Will Do

### For You:

1. **Profile Storage** → All your info, CV, portfolio, positioning
2. **Company Intelligence** → 54 curated companies + their data
3. **Email Generation** → AI creates personalized emails (you approve)
4. **Sending** → Gmail integration, respects daily limits
5. **Tracking** → Monitors replies, classifies sentiment
6. **Follow-ups** → Suggests next actions
7. **Analytics** → Shows what's working

### For Your Friend (Later):

Same system, but with their profile + their outreach

### For Other Users (Phase 4, if you sell):

Multi-tenant system where each user has isolated profile + outreach

---

## 💡 Key Principles

1. **Your data, your control** → Approve every email before send
2. **Personalized, not templated** → Using your real experience + each company's specific context
3. **Systematic, not random** → Track everything, optimize based on data
4. **Scalable** → Start with 54, expand to 2,000+ companies
5. **Privacy-first** → Your data stays yours, not used for training

---

## 🔄 How It Works (End-to-End)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│ 1. YOU SIGN UP                                      │
│    └─ Complete 10-step profile                     │
│                                                     │
│ 2. YOU UPLOAD COMPANIES                             │
│    └─ Import your 54-company Excel                 │
│                                                     │
│ 3. SYSTEM ANALYZES                                  │
│    └─ Your profile + each company → Find fit       │
│                                                     │
│ 4. AI GENERATES EMAIL                               │
│    └─ Company-specific, using your positioning      │
│                                                     │
│ 5. YOU REVIEW                                       │
│    └─ Read draft, approve or edit                  │
│                                                     │
│ 6. SYSTEM SENDS                                     │
│    └─ Gmail sends, respecting daily limit           │
│                                                     │
│ 7. REPLY ARRIVES                                    │
│    └─ You get notified in dashboard                │
│                                                     │
│ 8. AI CLASSIFIES                                    │
│    └─ Positive / interested / rejection / question  │
│                                                     │
│ 9. YOU RESPOND                                      │
│    └─ Draft + approve response                     │
│                                                     │
│ 10. PIPELINE ADVANCES                               │
│     └─ Company → conversation → interview → offer   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack (Simple)

| Component | Technology |
|---|---|
| **Frontend** | Next.js 14 + React + TypeScript + Tailwind |
| **Database** | PostgreSQL (Supabase) |
| **Authentication** | Supabase Auth (email magic links) |
| **Email** | Gmail API (OAuth) |
| **AI** | Claude API (Anthropic) |
| **Hosting** | Vercel |

**Why this stack?**
- Fast to build (Next.js handles frontend + backend)
- Secure (OAuth, not passwords)
- Scalable (Supabase handles database)
- Cost-effective (~$20–50/month)
- Good AI (Claude writes better emails than cheaper models)

---

## 📊 Expected Outcomes

### Best Case (If positioning resonates)
- 50 emails → 15–20 replies (30%+ response rate)
- 10 positive conversations
- 3–5 interviews
- 1–2 offers

### Realistic Case
- 100 emails → 10–15 replies (10–15% response rate)
- 5–8 positive conversations
- 2–3 interviews
- 1 offer

### Conservative Case
- 100 emails → 5–10 replies (5–10% response rate)
- 2–3 positive conversations
- 1 interview
- Adjust positioning, iterate

**Either way:** You learn what works, validate concept, can sell to others

---

## 💰 Cost Estimate

### One-Time
- Supabase setup: $0 (free tier available)
- Vercel hosting: $0–$20 (free tier available)
- Domain name (if not using Vercel): $10–15/year

### Monthly (Running the System)
- Supabase: $0–$25 (free up to 500k requests)
- Vercel: $0–$20 (free tier works fine)
- Claude API: $5–15 (100 emails × $0.15 per email draft)
- Gmail API: $0 (free)

**Total:** ~$20–50/month

**ROI:** If you get 1 job offer, worth it 100x over

---

## ⚠️ Important Notes

### Phase 1 is Critical
Don't skip manual validation. Spend 2 weeks testing the concept before committing 6 weeks to building.

### Data Quality Matters
Finding accurate HR email addresses is the hardest part. Plan to spend time on research or invest in enrichment API.

### Personalization is Key
Generic AI emails = ignored. Personalized emails using your real experience = replies. This system is built around genuine personalization, not spam.

### You Have Control
Every email is approved by you before send. No autonomous spam. This is a career tool, not a marketing bot.

---

## 🚀 How to Get Started

### Right Now (Next 5 minutes)
1. Read this file (you're done with it soon)
2. Bookmark the 3 other documents

### Today
1. Skim SPONSORFLOW-DATA-ANALYSIS.md (understand your data)
2. Start filling out SPONSORFLOW-ONBOARDING-TEMPLATE.md (your profile)

### This Week
1. Complete your profile (2 hours)
2. Manually test concept on 5 companies (2 hours)
3. Share learnings with dev team

### Next Week
1. Dev team starts building MVP (Phase 2)
2. You continue manual outreach while building

### Week 3+
1. System is ready for alpha testing
2. You use it for real outreach

---

## 📚 Document Reading Guide

**If you're in a hurry (30 min total):**
1. This file (QUICK-START) ← You're here
2. SPONSORFLOW-DATA-ANALYSIS.md (first half only)

**If you want full context (90 min total):**
1. SPONSORFLOW-QUICK-START.md (this)
2. SPONSORFLOW-DATA-ANALYSIS.md (full)
3. SPONSORFLOW-ONBOARDING-TEMPLATE.md (first 3 sections)

**If you're building the system (full deep dive):**
1. Read all 4 documents in order
2. QUICK-START → DATA-ANALYSIS → ONBOARDING → IMPLEMENTATION-PLAN

---

## 💬 FAQ

**Q: Can I really do this in 6–8 weeks?**
A: MVP yes (Week 6). Full product with scale, analytics, optimization? Weeks 7–12.

**Q: What if I don't get replies?**
A: You learn why from Phase 1. Adjust positioning/approach. That's why Phase 1 matters.

**Q: Can I use this for other job searches?**
A: Later yes, but focus on UK sponsorship first. Validate the concept for yourself.

**Q: How personalized will the emails really be?**
A: Very. Using your actual background + company research, not templates.

**Q: Will this feel like spam?**
A: No. Personalized emails with real context feel like genuine outreach. Not mass spam.

**Q: What if my friend wants to use this?**
A: Same system, different profile. Each user has isolated data. Start after you validate.

**Q: When can I sell this?**
A: After you've proven it works for you + friend (8–10 weeks). Then expand to other users.

**Q: Is this an alternative to LinkedIn?**
A: Complementary. LinkedIn is for passive searching. This is active, systematic outreach.

**Q: What about follow-ups?**
A: System will handle that. Week 7+, add follow-up automation.

---

## ✅ Checklist: Ready to Start?

- [ ] Understand the concept (this file)
- [ ] Analyzed your Excel data (DATA-ANALYSIS doc)
- [ ] Know what we're building (IMPLEMENTATION-PLAN doc)
- [ ] Ready to spend 2 weeks validating manually (Phase 1)
- [ ] Ready to commit 6 weeks to building system (Phase 2)
- [ ] Have a dev team or willing to hire one
- [ ] Comfortable with Gmail OAuth + API keys
- [ ] Ready to be the first user (validation)

**If all ✅:** You're ready to start this week.

---

## 🎯 The Goal

In 12 weeks:
- ✅ You'll have sent 200+ personalized emails
- ✅ You'll have had 20+ conversations
- ✅ You'll have 2–5 interviews
- ✅ You'll have validated the concept works
- ✅ You'll be ready to sell to others

---

## 📞 Next Steps

**This week:**
1. Complete your profile (ONBOARDING-TEMPLATE)
2. Manually test on 5 companies (Phase 1)
3. Share results with dev team
4. Dev team starts Phase 2 setup

**Week 3:**
1. Building begins
2. You continue manual outreach
3. Prepare to use system mid-week

**Week 6:**
1. MVP complete
2. You start real outreach through system

---

**Status:** Ready to build  
**Your next move:** Read SPONSORFLOW-DATA-ANALYSIS.md  
**Then:** Start Phase 1 validation this week  

🚀 Let's build this.
