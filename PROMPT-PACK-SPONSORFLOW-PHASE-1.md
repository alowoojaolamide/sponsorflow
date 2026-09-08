# SponsorFlow: Phase 1 Prompt Pack
## 12 Sequential Prompts for Claude Code / AI Agents

**Document:** PROMPT-PACK-SPONSORFLOW-PHASE-1.md  
**Status:** Ready to execute  
**Timeline:** ~6 weeks (1–2 weeks per prompt, can overlap)  
**Build order:** Sequential, each depends on previous  

---

## How to Use This Prompt Pack

### For Each Prompt:

1. **Copy the entire PROMPT section** (from "PROMPT:" to end of acceptance criteria)
2. **Paste into Claude Code** (or any AI agent you're using)
3. **Let Claude execute** (it will write code, create files, commit)
4. **Run verification steps** (commands at end of each prompt)
5. **Confirm acceptance criteria pass**
6. **Move to next prompt**

### Between Prompts:

- Do NOT start fresh session
- Keep Claude Code session alive
- Claude Code will maintain context of what's been built
- Reference the previous work naturally

### If Starting Fresh:

Include "CONTEXT FROM PREVIOUS WORK" section at start of new prompt.

---

## 🚀 PROMPT 1: Database Schema & Migrations

**Timeframe:** 2–3 days  
**Goal:** PostgreSQL schema ready, Supabase migrations working  
**Output:** Deployed database, migration files committed  

---

```
PROMPT:

You are building SponsorFlow, a multi-user personal job acquisition engine.

REFERENCE:
- SPONSORFLOW-DESIGN.md (Section 9: Core Data Model)
- Tech stack: Next.js 14 + TypeScript + Supabase (PostgreSQL)

## Your Task

Create and deploy the complete database schema for Phase 1.

### What to Build

1. **Create Supabase project**
   - Go to supabase.com
   - Create new project (if not already done)
   - Get connection string
   - Save to .env.local

2. **Create migration files** (using Supabase CLI or SQL directly)
   
   All tables from SPONSORFLOW-DESIGN.md Section 9:
   
   ✅ Users (users, user_sessions)
   ✅ Profile (user_profiles, user_industries, user_skills, user_projects, user_documents)
   ✅ Companies (companies, company_imports, contacts)
   ✅ Email Outreach (outreach_emails, email_events, email_replies)
   ✅ Rate Limiting (send_limits)
   ✅ Analytics (analytics_daily, analytics_by_industry)

3. **Create indexes** for performance:
   - users(email) UNIQUE
   - user_profiles(user_id) UNIQUE
   - companies(user_id, normalized_name) — prevents exact duplicates per user
   - contacts(user_id, email_hash) — for dedup checking
   - outreach_emails(user_id, sent_at) — for dashboard queries
   - email_replies(user_id, received_at) — for reply monitoring

4. **Enable Row-Level Security (RLS)**
   - All tables must have RLS enabled
   - Policies: Users can only see/modify their own data
   - Example:
     ```sql
     ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
     
     CREATE POLICY "Users can only see their own companies"
       ON companies
       FOR SELECT
       USING (auth.uid() = user_id);
     
     CREATE POLICY "Users can only insert their own companies"
       ON companies
       FOR INSERT
       WITH CHECK (auth.uid() = user_id);
     ```

5. **Create helper functions**
   - normalize_company_name(text) — standardizes names for dedup
   - email_hash(text) — hashes emails for privacy
   - get_user_id() — returns current user from auth context

6. **Deploy migrations to Supabase**
   ```bash
   supabase db push
   # or use Supabase UI to run SQL directly
   ```

7. **Create local TypeScript types** (app/types/database.ts):
   ```typescript
   // Auto-generated from Supabase schema
   export type Database = {
     public: {
       Tables: {
         users: {
           Row: { id: UUID; email: string; ... }
           Insert: { email: string; ... }
           Update: { ... }
         }
         // ... all tables
       }
     }
   }
   ```

### Acceptance Criteria

- [ ] Supabase project created and connected to .env.local
- [ ] All 17 tables exist in PostgreSQL:
  - users, user_sessions
  - user_profiles, user_industries, user_skills, user_projects, user_documents
  - companies, company_imports, contacts
  - outreach_emails, email_events, email_replies
  - send_limits
  - analytics_daily, analytics_by_industry
- [ ] All indexes created and working
- [ ] RLS enabled on all tables
- [ ] Can query database from Next.js:
  ```typescript
  const { data, error } = await supabase
    .from('users')
    .select('*')
  ```
- [ ] TypeScript types auto-generated and imported
- [ ] Migration files committed to git

### Verification Steps

```bash
# 1. Check Supabase connection
supabase status

# 2. List all tables
supabase db pull
# Should show all 17 tables in schema.sql

# 3. Test RLS policies
psql $DATABASE_URL -c "SELECT * FROM information_schema.tables WHERE table_schema='public'"
# Should list 17 tables

# 4. Test TypeScript types
npx tsc --noEmit
# Should have no errors

# 5. Quick manual test in Node
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('users').select('*').then(r => console.log('✓ DB connected:', r.data?.length || 0));
"
```

### Next Step Handoff

When complete, you have:
- ✅ Empty database with correct schema
- ✅ RLS policies enforcing user isolation
- ✅ TypeScript types ready
- ✅ Ready for auth system in Prompt 2
```

---

## 🚀 PROMPT 2: Next.js Setup & Tailwind

**Timeframe:** 1 day  
**Goal:** Next.js project scaffolded, Tailwind configured, basic structure ready  
**Output:** Dev server running on localhost:3000  

---

```
PROMPT:

You are building SponsorFlow Phase 1. Database is deployed (Prompt 1 complete).

REFERENCE:
- SPONSORFLOW-DESIGN.md (Tech stack section)
- Next.js 14 + TypeScript + Tailwind CSS

## Your Task

Set up Next.js project with professional folder structure and Tailwind.

### What to Build

1. **Create Next.js project** (if not already done)
   ```bash
   npx create-next-app@latest sponsorflow \
     --typescript \
     --tailwind \
     --app \
     --eslint \
     --no-src-dir \
     --import-alias '@/*'
   
   cd sponsorflow
   ```

2. **Install additional dependencies**
   ```bash
   npm install \
     @supabase/supabase-js \
     @supabase/auth-helpers-nextjs \
     react-hook-form \
     zod \
     @hookform/resolvers \
     date-fns \
     lucide-react \
     clsx \
     tailwind-merge
   ```

3. **Create folder structure**
   ```
   app/
   ├── page.tsx (landing)
   ├── layout.tsx
   ├── (auth)/
   │   ├── signup/page.tsx
   │   ├── login/page.tsx
   │   └── google-callback/page.tsx
   ├── (dashboard)/
   │   ├── layout.tsx
   │   ├── page.tsx (dashboard home)
   │   ├── profile/page.tsx
   │   ├── companies/page.tsx
   │   ├── emails/page.tsx
   │   └── analytics/page.tsx
   └── api/
       ├── auth/
       │   ├── signup/route.ts
       │   ├── login/route.ts
       │   ├── google-callback/route.ts
       │   └── logout/route.ts
       ├── profile/route.ts
       ├── companies/route.ts
       ├── emails/route.ts
       └── analytics/route.ts
   
   lib/
   ├── supabase.ts (client)
   ├── supabase-server.ts (server)
   ├── auth.ts (helper functions)
   └── db.ts (database queries)
   
   components/
   ├── ui/
   │   ├── button.tsx
   │   ├── input.tsx
   │   ├── form.tsx
   │   └── card.tsx
   ├── auth/
   │   ├── SignupForm.tsx
   │   └── LoginForm.tsx
   ├── dashboard/
   │   ├── Header.tsx
   │   ├── Sidebar.tsx
   │   └── DashboardStats.tsx
   └── emails/
       ├── EmailGenerator.tsx
       └── EmailApprovalUI.tsx
   
   types/
   ├── index.ts (exported types)
   └── database.ts (auto-generated from Supabase)
   ```

4. **Configure Tailwind** (tailwind.config.ts)
   ```typescript
   // Add custom colors, fonts, spacing
   // Use consistent design system
   ```

5. **Set up environment variables** (.env.local)
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

6. **Create app/layout.tsx**
   - Navigation
   - Basic styling
   - Provider setup (Supabase, etc.)

7. **Create simple landing page** (app/page.tsx)
   - Hero section
   - CTA buttons: "Sign up", "Log in"
   - Link to sign up page

### Acceptance Criteria

- [ ] Next.js dev server runs: `npm run dev` → localhost:3000
- [ ] No build errors: `npm run build` succeeds
- [ ] Tailwind CSS working (classes apply correctly)
- [ ] All folder structure created as specified
- [ ] TypeScript compiles without errors
- [ ] env.local has all variables needed
- [ ] Landing page visible at localhost:3000
- [ ] Navigation links work (internal routing)

### Verification Steps

```bash
# 1. Start dev server
npm run dev
# Should see "▲ Next.js 14.x started server on ..."

# 2. Visit localhost:3000
# Should see landing page (not 404)

# 3. Check TypeScript
npx tsc --noEmit
# Should have 0 errors

# 4. Build for production
npm run build
# Should complete successfully

# 5. Check folder structure
find app components lib -type f -name "*.tsx" | head -20
# Should list all created files
```

### Next Step Handoff

When complete, you have:
- ✅ Next.js project running
- ✅ Folder structure organized
- ✅ Tailwind configured
- ✅ Ready for auth in Prompt 3
```

---

## 🚀 PROMPT 3: Email & Password Authentication

**Timeframe:** 2–3 days  
**Goal:** Email signup + login working, password hashing, session management  
**Output:** Users can sign up with email/password, log in, log out  

---

```
PROMPT:

You are building SponsorFlow Phase 1. Database and Next.js setup complete.

REFERENCE:
- SPONSORFLOW-DESIGN.md (Section 1: Authentication)
- Supabase Auth for password management
- JWT tokens for sessions

## Your Task

Implement email + password authentication.

### What to Build

1. **Backend: Auth API routes**

   **app/api/auth/signup/route.ts**
   - Accept: { email, password, passwordConfirm }
   - Validate: password == passwordConfirm, password length >= 8
   - Hash password using bcrypt
   - Insert into users table
   - Send verification email (Supabase Auth handles this)
   - Return: { success, message, user_id }

   **app/api/auth/login/route.ts**
   - Accept: { email, password }
   - Lookup user by email
   - Compare hashed password
   - Generate JWT token (Supabase session)
   - Set secure HTTP-only cookie
   - Return: { success, token, expires_at }

   **app/api/auth/logout/route.ts**
   - Clear session cookie
   - Invalidate any active tokens
   - Return: { success }

   **app/api/auth/me/route.ts**
   - Accept JWT from Authorization header
   - Verify token
   - Return current user profile
   - Or return 401 if unauthorized

2. **Frontend: Signup page** (app/(auth)/signup/page.tsx)
   - Form fields: Email, Password, Confirm Password
   - Validation on frontend (react-hook-form + zod)
   - Submit to POST /api/auth/signup
   - On success: Redirect to email verification page
   - Show: "Check your email for verification link"
   - Error handling: Display errors from API

   **UI layout:**
   ```
   ┌─────────────────────────────────┐
   │ Create Account                  │
   │                                 │
   │ Email:                          │
   │ [____________________]          │
   │                                 │
   │ Password:                       │
   │ [____________________]          │
   │                                 │
   │ Confirm Password:               │
   │ [____________________]          │
   │                                 │
   │ [Create Account]                │
   │                                 │
   │ Already have account? Log in    │
   └─────────────────────────────────┘
   ```

3. **Frontend: Login page** (app/(auth)/login/page.tsx)
   - Form fields: Email, Password
   - Submit to POST /api/auth/login
   - On success: Redirect to dashboard (with JWT in cookie)
   - Error handling: "Invalid email or password"

4. **Frontend: Logout button**
   - POST /api/auth/logout
   - Clear cookie
   - Redirect to login

5. **Middleware: Auth protection**
   - Create app/middleware.ts
   - Check for valid JWT on protected routes
   - If no token: redirect to /login
   - Protected routes: /profile, /companies, /emails, /analytics

6. **Helper functions** (lib/auth.ts)
   ```typescript
   export async function signupUser(email, password) { ... }
   export async function loginUser(email, password) { ... }
   export async function logoutUser() { ... }
   export async function getCurrentUser() { ... }
   export async function isAuthenticated() { ... }
   ```

7. **Database operations** (lib/db.ts)
   ```typescript
   export async function createUser(email, passwordHash) { ... }
   export async function getUserByEmail(email) { ... }
   export async function createSession(user_id, token) { ... }
   ```

### Acceptance Criteria

- [ ] Can sign up with email + password
- [ ] Signup validates: password confirmation matches, 8+ chars
- [ ] Can log in with email + password
- [ ] Invalid password shows error message
- [ ] After login, JWT token stored in secure HTTP-only cookie
- [ ] Can log out and cookie is cleared
- [ ] GET /api/auth/me returns current user if authenticated
- [ ] GET /api/auth/me returns 401 if not authenticated
- [ ] Protected routes redirect to /login if not authenticated
- [ ] Email verification email sent (check Supabase logs)
- [ ] All form fields have proper validation (client + server)

### Verification Steps

```bash
# 1. Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","passwordConfirm":"password123"}'
# Should return: { success: true, user_id: "..." }

# 2. Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# Should return: { success: true, token: "..." }

# 3. Test auth page in browser
# Go to localhost:3000/signup
# Fill out form
# Should redirect to verification page

# 4. Test protected route
# Try visiting localhost:3000/profile without logging in
# Should redirect to /login

# 5. Test logout
# After login, click logout button
# Should redirect to /login
```

### Next Step Handoff

When complete, you have:
- ✅ Email/password signup working
- ✅ Login working
- ✅ Protected routes
- ✅ Auth middleware
- ✅ Ready for Google OAuth in Prompt 4
```

---

## 🚀 PROMPT 4: Google OAuth Integration

**Timeframe:** 1–2 days  
**Goal:** "Sign in with Google" button working, OAuth callback handled  
**Output:** Users can sign up/log in with Google account  

---

```
PROMPT:

You are building SponsorFlow Phase 1. Email/password auth complete (Prompt 3).

REFERENCE:
- SPONSORFLOW-DESIGN.md (Section 1.3: Google OAuth)
- Google OAuth 2.0 flow
- Supabase supports OAuth

## Your Task

Add "Sign in with Google" functionality.

### What to Build

1. **Setup Google OAuth in Google Cloud Console**
   - Go to console.cloud.google.com
   - Create new OAuth 2.0 credential (Web application)
   - Add redirect URIs:
     - http://localhost:3000/api/auth/google-callback
     - https://app.sponsorflow.com/api/auth/google-callback
   - Copy: Client ID, Client Secret
   - Add to .env.local:
     ```
     GOOGLE_CLIENT_ID=...
     GOOGLE_CLIENT_SECRET=...
     ```

2. **Supabase Google OAuth Configuration**
   - Go to Supabase dashboard → Authentication → Providers
   - Enable "Google"
   - Paste Client ID and Client Secret
   - Save redirect URL: https://app.sponsorflow.com/api/auth/google-callback

3. **Backend: Google OAuth callback** (app/api/auth/google-callback/route.ts)
   - Accept `code` from Google OAuth redirect
   - Exchange code for access token
   - Get user info from Google API (name, email)
   - Check if user exists in database:
     - If exists: Log them in (create session)
     - If not exists: Create new user + profile + log them in
   - Set JWT token in secure cookie
   - Redirect to dashboard

4. **Frontend: Login/Signup pages updated**
   - Add button: "Sign in with Google"
   - Button redirects to Google OAuth URL
   - URL: `https://accounts.google.com/o/oauth2/v2/auth?...`

   **UI:**
   ```
   ┌─────────────────────────────────┐
   │ Sign Up                         │
   │                                 │
   │ [Email Signup Form]             │
   │                                 │
   │ ─────── OR ──────               │
   │                                 │
   │ [Google Sign In Button]         │
   │  (with Google logo)             │
   │                                 │
   └─────────────────────────────────┘
   ```

5. **Update database schema** (if not already done)
   - users table: Add google_id (nullable, unique)
   - users table: Add google_email (nullable)

6. **Helper functions** (lib/auth.ts)
   ```typescript
   export async function googleOAuthUrl() { ... }
   export async function exchangeGoogleCode(code) { ... }
   export async function getOrCreateUserFromGoogle(googleProfile) { ... }
   ```

### Acceptance Criteria

- [ ] "Sign in with Google" button visible on signup/login pages
- [ ] Clicking button redirects to Google login
- [ ] After Google approval, redirects back to callback URL
- [ ] New user: Created in database, auto-logged in
- [ ] Existing user: Logged in with existing account
- [ ] JWT token set in secure HTTP-only cookie
- [ ] Redirected to dashboard after successful auth
- [ ] google_id unique in database (no duplicate Google accounts)
- [ ] Can sign up with email and login with Google (same email) ← should work

### Verification Steps

```bash
# 1. Visit signup page
# http://localhost:3000/signup

# 2. Click "Sign in with Google"
# Should redirect to accounts.google.com

# 3. Use test Google account
# (create one for testing)

# 4. Approve permissions
# Should redirect back to localhost:3000/api/auth/google-callback

# 5. Should be logged in
# Redirected to dashboard
# JWT in cookie

# 6. Test in database
psql $DATABASE_URL -c "SELECT id, email, google_id FROM users WHERE email='yourtest@gmail.com'"
# Should show google_id populated
```

### Next Step Handoff

When complete, you have:
- ✅ Email/password auth
- ✅ Google OAuth
- ✅ Session management
- ✅ Protected routes
- ✅ Ready for user profile onboarding in Prompt 5
```

---

## 🚀 PROMPT 5: User Profile Onboarding (10 Steps)

**Timeframe:** 3–4 days  
**Goal:** Complete 10-step onboarding form, data saved to database  
**Output:** Users can complete full profile, profile dashboard shows progress  

---

```
PROMPT:

You are building SponsorFlow Phase 1. Auth complete (Prompts 3-4).

REFERENCE:
- SPONSORFLOW-DESIGN.md (Section 2: User Profile & Onboarding)
- SPONSORFLOW-ONBOARDING-TEMPLATE.md (10-step form)
- React Hook Form + Zod for validation

## Your Task

Build complete 10-step onboarding form with data persistence.

### What to Build

1. **Create onboarding pages** (app/(dashboard)/onboarding/)
   ```
   Step 1: Welcome → step-1.tsx
   Step 2: Basic info → step-2.tsx
   Step 3: Background → step-3.tsx
   Step 4: Skills → step-4.tsx
   Step 5: Projects → step-5.tsx
   Step 6: Sponsorship → step-6.tsx
   Step 7: Fintech positioning → step-7.tsx
   Step 8: Healthcare positioning → step-8.tsx
   Step 9: Your story → step-9.tsx
   Step 10: Review & confirm → step-10.tsx
   ```

2. **Create OnboardingLayout** (shared across all steps)
   - Progress bar: "Step 1/10"
   - Back button (can go back and edit)
   - Next button
   - Current step highlighted
   - Auto-save after each step

3. **API endpoints for profile updates**
   ```
   PUT /api/profile → Update entire profile
   POST /api/profile/industries → Add/update industry positioning
   POST /api/profile/skills → Add skill
   POST /api/profile/projects → Add project
   ```

4. **Implement each step** (detailed below)

   **Step 1: Welcome**
   - "Welcome to SponsorFlow!"
   - Explanation of 10 steps
   - [Continue]

   **Step 2: Basic Info**
   - Full name, email, location (dropdown)
   - Years of experience (dropdown)
   - Target job title (dropdown or text)
   - LinkedIn URL (optional)
   - Portfolio URL (optional)
   - Validation: name required, location required, exp required

   **Step 3: Professional Background**
   - Current company, current role
   - Industries worked in (checkboxes: Fintech, Healthcare, SaaS, etc.)
   - Years in each industry (for fintech, healthcare, saas, etc.)
   - Validation: At least 1 industry selected

   **Step 4: Skills**
   - Design skills (checkboxes, select top 5)
   - Tools (checkboxes, select up to 8)
   - Other skills (comma-separated text)
   - Validation: At least 3 design skills selected

   **Step 5: Projects**
   - Add 3-5 key projects
   - For each: name, company, year, description, role, industry, impact
   - Ability to add/edit/remove projects
   - Validation: At least 1 project

   **Step 6: Sponsorship & Legal**
   - Do you require UK Skilled Worker sponsorship? (Yes/No)
   - Target annual salary in GBP
   - Availability (dropdown)
   - Remote preference (dropdown)
   - Validation: All required

   **Step 7: Fintech Positioning**
   - 3 text areas:
     1. Your fintech experience
     2. Problems you've solved
     3. What draws you to fintech
   - Also option to [Download template]

   **Step 8: Healthcare Positioning**
   - Same structure as Step 7

   **Step 9: Your Story**
   - Professional summary (1-2 paragraphs)
   - One thing not on your resume
   - Writing tone preference (dropdown: Direct, Warm, Formal)
   - Example phrases (comma-separated)
   - Validation: Summary required

   **Step 10: Review**
   - Show all entered data
   - [← Back to edit]
   - [Complete setup]
   - After completion: redirect to dashboard

5. **Database operations** (lib/db.ts)
   ```typescript
   export async function updateUserProfile(user_id, data) { ... }
   export async function addUserIndustry(user_id, industry_data) { ... }
   export async function addUserProject(user_id, project_data) { ... }
   export async function getOnboardingProgress(user_id) { ... }
   ```

6. **Auto-save logic**
   - Save after each step
   - Show "Saving..." indicator
   - Show "✓ Saved" on success
   - Handle errors gracefully

7. **Download Personalization Template**
   - Step 7 and 8 show: [Download Template (DOCX)]
   - Generate DOCX file with template structure
   - File: Personalization_Template.docx
   - User can fill offline, optionally upload back

### Acceptance Criteria

- [ ] Can complete all 10 steps in sequence
- [ ] Progress bar shows correct step (1/10, 2/10, etc.)
- [ ] Can go back and edit previous steps
- [ ] Data saves after each step
- [ ] After step 10, profile marked as complete
- [ ] Dashboard shows "Profile: 100% complete ✓"
- [ ] All form validation working (client + server)
- [ ] Can download personalization template
- [ ] Personalization template is valid DOCX file
- [ ] Redirect to dashboard after completion
- [ ] Database has all profile data:
  ```sql
  SELECT * FROM user_profiles WHERE user_id = 'xxx';
  SELECT * FROM user_industries WHERE profile_id = 'yyy';
  SELECT * FROM user_projects WHERE profile_id = 'yyy';
  SELECT * FROM user_skills WHERE profile_id = 'yyy';
  ```

### Verification Steps

```bash
# 1. Go through full onboarding
# http://localhost:3000/onboarding/step-1

# 2. Fill out all 10 steps
# Progress bar updates correctly

# 3. Download template at step 7
# File should be valid DOCX

# 4. Complete onboarding
# Redirected to dashboard

# 5. Verify in database
psql $DATABASE_URL << EOF
SELECT onboarding_complete, profile_complete_percent FROM user_profiles WHERE user_id = 'xxx';
-- Should show: true, 100
EOF

# 6. Test edit: Go back to step 2
# Change information
# Click next
# Verify update in database
```

### Next Step Handoff

When complete, you have:
- ✅ Full user profile captured
- ✅ 10-step onboarding complete
- ✅ All data in database
- ✅ Profile dashboard shows progress
- ✅ Ready for CSV import in Prompt 6
```

---

## 🚀 PROMPT 6: CSV Import & Company Parsing

**Timeframe:** 2–3 days  
**Goal:** Users can upload CSV, system parses flexibly, shows preview  
**Output:** 54 companies imported into database  

---

```
PROMPT:

You are building SponsorFlow Phase 1. User profiles complete (Prompt 5).

REFERENCE:
- SPONSORFLOW-DESIGN.md (Section 3: CSV Import)
- Flexible CSV parsing (any format)
- Column auto-detection

## Your Task

Build CSV upload and flexible parsing.

### What to Build

1. **Backend: CSV parsing** (lib/csv-parser.ts)
   - Accept CSV file (text/csv or .xlsx)
   - Parse with flexible column detection:
     - Looks for columns: company_name, website, industry, career_page, etc.
     - Maps different column names to standard fields
     - Example mappings:
       ```
       "Company Name" → company_name
       "Employer" → company_name
       "Organisation Name" → company_name
       "Website" → website
       "URL" → website
       "Industry" → industry
       "Type & Rating" → sponsor_status
       "Personalization Hook" → personalization_hook
       ```
   - Returns: { companies: [...], headers: [...], unrecognized_columns: [...] }

2. **Backend: Company import endpoint** (app/api/companies/import/route.ts)
   - Accept multipart form-data with file
   - Parse CSV
   - Validate each company:
     - company_name required
     - website optional
     - industry auto-categorized if missing
   - Detect duplicates:
     ```sql
     SELECT COUNT(*) FROM companies 
     WHERE user_id = 'xxx' 
     AND normalized_name = normalize('Company Name')
     ```
   - Store in database:
     ```
     INSERT INTO company_imports (user_id, file_name, companies_found, status)
     INSERT INTO companies (user_id, company_name, website, industry, import_id, ...)
     ```
   - Return: { total: 54, imported: 49, duplicates: 5, duplicate_list: [...] }

3. **Frontend: CSV upload page** (app/(dashboard)/companies/import/page.tsx)
   - Drag & drop file area
   - Or "Click to browse" button
   - File input accepts: .csv, .xlsx
   - On select: Show loading indicator

4. **Frontend: Preview page**
   - Show parsed data in table:
     ```
     Company Name | Website | Industry | Status
     Airbnb | airbnb.com | Marketplace | ✓ New
     Canva | canva.com | Design | ✓ New
     ClearBank | clear.bank | Fintech | ⚠ Duplicate
     ...
     ```
   - Summary:
     ```
     ✓ 54 companies found
     ⚠ 5 companies already in your system
     
     Options:
     ☐ Skip duplicates (import 49 new)
     ☐ Replace existing with updated data
     ☐ Import all (merge campaigns)
     
     Campaign tag (optional):
     [london_shortlist_v2____________]
     
     [Import] [Cancel]
     ```

5. **Backend: Duplicate resolution**
   - If user chooses "Skip":
     - INSERT only new companies
   - If user chooses "Replace":
     - UPDATE existing companies with new data
   - If user chooses "Merge":
     - INSERT all (allow duplicates but tag differently)

6. **Database operations** (lib/db.ts)
   ```typescript
   export async function importCompanies(user_id, companies, options) { ... }
   export async function checkDuplicateCompanies(user_id, company_names) { ... }
   export async function normalizeCompanyName(name) { ... }
   ```

7. **Helper functions** (lib/csv-parser.ts)
   ```typescript
   export async function parseCSV(file) { ... }
   export async function detectColumns(headers) { ... }
   export async function mapColumn(headerName) { ... }
   ```

### Acceptance Criteria

- [ ] Can upload CSV file
- [ ] System detects columns automatically
- [ ] Shows preview of parsed companies
- [ ] Shows count: "X companies found"
- [ ] Detects duplicates correctly
- [ ] Can choose: Skip, Replace, or Merge duplicates
- [ ] Can add campaign tag
- [ ] After import, companies visible on dashboard
- [ ] All 54 companies in database:
  ```sql
  SELECT COUNT(*) FROM companies WHERE user_id = 'xxx';
  -- Should show: 54
  ```
- [ ] Duplicate tracking works (can't send to same person twice)

### Verification Steps

```bash
# 1. Go to companies import page
# http://localhost:3000/companies/import

# 2. Drag & drop your CSV file
# Should show preview

# 3. Select import option
# Should see "Importing..." indicator

# 4. After import, go to companies list
# http://localhost:3000/companies
# Should see 54 companies

# 5. Verify in database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM companies WHERE user_id = 'xxx'"
# Should show: 54

# 6. Check company data
psql $DATABASE_URL -c "SELECT company_name, website, industry FROM companies WHERE user_id = 'xxx' LIMIT 5"
# Should show: Airbnb, Canva, ClearBank, etc.
```

### Next Step Handoff

When complete, you have:
- ✅ CSV import working
- ✅ Flexible parsing
- ✅ Duplicate detection
- ✅ Companies in database
- ✅ Ready for AI email generation in Prompt 7
```

---

## 🚀 PROMPT 7: AI Email Generation (Claude API)

**Timeframe:** 2–3 days  
**Goal:** Select company → AI generates personalized email draft  
**Output:** Personalized email shown for approval  

---

```
PROMPT:

You are building SponsorFlow Phase 1. CSV import complete (Prompt 6).

REFERENCE:
- SPONSORFLOW-DESIGN.md (Section 4: AI Email Generation)
- Claude API (Anthropic)
- User profile + company data → personalized email

## Your Task

Integrate Claude API for personalized email generation.

### What to Build

1. **Setup Claude API**
   - Get API key from console.anthropic.com
   - Add to .env.local:
     ```
     ANTHROPIC_API_KEY=sk-ant-...
     ```
   - Install @anthropic-ai/sdk:
     ```bash
     npm install @anthropic-ai/sdk
     ```

2. **Backend: Email generation endpoint** (app/api/emails/draft/route.ts)
   - Accept: { company_id, contact_id (optional) }
   - Fetch company data
   - Fetch user profile + industries
   - Determine which industry positioning to use:
     ```
     If company.industry == 'fintech' → use user's fintech positioning
     If company.industry == 'healthcare' → use user's healthcare positioning
     Else → use general positioning
     ```
   - Build Claude prompt:
     ```
     You are writing a personalized cold email...
     
     CANDIDATE DATA:
     - Name: Doyin
     - Professional summary: ...
     - Fintech experience: 4 years...
     - Achievement: 40% friction reduction...
     - Motivation: Making complex workflows accessible...
     - Tone: Professional but warm
     
     COMPANY DATA:
     - Name: ClearBank
     - Industry: Fintech
     - Website: clear.bank
     - Personalization hook: Banking infrastructure...
     
     RULES:
     1. Use candidate's actual experience, not invented
     2. Reference company's specific product/challenge
     3. Connect candidate's experience to company need
     4. Keep length: 70–150 words
     5. Tone: warm, direct, not corporate
     6. NO clichés: "passionate", "dynamic", "innovative"
     7. End with: [Portfolio] [LinkedIn] [CV]
     8. Signature: First name only
     
     Generate the personalized email:
     ```
   - Call Claude API
   - Parse response
   - Return: { subject, body, positioning_angle, confidence }

3. **Frontend: Email drafting page** (app/(dashboard)/emails/draft.tsx)
   - Select company: [Dropdown of all companies]
   - On select:
     - Show loading: "Generating personalized email..."
     - Call POST /api/emails/draft
   - Display draft:
     ```
     ┌──────────────────────────┐
     │ Draft Email              │
     │ Company: ClearBank       │
     │ Contact: Jane Smith      │
     │ Angle: Fintech + Clarity │
     │                          │
     │ Subject:                 │
     │ [Email subject line]     │
     │                          │
     │ Hi Jane,                 │
     │ [Email body...]          │
     │                          │
     │ [Portfolio] [LinkedIn]   │
     │                          │
     │ [Edit] [Regenerate]      │
     │ [Reject] [Approve]       │
     └──────────────────────────┘
     ```

4. **Backend: Save drafted email** (app/api/emails/route.ts POST)
   - Accept: { company_id, contact_id, subject, body, status: 'draft' }
   - Save to outreach_emails table
   - Return: { email_id, status }

5. **Error handling**
   - If Claude API fails: Show error, allow regenerate
   - If company not found: Show 404
   - If user not authenticated: Return 401

6. **Database operations** (lib/db.ts)
   ```typescript
   export async function generateEmailDraft(user_id, company_id) { ... }
   export async function saveEmailDraft(user_id, company_id, email_data) { ... }
   ```

### Acceptance Criteria

- [ ] Can select company from dropdown
- [ ] Calls Claude API on selection
- [ ] Returns personalized email in <3 seconds
- [ ] Email uses candidate's actual positioning
- [ ] Email references company-specific data
- [ ] Email does NOT contain fabricated claims
- [ ] Subject line is specific (not generic)
- [ ] Body is 70–150 words
- [ ] Tone matches user preference
- [ ] Email saved to database as draft
- [ ] Can regenerate email (calls Claude again)
- [ ] Can edit email manually
- [ ] Error handling if API fails

### Verification Steps

```bash
# 1. Go to email drafting
# http://localhost:3000/emails/draft

# 2. Select a company (e.g., ClearBank)
# Should show "Generating..." for 2–3 seconds

# 3. Email should appear with:
# - Personalized subject line
# - Body mentioning company-specific context
# - Candidate's actual achievement mentioned
# - 70–150 words

# 4. Test different company industries
# - Select fintech company → should mention fintech positioning
# - Select healthcare company → should mention healthcare positioning

# 5. Test regenerate
# - Click [Regenerate]
# - Should produce different email (same angle)

# 6. Verify in database
psql $DATABASE_URL -c "SELECT company_id, subject, status FROM outreach_emails WHERE user_id = 'xxx'"
# Should show: drafts saved
```

### Next Step Handoff

When complete, you have:
- ✅ Claude API integrated
- ✅ Personalized email generation
- ✅ AI drafts saved to database
- ✅ Edit/regenerate options
- ✅ Ready for approval workflow in Prompt 8
```

---

## 🚀 PROMPT 8: Email Approval Workflow

**Timeframe:** 2 days  
**Goal:** Review drafts, approve, edit, or reject before sending  
**Output:** Emails marked "ready to send"  

---

```
PROMPT:

You are building SponsorFlow Phase 1. Email generation complete (Prompt 7).

REFERENCE:
- SPONSORFLOW-DESIGN.md (Section 4.2: Email Approval UI)
- User approves every email before sending

## Your Task

Build email review + approval interface.

### What to Build

1. **Frontend: Email review list** (app/(dashboard)/emails/pending/page.tsx)
   - Show all draft emails:
     ```
     ┌──────────────────────────────────────┐
     │ Pending Approval (12 emails)         │
     ├──────────────────────────────────────┤
     │                                      │
     │ Airbnb - Hi Jane                     │
     │ Subject: Exploring Airbnb's trust... │
     │ Status: Draft                        │
     │ [Review]                             │
     │                                      │
     │ Canva - Hi Sarah                     │
     │ Subject: Design tools for...         │
     │ Status: Draft                        │
     │ [Review]                             │
     │                                      │
     └──────────────────────────────────────┘
     ```

2. **Frontend: Email approval modal** (components/emails/ApprovalModal.tsx)
   - Shows:
     ```
     ┌──────────────────────────────────────┐
     │ Review Email                         │
     │                                      │
     │ Company: ClearBank                   │
     │ Contact: Jane Smith                  │
     │ Angle Used: Fintech + Complexity     │
     │                                      │
     │ ─────────────────────────────────    │
     │ SUBJECT: Embedded finance + design   │
     │                                      │
     │ Hi Jane,                             │
     │                                      │
     │ I came across ClearBank...           │
     │ [Full email body]                    │
     │ [Portfolio] [LinkedIn] [CV]          │
     │                                      │
     │ Best,                                │
     │ Doyin                                │
     │ ─────────────────────────────────    │
     │                                      │
     │ [Edit]  [Regenerate]  [Reject]       │
     │ [Approve & Queue]                    │
     │                                      │
     └──────────────────────────────────────┘
     ```

3. **Backend: Update email status** (app/api/emails/:id/route.ts)
   - PUT /api/emails/{email_id}
   - Accept: { status, body (if edited) }
   - Statuses: draft → approved → ready_to_send → sent
   - If editing: Save new body, recalculate word count
   - Return: { success, email_id, status }

4. **Backend: Reject email** (app/api/emails/:id/reject/route.ts)
   - POST /api/emails/{email_id}/reject
   - Set status to 'rejected'
   - Don't delete (keep for history)
   - Return: { success }

5. **Frontend: Editing**
   - [Edit] button opens text editor
   - User can modify subject + body
   - Shows word count (target: 70–150 words)
   - Save edited version
   - Status stays 'draft' until approved

6. **Frontend: Regenerate**
   - [Regenerate] calls Claude again
   - Same company, but generates new draft
   - Shows new draft for comparison
   - User can regenerate multiple times

7. **Flow logic**
   ```
   Draft email created
      ↓
   User clicks [Review]
      ↓
   Shows approval modal
      ↓
   User can:
   ├─ [Edit] → Edit text → [Save] → Back to modal
   ├─ [Regenerate] → New draft → Show new version
   ├─ [Reject] → Delete from view
   └─ [Approve] → Mark as 'ready_to_send'
      ↓
   Approved email → Ready to send
   ```

### Acceptance Criteria

- [ ] Can view all draft emails
- [ ] Can click [Review] to see full email
- [ ] Can edit subject + body
- [ ] Can regenerate email
- [ ] Can approve email
- [ ] Can reject email
- [ ] Approved emails marked "ready_to_send" in database
- [ ] Status changes saved:
  ```sql
  SELECT status FROM outreach_emails WHERE id = 'xxx';
  -- Should show: ready_to_send
  ```
- [ ] Edited emails show updated text
- [ ] Word count shown (70–150 target)

### Verification Steps

```bash
# 1. Go to pending emails
# http://localhost:3000/emails/pending

# 2. Click [Review] on first email
# Should show approval modal

# 3. Click [Edit]
# Should open text editor
# Change subject
# Click [Save]

# 4. Click [Regenerate]
# Should show new draft

# 5. Click [Approve]
# Should mark as ready_to_send

# 6. Verify in database
psql $DATABASE_URL -c "SELECT status FROM outreach_emails WHERE company_id IN (SELECT id FROM companies WHERE company_name = 'ClearBank') LIMIT 1"
# Should show: ready_to_send
```

### Next Step Handoff

When complete, you have:
- ✅ Email review workflow
- ✅ Approve/reject/edit options
- ✅ Emails marked ready to send
- ✅ Ready for Gmail integration in Prompt 9
```

---

**[Prompts 9–12 continue with Gmail integration, sending, reply monitoring, and dashboard...]**

*Due to length constraints, I'll create the remaining 4 prompts in a follow-up, but the structure is the same.*

---

## Summary: 12-Prompt Build Plan

| Prompt | Timeframe | Feature | Status |
|---|---|---|---|
| 1 | 2–3 days | Database schema + migrations | 👈 START HERE |
| 2 | 1 day | Next.js setup + Tailwind | Builds on #1 |
| 3 | 2–3 days | Email/password auth | Builds on #1-2 |
| 4 | 1–2 days | Google OAuth | Builds on #3 |
| 5 | 3–4 days | User profile onboarding (10 steps) | Builds on #4 |
| 6 | 2–3 days | CSV import + parsing | Builds on #5 |
| 7 | 2–3 days | AI email generation (Claude) | Builds on #6 |
| 8 | 2 days | Email approval workflow | Builds on #7 |
| 9 | 2–3 days | Gmail OAuth + sending | Builds on #8 |
| 10 | 2 days | Send emails + rate limiting | Builds on #9 |
| 11 | 2–3 days | Gmail webhooks + reply monitoring | Builds on #10 |
| 12 | 2–3 days | Dashboard + analytics | Builds on #11 |

**Total: 26–37 days (can overlap, realistic 6–8 weeks)**

---

**End of Phase 1 Prompt Pack (Prompts 1–8 included here)**

**Status:** Ready to execute  
**Next:** Continue with Prompts 9–12 (will create in follow-up)  

Want me to create Prompts 9–12 now as well?
