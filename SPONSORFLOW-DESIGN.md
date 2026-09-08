# SponsorFlow: Complete Design Specification
## Multi-User Personal Job Acquisition Engine

**Document:** SPONSORFLOW-DESIGN.md  
**Status:** Production-ready, ready to build  
**Audience:** Engineering team  
**Build timeline:** Phase 1-2, 6–8 weeks  

---

## 🎯 Product Vision

**SponsorFlow** is a multi-user, personalized job acquisition engine where:

1. **Any professional** can sign up
2. **Upload their own CSV** (company lists, job boards, custom data)
3. **Complete personalization profile** (your story, CV, positioning)
4. **Generate personalized emails** (AI + their unique data)
5. **Send with approval** (human judgment, no spam)
6. **Track results** (opens, clicks, replies, interviews)
7. **Optimize based on data** (see what works, iterate)

Each user operates independently with full data isolation.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Multiple Users                         │
│  User 1    User 2    User 3    User 4    ...            │
└──────┬────────┬────────┬────────┬─────────────────────┘
       │        │        │        │
       └────────┴────────┴────────┘
              │
       ┌──────▼──────────────────┐
       │   SponsorFlow Backend    │
       │   (Shared Infrastructure)│
       │                          │
       │  - Auth (Gmail, OAuth)   │
       │  - CSV parsing           │
       │  - AI personalization    │
       │  - Gmail integration     │
       │  - Email tracking        │
       │  - Database              │
       └──────┬───────────────────┘
              │
       ┌──────┴──────────────────┐
       ▼                          ▼
   PostgreSQL              Gmail API
   (Supabase)              (multi-user)
```

---

## 1. AUTHENTICATION & USER MANAGEMENT

### 1.1 Sign Up Flow

```
User arrives at app.sponsorflow.com
   ↓
┌─────────────────────────────────┐
│ Welcome to SponsorFlow          │
│                                 │
│ [Sign up with email]            │
│ [Sign in with Google]           │
│ [Already have account? Log in]  │
└─────────────────────────────────┘
```

### 1.2 Email + Password Sign Up

```
Step 1: Enter Email
[doyin@example.com]

Step 2: Enter Password
[••••••••] (min 8 chars)

Step 3: Confirm Password
[••••••••]

Step 4: Accept Terms
☐ I agree to SponsorFlow Terms of Service

[Create Account]
   ↓
Email verification sent
User clicks link → Account active
```

### 1.3 Google OAuth Sign Up

```
[Sign in with Google]
   ↓
Google popup
   ↓
Grant permissions:
- Basic profile (name, email)
- Gmail access (to send emails)
   ↓
Logged in, account created automatically
```

### 1.4 Database Schema: Users & Auth

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  
  -- Password auth
  password_hash TEXT,
  
  -- Google OAuth
  google_id TEXT UNIQUE,
  google_email TEXT,
  
  -- Profile
  first_name TEXT,
  last_name TEXT,
  
  -- Status
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  last_login TIMESTAMP
);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token TEXT UNIQUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### 1.5 API Endpoints: Auth

```
POST /api/auth/signup
  { email, password, terms_accepted }
  → { user_id, verification_email_sent }

POST /api/auth/verify-email
  { token }
  → { success, email_verified }

POST /api/auth/login
  { email, password }
  → { token, user_id, expires_at }

POST /api/auth/google-callback
  { google_id_token }
  → { token, user_id, expires_at }

POST /api/auth/logout
  { token }
  → { success }

GET /api/auth/me
  Headers: Authorization: Bearer {token}
  → { user_id, email, profile_status }
```

---

## 2. USER PROFILE & ONBOARDING

### 2.1 Dashboard After Login

```
┌────────────────────────────────────┐
│ Welcome, Doyin!                    │
│                                    │
│ Your Profile: 40% complete        │
│ [Complete your profile →]          │
│                                    │
│ Companies imported: 0              │
│ Emails sent: 0                     │
│ Replies: 0                         │
│                                    │
│ [Get started]                      │
└────────────────────────────────────┘
```

### 2.2 Onboarding Flow (Same as before, but per-user)

**Step 1-10 of profile setup** (see SPONSORFLOW-ONBOARDING-TEMPLATE.md for full details)

```
Step 1: Welcome
Step 2: Basic info (name, location, years exp, target role)
Step 3: Background (industries, companies, roles)
Step 4: Skills (design skills, tools)
Step 5: Projects (3-5 key projects)
Step 6: Sponsorship (visa requirements, salary, availability)
Step 7: Fintech positioning
Step 8: Healthcare positioning
Step 9: Your story + tone
Step 10: Review
```

### 2.3 Personalization Template (Downloadable)

**System offers download during Step 7:**

```
"Next, tell us how you want to position yourself in different industries.

We've created a template to help you think through this. You can:

OPTION A: Download template, fill in offline, upload back
[Download Template (DOCX)]

OPTION B: Fill in directly below
[Continue with form]

The template has prompts like:
- What's your fintech experience?
- What problems have you solved?
- What draws you to this industry?
- etc.

You can paste template content into Claude/ChatGPT to refine writing,
then upload the completed file back to SponsorFlow.
"
```

**Template file (DOCX):**

```
═══════════════════════════════════════════════════════════

SponsorFlow Personalization Template

Candidate Name: ________________
Email: ________________
Date: ________________

═══════════════════════════════════════════════════════════

SECTION 1: FINTECH POSITIONING

Why should a fintech company hire you?

Your fintech experience:
[Write 2-3 sentences about your background]

Problems you've solved:
[Describe 1-2 concrete achievements with metrics]

What draws you to fintech:
[Why are you interested in this industry]

═══════════════════════════════════════════════════════════

SECTION 2: HEALTHCARE POSITIONING

[Same structure]

═══════════════════════════════════════════════════════════

SECTION 3: SAAS POSITIONING

[Same structure]

═══════════════════════════════════════════════════════════

SECTION 4: YOUR PROFESSIONAL STORY

Tell us about yourself (1-2 paragraphs):
[Write how you'd introduce yourself to a hiring manager]

One thing not on your resume:
[Something memorable/unique about you professionally]

═══════════════════════════════════════════════════════════

NOTES:
- Be specific and genuine, not generic
- Include metrics where possible ("40% conversion lift")
- Avoid clichés ("passionate", "dynamic", "innovative")
- Your voice should come through

When done:
1. Save this file
2. Optionally: Paste into Claude/ChatGPT for feedback
3. Upload back to SponsorFlow
4. System extracts and uses for email personalization

═══════════════════════════════════════════════════════════
```

### 2.4 Document Uploads

```
Step 10: Upload Your Materials

CV / Resume *
[Drag & drop or click to upload] (.pdf, .docx)

Portfolio Website *
[https://example.com]

LinkedIn Profile *
[https://linkedin.com/in/example]

Case Studies (optional)
[Upload multiple files]

Personalization Template (optional)
[Upload completed template]

Additional Documents (optional)
[Upload any other relevant docs]

[Continue]
```

### 2.5 Database Schema: User Profile

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  
  -- Basic
  location TEXT,
  years_experience INT,
  target_job_title TEXT,
  
  -- Links
  linkedin_url TEXT,
  portfolio_url TEXT,
  
  -- Story
  professional_summary TEXT,
  design_philosophy TEXT,
  unique_thing TEXT,
  writing_tone VARCHAR(50),
  
  -- Sponsorship
  requires_sponsorship BOOLEAN,
  target_salary_gbp INT,
  
  -- Status
  onboarding_complete BOOLEAN DEFAULT false,
  profile_complete_percent INT DEFAULT 0,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE user_industries (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES user_profiles(id),
  industry VARCHAR(100), -- fintech, healthcare, saas, etc.
  years_experience INT,
  experience_description TEXT,
  problems_solved TEXT,
  motivation TEXT,
  created_at TIMESTAMP
);

CREATE TABLE user_documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  
  document_type VARCHAR(50), -- cv, portfolio, case_study, template
  file_name TEXT,
  file_url TEXT, -- S3 or cloud storage
  file_size INT,
  
  uploaded_at TIMESTAMP
);

CREATE TABLE user_skills (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES user_profiles(id),
  skill_name TEXT,
  skill_category VARCHAR(50), -- design, tools, other
  created_at TIMESTAMP
);

CREATE TABLE user_projects (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES user_profiles(id),
  
  project_name TEXT,
  company_name TEXT,
  year INT,
  description TEXT,
  role TEXT,
  industry VARCHAR(100),
  impact TEXT,
  
  created_at TIMESTAMP
);
```

---

## 3. CSV IMPORT & DUPLICATE PREVENTION

### 3.1 Company Import Flow

```
User dashboard → "Companies" tab
   ↓
[Import companies]
   ↓
Select file:
[company_list.csv, sponsor_list.xlsx, job_board_export.csv]
   ↓
Preview:
"Found 54 companies. Ready to import?"
   ↓
[Import]
   ↓
✓ Imported successfully
```

### 3.2 CSV Format Flexibility

System accepts:

```
Format 1: Generic CSV (user provides raw data)
Company Name | Website | Contact | Email | Industry
Airbnb | airbnb.com | Jane | jane@airbnb.com | Marketplace

Format 2: Job board export (Indeed, LinkedIn, etc.)
Company | Title | Salary | Link | Description
ClearBank | Senior UX Designer | £65k | ... | ...

Format 3: Already structured (like your Excel)
Organisation Name | Website | Careers Page | Personalization Hook
Airbnb | airbnb.com | careers.airbnb.com | Travel/accommodation...

System should:
- Auto-detect format
- Parse flexibly
- Show preview
- Allow column mapping
```

### 3.3 Duplicate Prevention & Multi-Campaign Tracking

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id), -- Each user has own companies
  
  company_name TEXT,
  website TEXT,
  industry TEXT,
  
  -- Track which campaign/import this came from
  import_id UUID REFERENCES company_imports(id),
  campaign_tag TEXT, -- "fintech_q3", "london_shortlist", etc.
  
  -- Deduplication
  normalized_name TEXT, -- standardized for matching
  external_id TEXT, -- ID from source (for dedup)
  
  status VARCHAR(50), -- new, contacted, replied, rejected, etc.
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  UNIQUE (user_id, normalized_name) -- Prevent exact dupes per user
);

CREATE TABLE company_imports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  
  file_name TEXT,
  file_size INT,
  
  companies_found INT,
  companies_duplicates INT,
  companies_imported INT,
  
  status VARCHAR(50), -- processing, completed, failed
  
  uploaded_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  
  name TEXT,
  email TEXT,
  linkedin_url TEXT,
  job_title TEXT,
  
  -- Deduplication
  email_hash TEXT UNIQUE, -- For checking if email already contacted
  
  status VARCHAR(50), -- new, contacted, replied, etc.
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 3.4 Duplicate Detection UI

```
User imports CSV with 54 companies

System checks:
"Analyzing for duplicates..."

Results:
"✓ 54 companies in file
⚠ 5 companies already in your system
  └─ Airbnb, Canva, ClearBank, Cloudflare, Cleo

Options:
☐ Skip duplicates (import only 49 new)
☐ Replace existing with updated data
☐ Import all (merge campaigns)

Also show:
"Campaign tag (optional): [london_shortlist_v2]"
"This helps organize multiple imports"

[Import]
```

### 3.5 Before Sending Email: Duplicate Check

```
User selects contact: Jane Smith, Airbnb
   ↓
System checks:
"Have we already emailed this person?"
   ↓
Query: SELECT * FROM outreach_emails 
       WHERE user_id = X AND contact_email = 'jane@airbnb.com'
   ↓
If found:
"⚠ You already emailed Jane at Airbnb on Sep 5
 Subject: 'Embedded finance...'
 Status: Sent, delivered, opened (but no reply)
 
 Options:
 [Skip this contact]
 [Send follow-up instead]
 [Override & send anyway]"
   ↓
If not found:
"✓ First contact with this person
 Ready to send: [Approve & send]"
```

---

## 4. AI EMAIL GENERATION & APPROVAL

### 4.1 Email Generation Workflow

```
User selects company to email
   ↓
System loads:
- User profile (your story, fintech positioning, etc.)
- Company data (name, industry, role, personalization hook)
   ↓
System calls Claude API with structured prompt
   ↓
Claude generates personalized email
   ↓
System returns draft to UI
   ↓
User reviews in approval interface
```

### 4.2 Email Generation Approval UI

```
┌──────────────────────────────────────┐
│ Draft Email for: ClearBank           │
│                                      │
│ Contact: Jane Smith                  │
│ Role: Head of Product Design         │
│ Company industry: Fintech            │
│                                      │
│ Your positioning angle used:         │
│ → Fintech experience + complexity    │
│ → Your achievement: 40% friction     │
│                                      │
│ ───────────────────────────────────  │
│ DRAFT EMAIL                          │
│ ───────────────────────────────────  │
│                                      │
│ To: jane@clearbank.com               │
│ Subject: Embedded finance + design   │
│                                      │
│ Hi Jane,                             │
│                                      │
│ I came across ClearBank while        │
│ researching UK fintech teams...      │
│ [Rest of email]                      │
│                                      │
│ [Portfolio] [LinkedIn] [CV]          │
│                                      │
│ Best,                                │
│ Doyin                                │
│                                      │
│ ───────────────────────────────────  │
│                                      │
│ [Edit]     [Regenerate]              │
│ [Reject]   [Approve & Send]          │
└──────────────────────────────────────┘
```

### 4.3 Email Approval Options

**[Edit]** → Opens text editor, user can modify
**[Regenerate]** → Call Claude again with tweaks
**[Reject]** → Discard, mark company as "skip"
**[Approve & Send]** → Queue to send (respects daily limit)

### 4.4 Database Schema: Outreach

```sql
CREATE TABLE outreach_emails (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  contact_id UUID REFERENCES contacts(id),
  
  to_email TEXT NOT NULL,
  to_name TEXT,
  
  subject TEXT,
  body TEXT,
  
  -- Tracking
  status VARCHAR(50), -- draft, approved, sending, sent, delivered, failed
  sent_at TIMESTAMP,
  delivery_status VARCHAR(50), -- sent, delivered, bounce
  
  -- Engagement
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  
  -- AI generation metadata
  ai_model TEXT, -- claude-3-sonnet
  ai_positioning_angle TEXT, -- fintech, healthcare, saas
  ai_confidence INT, -- 0-100
  
  -- Approval
  approved_by_user BOOLEAN,
  approved_at TIMESTAMP,
  user_edits TEXT, -- What user changed
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE email_events (
  id UUID PRIMARY KEY,
  outreach_email_id UUID REFERENCES outreach_emails(id),
  
  event_type VARCHAR(50), -- sent, delivered, opened, clicked, bounce
  event_timestamp TIMESTAMP,
  
  -- For clicks: which link
  clicked_link TEXT,
  
  created_at TIMESTAMP
);
```

---

## 5. GMAIL INTEGRATION & SENDING

### 5.1 Gmail OAuth Setup

```
User clicks: [Connect Gmail]
   ↓
System redirects to Google OAuth
   ↓
User sees permission screen:
"SponsorFlow wants access to:
 - Send emails on your behalf
 - Read your inbox (to monitor replies)
 - Manage your drafts"
   ↓
User clicks [Allow]
   ↓
System stores Google access token
   ↓
Gmail connected ✓
```

### 5.2 Sending Flow

```
User dashboard → "Outreach" tab → "Ready to send (12 emails)"

Daily limit display:
"Today: 12/20 emails sent"

Batch send options:
[Schedule send] [Send now]

If "Send now":
- System queues all approved emails
- Gmail API sends each
- Tracks: sent, delivered, bounce

If "Schedule":
- Set time: [10:00 AM]
- System will send at that time
- Respects user's timezone
```

### 5.3 Sending Rate Limiting

```sql
CREATE TABLE send_limits (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  
  daily_limit INT DEFAULT 20,
  hourly_limit INT DEFAULT 5,
  
  emails_sent_today INT,
  emails_sent_this_hour INT,
  
  last_reset_date DATE,
  last_reset_hour INT,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Logic:**

```
Before sending email:
1. Check: emails_sent_today < daily_limit
2. Check: emails_sent_this_hour < hourly_limit
3. If both OK: Send
4. If daily limit reached: "You've sent 20 emails today. 
                            More tomorrow?"
5. If hourly limit reached: "Slow down. Try again in 30 min."
```

### 5.4 API Endpoints: Gmail

```
POST /api/gmail/connect
  Headers: Authorization: Bearer {token}
  → { gmail_connected, email_address }

POST /api/emails/send
  {
    outreach_email_id,
    schedule_for (optional timestamp)
  }
  → { success, sent_at, tracking_id }

POST /api/emails/batch-send
  { email_ids: [...] }
  → { total, sent, failed, rate_limit_warning }

GET /api/emails/rate-limit
  → { daily_limit, daily_used, hourly_limit, hourly_used, reset_at }

POST /api/emails/schedule
  { email_id, schedule_for }
  → { scheduled_at, job_id }
```

---

## 6. REPLY MONITORING & TRACKING

### 6.1 Gmail Webhook Setup

```
Gmail → Google Cloud Pub/Sub → Your backend → Database

When email arrives:
1. Gmail detects new message
2. Pub/Sub notifies backend
3. Backend: "Is this a reply to an outreach email?"
4. If yes: Associate with original company/contact
5. Store in database
6. Dashboard updates in real-time
```

### 6.2 Reply Detection

```sql
CREATE TABLE email_replies (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  outreach_email_id UUID REFERENCES outreach_emails(id),
  
  from_email TEXT,
  from_name TEXT,
  
  subject TEXT,
  body TEXT,
  
  received_at TIMESTAMP,
  
  -- AI classification
  ai_classification VARCHAR(50), -- positive, interested, rejection, question, etc.
  ai_confidence INT, -- 0-100
  ai_summary TEXT, -- "Requests CV + portfolio"
  
  created_at TIMESTAMP
);
```

### 6.3 Reply Classification

```
When reply arrives:

System reads reply:
"Hi Doyin, thanks for reaching out. This sounds interesting. 
Can you send over your CV and portfolio link?"

AI classifies:
Classification: 🟢 POSITIVE
Intent: Requesting CV
Confidence: 95%
Suggested action: Send CV immediately, schedule follow-up in 3 days

---

Another example:
"We don't currently have positions open, but I'll keep you in mind."

Classification: 🟡 INTERESTED
Intent: Warm lead
Confidence: 88%
Suggested action: Follow up in 30 days

---

Another:
"This role requires 10+ years of experience."

Classification: 🔴 REJECTION
Intent: Not a fit
Confidence: 92%
Suggested action: Don't contact again, move to rejected list
```

### 6.4 Reply Dashboard

```
┌──────────────────────────────────────┐
│ REPLIES (8 new)                      │
├──────────────────────────────────────┤
│                                      │
│ 🟢 Positive (5)                      │
│   ├─ Jane, ClearBank                 │
│   │  "Let's chat" → [Reply now]      │
│   ├─ Sarah, Atlassian                │
│   │  "Schedule a call" → [Calendar]  │
│   └─ ...                             │
│                                      │
│ 🟡 Interested (2)                    │
│   ├─ John, Canva                     │
│   │  "Keep in touch" → [Follow-up    │
│   │   in 30 days]                    │
│   └─ ...                             │
│                                      │
│ 🔴 Not now (1)                       │
│   └─ Mike, Cleo                      │
│     "Not hiring" → [Check careers    │
│      in 3 months]                    │
│                                      │
└──────────────────────────────────────┘
```

---

## 7. TRACKING & ANALYTICS DASHBOARD

### 7.1 Main Dashboard

```
┌────────────────────────────────────────┐
│ SPONSORFLOW DASHBOARD                  │
├────────────────────────────────────────┤
│                                        │
│ TODAY                                  │
│ ├─ Emails sent: 14/20                 │
│ ├─ Opens: 7 (50%)                     │
│ ├─ Clicks: 3 (21%)                    │
│ └─ Replies: 1                         │
│                                        │
│ THIS WEEK                              │
│ ├─ Emails sent: 68                    │
│ ├─ Open rate: 45%                     │
│ ├─ Click rate: 18%                    │
│ ├─ Replies: 6                         │
│ └─ Positive: 3                        │
│                                        │
│ PIPELINE                               │
│ ├─ Total companies targeted: 54      │
│ ├─ Companies contacted: 25            │
│ ├─ Companies replied: 6               │
│ ├─ Conversations active: 4            │
│ ├─ Interviews scheduled: 1            │
│ └─ Offers: 0                          │
│                                        │
│ TOP PERFORMING INDUSTRY                │
│ ├─ Fintech: 40% reply rate            │
│ ├─ SaaS: 18% reply rate               │
│ └─ Healthcare: 12% reply rate         │
│                                        │
└────────────────────────────────────────┘
```

### 7.2 Detailed Analytics Views

**By Industry:**
```
Fintech
- Companies: 15
- Emails sent: 30
- Replies: 12 (40%)
- Positive: 8
- Interviews: 2

SaaS
- Companies: 20
- Emails sent: 35
- Replies: 6 (18%)
- Positive: 2
- Interviews: 0

Healthcare
- Companies: 10
- Emails sent: 12
- Replies: 1 (12%)
- Positive: 0
- Interviews: 0
```

**By Company Status:**
```
New (not contacted): 29
Contacted (no reply): 15
Replied (positive): 5
Replied (rejection): 3
Scheduled interview: 1
Offer: 0
```

**Email Performance:**
```
Subject lines tested:
- "Industry + your angle" → 45% open rate ✅
- "Generic intro" → 12% open rate
- "Question format" → 38% open rate

Best times to send:
- Tuesday 10 AM → 52% open rate
- Wednesday 2 PM → 48% open rate
- Friday 4 PM → 22% open rate (worst)

Best links clicked:
- Portfolio link: 40% of emails with links
- LinkedIn: 25%
- CV: 15%
```

### 7.3 Database Schema: Analytics

```sql
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  
  date DATE,
  
  -- Sending
  emails_sent INT,
  emails_delivered INT,
  emails_bounced INT,
  
  -- Engagement
  emails_opened INT,
  open_rate FLOAT,
  emails_clicked INT,
  click_rate FLOAT,
  emails_replied INT,
  reply_rate FLOAT,
  
  -- Results
  positive_replies INT,
  rejection_replies INT,
  interviews_scheduled INT,
  
  created_at TIMESTAMP
);

CREATE TABLE analytics_by_industry (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  
  industry TEXT,
  
  companies_targeted INT,
  emails_sent INT,
  replies INT,
  reply_rate FLOAT,
  positive_replies INT,
  interviews INT,
  
  created_at TIMESTAMP
);
```

---

## 8. EMAIL WORKFLOW DIAGRAM

```
COMPLETE USER JOURNEY
═════════════════════════════════════════════

1. SIGNUP
   ├─ Email + password OR Google OAuth
   ├─ Email verified
   └─ Account created

2. ONBOARDING
   ├─ Step 1-10 profile setup
   ├─ Download personalization template
   ├─ Upload CV + documents
   └─ Profile complete ✓

3. CSV IMPORT
   ├─ Upload company list
   ├─ System parses CSV
   ├─ Checks for duplicates
   ├─ Shows preview
   └─ Companies imported ✓

4. EMAIL GENERATION & APPROVAL
   ├─ User selects company
   ├─ System generates draft (AI)
   ├─ User reviews
   ├─ User approves or edits
   ├─ Email marked "ready to send"
   └─ [Repeat for all companies]

5. SENDING
   ├─ User batches emails
   ├─ Respects daily limit (20/day)
   ├─ Gmail sends each
   ├─ Tracks: sent, delivered, bounce
   └─ Status updates in real-time

6. ENGAGEMENT TRACKING
   ├─ Email opens detected
   ├─ Link clicks tracked
   ├─ Replies monitored
   ├─ AI classifies reply sentiment
   └─ Dashboard updates

7. REPLY MANAGEMENT
   ├─ User sees reply
   ├─ AI suggests action
   ├─ User approves response draft
   ├─ Response sent
   └─ Conversation tracked

8. FOLLOW-UP
   ├─ System suggests: "Follow up in 5 days"
   ├─ User approves follow-up draft
   ├─ Sent on schedule
   └─ Pipeline advances

9. ANALYTICS & OPTIMIZATION
   ├─ User reviews dashboard
   ├─ Sees which industries reply most
   ├─ Sees best-performing subject lines
   ├─ Adjusts strategy
   └─ Improves results

10. INTERVIEW SCHEDULING
    ├─ Company requests call
    ├─ User schedules
    ├─ System tracks as "interview"
    └─ Updates pipeline
```

---

## 9. CORE DATA MODEL (COMPLETE)

### Users & Auth
```
users
├── id (UUID)
├── email
├── password_hash (optional, if email/pw signup)
├── google_id (optional, if Google OAuth)
└── created_at

user_sessions
├── id (UUID)
├── user_id
├── token
└── expires_at
```

### Profile
```
user_profiles
├── id (UUID)
├── user_id
├── professional_summary
├── years_experience
├── onboarding_complete
└── created_at

user_industries
├── id (UUID)
├── profile_id
├── industry
├── experience_description
├── problems_solved
└── motivation

user_skills
├── id
├── profile_id
├── skill_name
└── skill_category

user_projects
├── id
├── profile_id
├── project_name
├── company
├── impact
└── created_at

user_documents
├── id
├── user_id
├── document_type
├── file_url
└── uploaded_at
```

### Companies & Contacts
```
companies
├── id (UUID)
├── user_id (each user has own companies)
├── company_name
├── website
├── industry
├── import_id (which import batch)
├── campaign_tag (which campaign)
├── normalized_name (for dedup)
└── status

contacts
├── id (UUID)
├── user_id
├── company_id
├── name
├── email
├── email_hash (for dedup)
├── job_title
└── status

company_imports
├── id (UUID)
├── user_id
├── file_name
├── companies_imported
├── companies_duplicates
└── uploaded_at
```

### Email Outreach
```
outreach_emails
├── id (UUID)
├── user_id
├── company_id
├── contact_id
├── to_email
├── subject
├── body
├── status (draft, approved, sent, delivered, etc.)
├── sent_at
├── approved_by_user
├── ai_positioning_angle
└── created_at

email_events
├── id
├── outreach_email_id
├── event_type (sent, opened, clicked, etc.)
├── clicked_link (if click event)
└── event_timestamp

email_replies
├── id (UUID)
├── user_id
├── outreach_email_id
├── from_email
├── body
├── ai_classification (positive, interested, rejection, etc.)
├── ai_confidence
├── ai_summary
└── received_at

send_limits
├── id
├── user_id
├── daily_limit (default 20)
├── emails_sent_today
├── emails_sent_this_hour
└── updated_at
```

### Analytics
```
analytics_daily
├── id
├── user_id
├── date
├── emails_sent
├── emails_opened
├── open_rate
├── emails_replied
├── reply_rate
├── positive_replies
└── interviews_scheduled

analytics_by_industry
├── id
├── user_id
├── industry
├── companies_targeted
├── emails_sent
├── replies
├── reply_rate
└── interviews
```

---

## 10. API SUMMARY

### Authentication
```
POST   /api/auth/signup
POST   /api/auth/verify-email
POST   /api/auth/login
POST   /api/auth/google-callback
POST   /api/auth/logout
GET    /api/auth/me
```

### Profile
```
GET    /api/profile
PUT    /api/profile
POST   /api/profile/documents/upload
GET    /api/profile/template (download personalization template)
POST   /api/profile/template/upload
```

### Companies
```
POST   /api/companies/import
GET    /api/companies
GET    /api/companies/:id
PUT    /api/companies/:id
DELETE /api/companies/:id
GET    /api/companies/duplicates (show potential dupes)
```

### Contacts
```
GET    /api/contacts
GET    /api/contacts/check-duplicate?email=...
POST   /api/contacts/:id/notes
```

### Email Generation & Sending
```
POST   /api/emails/draft (generate AI draft)
GET    /api/emails/:id
PUT    /api/emails/:id (approve/edit)
POST   /api/emails/send
POST   /api/emails/batch-send
POST   /api/emails/schedule
GET    /api/emails/rate-limit
```

### Tracking & Replies
```
POST   /api/gmail/connect
GET    /api/emails/events (email opens, clicks)
GET    /api/emails/replies
POST   /api/emails/:id/reply/draft
POST   /api/emails/:id/reply/send
```

### Dashboard & Analytics
```
GET    /api/dashboard
GET    /api/analytics/daily
GET    /api/analytics/by-industry
GET    /api/analytics/by-company-status
```

---

## 11. PHASE 1-2 MVP SCOPE

### Must Have (Phase 1)
- ✅ Email + password signup + verification
- ✅ Google OAuth login
- ✅ User profile onboarding (10 steps)
- ✅ Personalization template (downloadable DOCX)
- ✅ Document uploads (CV, portfolio)
- ✅ CSV import (flexible parsing)
- ✅ Duplicate detection
- ✅ AI email generation (Claude API)
- ✅ Email approval UI
- ✅ Gmail OAuth + sending
- ✅ Rate limiting (20/day)
- ✅ Basic dashboard (emails sent, replies received)
- ✅ Reply detection (Gmail webhook)
- ✅ Reply classification (AI)

### Nice to Have (Phase 2)
- Follow-up automation
- Company research enrichment
- Advanced analytics by industry
- Email scheduling
- Contact research automation
- A/B testing framework

### Not MVP
- WhatsApp integration
- LinkedIn integration
- Autonomous sending
- Contact auto-discovery
- Advanced AI agents

---

## 12. TECH STACK

| Component | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 + React + TypeScript + Tailwind | Fast, full-stack |
| Backend | Next.js API routes | Same framework |
| Database | PostgreSQL (Supabase) | Structured, real-time |
| Auth | Supabase + Google OAuth | Standard, secure |
| Email | Gmail API | OAuth, free, reliable |
| AI | Claude API | Best writing quality |
| File Storage | Supabase Storage or S3 | Secure, scalable |
| Hosting | Vercel | Next.js optimized |
| Search (optional) | Tavily API | Company research |

---

## 13. DEPLOYMENT & INFRASTRUCTURE

### Development
```
Local: Next.js dev server on :3000
Database: Supabase local (or remote dev instance)
```

### Staging
```
Deploy branch to Vercel staging environment
Database: Separate Supabase instance
```

### Production
```
Deploy to Vercel production
Database: Supabase production
Domain: app.sponsorflow.com
SSL: Automatic (Vercel)
CDN: Automatic (Vercel edge)
```

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

SUPABASE_SERVICE_ROLE_KEY=...

ANTHROPIC_API_KEY=sk-ant-...

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

GMAIL_WEBHOOK_URL=https://app.sponsorflow.com/api/gmail/webhook
GMAIL_PUBSUB_TOPIC=...

S3_BUCKET=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

---

## 14. SUCCESS METRICS

### Phase 1 (Week 6)
- ✅ 50+ users signed up
- ✅ 80%+ complete onboarding
- ✅ 200+ companies imported
- ✅ 100+ emails generated
- ✅ 50+ emails sent
- ✅ 0 critical bugs

### Phase 2 (Week 12)
- ✅ 500+ emails sent across all users
- ✅ 10%+ reply rate
- ✅ 0 duplicate emails to same person
- ✅ 80%+ email deliverability
- ✅ Average user sends 10+ emails/week

---

## 15. SECURITY & PRIVACY

### Data Protection
- All user data encrypted at rest
- HTTPS/TLS for all connections
- OAuth tokens stored securely
- API authentication via JWT tokens

### User Isolation
- Each user sees only their own data
- Row-level security on all tables
- Cannot access other user's companies/emails

### Gmail Security
- Store Google access token securely (encrypted)
- Request minimal permissions (send, read inbox)
- Refresh tokens before expiry
- Handle token revocation gracefully

### Compliance
- GDPR-compliant data retention
- User can delete account + all data
- Privacy policy clearly stated
- No selling user data
- No using user emails for training AI

---

## 16. NEXT STEPS: BUILD PROMPT PACKS

Once this design is approved, create:

**PROMPT-PACK-SPONSORFLOW-PHASE-1.md**
- 12 sequential prompts for Claude Code
- Each prompt: one feature area
- Copy-paste ready for building
- Includes: acceptance criteria, testing steps

**Order of prompts:**
1. Database schema + migrations
2. Next.js project setup + Tailwind
3. Auth: Email + password signup
4. Auth: Google OAuth
5. User profile onboarding (10 steps)
6. CSV import + duplicate detection
7. AI email generation
8. Email approval UI
9. Gmail OAuth integration
10. Send emails + rate limiting
11. Gmail webhook + reply detection
12. Dashboard + analytics

---

**End of Design Specification**

**Status:** ✅ Production-ready, ready to build  
**Next:** Create PROMPT-PACK-SPONSORFLOW-PHASE-1.md
