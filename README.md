# Tutorverse KYC — Identity & Qualification Verification Service

> The trust foundation of Tutorverse. Automatically verify that a tutor is who they claim to be.

## Overview

Tutorverse KYC is a standalone identity verification service built for the Tutorverse tutor marketplace. It allows tutors to submit their identity and qualification documents, validates them automatically, and exposes a simple API that the rest of the Tutorverse platform uses to display a **Verified Tutor** badge.

**Live service:** https://tutorverse-kyc.vercel.app

---

## Features

- **Tutor authentication** — secure sign up and sign in via email or Google
- **SA ID validation** — 13-digit structure check, Luhn algorithm, date of birth, gender and citizenship extraction
- **OCR document reading** — extracts text from uploaded ID and qualification documents using Tesseract.js
- **Document authenticity checks** — file size, type, and suspicious keyword heuristics
- **Face match** — compares selfie to ID photo using face-api.js
- **Qualification verification** — checks institution against the DHET accredited SA institutions list
- **KYC provider integration** — identity checked against Smile Identity (sandbox)
- **Admin dashboard** — internal team can review, approve and reject submissions
- **Tutor dashboard** — tutors can track their verification status
- **REST API** — exposes verification status for consumption by the main Tutorverse app
- **POPIA & GDPR compliant** — minimum data, hashed IDs, EU-hosted database, right to erasure

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 |
| Language | TypeScript |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (Email + Google OAuth) |
| OCR | Tesseract.js |
| Face match | face-api.js |
| KYC provider | Smile Identity (sandbox) |
| Bot protection | hCaptcha |
| Hosting | Vercel |
| CI/CD | GitHub → Vercel (auto-deploy on push) |

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- A Supabase project
- A Vercel account (for deployment)

### 1. Clone the repository

```bash
git clone https://github.com/samkelendlovu847-sketch/tutorverse-kyc.git
cd tutorverse-kyc
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of the project:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# hCaptcha
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key

# Internal API key — shared with other Tutorverse services
TUTORVERSE_API_KEY=your_internal_api_key

# KYC Provider
SMILE_IDENTITY_API_KEY=your_smile_identity_sandbox_key
```

### 4. Set up the database

Run the contents of `schema.sql` in your Supabase SQL Editor. This creates the required tables and Row Level Security policies.

### 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 6. Run tests

```bash
npm test
```

---

## Application Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Tutors | 5-step KYC verification flow |
| `/signup` | Public | Create a tutor account |
| `/signin` | Public | Sign in to existing account |
| `/dashboard` | Tutors | View verification status |
| `/forgot-password` | Public | Request a password reset |
| `/reset-password` | Public | Set a new password |
| `/admin-login` | Admin | Admin portal sign in |
| `/admin` | Admin only | Review and manage all submissions |

---

## API Reference

All API endpoints require an `x-api-key` header set to your `TUTORVERSE_API_KEY`.

### POST /api/verify

Submit a tutor for verification programmatically. Used by other Tutorverse services to trigger verification without going through the UI.

**Request**

```http
POST /api/verify
x-api-key: your_api_key
Content-Type: application/json

{
  "user_id": "uuid",
  "full_name": "Jane Smith",
  "id_number": "7601015800084"
}
```

**Response `201`**

```json
{
  "success": true,
  "submission_id": "uuid",
  "status": "pending",
  "message": "Verification submitted successfully.",
  "id_validation": {
    "valid": true,
    "date_of_birth": "1976-01-01",
    "gender": "Female",
    "citizenship": "SA Citizen"
  }
}
```

**Error responses**

| Code | Reason |
|------|--------|
| 400 | Missing required fields |
| 401 | Invalid or missing API key |
| 409 | Tutor is already verified |
| 422 | Invalid SA ID number |
| 500 | Internal server error |

---

### GET /api/verify

Get the current verification status for a tutor.

```http
GET /api/verify?user_id=uuid
x-api-key: your_api_key
```

**Response**

```json
{
  "found": true,
  "submission_id": "uuid",
  "status": "verified",
  "full_name": "Jane Smith",
  "submitted_at": "2026-06-01T10:00:00Z",
  "verified": true
}
```

---

### GET /api/badge

Returns the verified badge status for a tutor. This is the primary endpoint called by the main Tutorverse app to display the **Verified Tutor** badge on a tutor's profile.

```http
GET /api/badge?user_id=uuid
x-api-key: your_api_key
```

**Response**

```json
{
  "verified": true,
  "status": "verified",
  "full_name": "Jane Smith",
  "verified_at": "2026-06-01T12:00:00Z",
  "qualifications": [
    {
      "type": "degree",
      "institution": "University of Cape Town",
      "accredited": true,
      "status": "verified"
    }
  ],
  "badge": {
    "label": "Verified Tutor",
    "color": "#38A169",
    "icon": "✓"
  }
}
```

---

## Verification Checks

| Check | Type | Description |
|-------|------|-------------|
| SA ID format | ✅ Real | 13-digit structure, Luhn algorithm |
| Date of birth | ✅ Real | Extracted and validated from ID number |
| Gender & citizenship | ✅ Real | Extracted from ID number |
| OCR extraction | ✅ Real | Tesseract.js reads uploaded documents |
| Name match | ✅ Real | Submitted name checked against OCR text |
| Document authenticity | ✅ Real | File size, type, and keyword heuristics |
| Face match | ✅ Real | Selfie compared to ID photo via face-api.js |
| Qualification check | ✅ Real | Institution checked against DHET accredited list |
| Home Affairs check | ⚠️ Sandbox | Smile Identity sandbox — not live DHA data |

---

## Security & Compliance

### POPIA (Protection of Personal Information Act)
- Minimum data collected — only what is strictly necessary
- SA ID numbers are hashed with SHA-256 before storing — raw numbers are never persisted
- Raw document images are never stored
- All testing uses synthetic sample data only — no real personal documents
- Users can request deletion of their data at any time

### GDPR
- Database hosted in West EU (Ireland) — adequate protection under POPIA Section 72
- Right to erasure supported
- Explicit consent recorded at sign up with timestamp

### Technical security
- Row Level Security enforced on all Supabase tables — tutors can only access their own data
- Admin access requires a separate admin role stored in a dedicated table
- hCaptcha bot protection on all authentication forms
- Security headers on all routes — CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- Rate limiting configured on all Supabase auth endpoints
- Refresh token replay attack protection enabled
- Passwords require minimum 12 characters, uppercase, lowercase, numbers and symbols

---

## Integration with Tutorverse

This service is designed to be consumed by other Tutorverse services via the badge API:

```javascript
// Example: check if a tutor is verified before allowing a booking
const response = await fetch(`https://tutorverse-kyc.vercel.app/api/badge?user_id=${tutorId}`, {
  headers: { 'x-api-key': process.env.TUTORVERSE_API_KEY }
})
const { verified, badge } = await response.json()

if (verified) {
  // Show verified badge on tutor profile
  // Allow booking to proceed
}
```

---

## Project Structure

tutorverse-kyc/

├── app/

│   ├── page.tsx              # Main KYC verification flow

│   ├── signup/               # Tutor sign up

│   ├── signin/               # Tutor sign in

│   ├── dashboard/            # Tutor status dashboard

│   ├── forgot-password/      # Password reset

│   ├── reset-password/       # New password

│   ├── admin/                # Admin dashboard

│   ├── admin-login/          # Admin sign in

│   ├── admin-callback/       # Admin OAuth callback

│   └── api/

│       ├── badge/            # GET /api/badge

│       └── verify/           # GET & POST /api/verify

├── lib/

│   ├── validate.ts           # SA ID validation + Luhn

│   ├── qualifications.ts     # Qualification verification

│   ├── ocr.ts                # Tesseract.js OCR

│   ├── faceMatch.ts          # face-api.js face matching

│   ├── kyc.ts                # Smile Identity integration

│   └── supabase.ts           # Supabase client

├── schema.sql                # Database schema + RLS policies

├── jest.config.js            # Test configuration

└── next.config.ts            # Security headers + Next.js config

---

## Running Tests

```bash
npm test
```

All 7 tests cover the SA ID validation logic — format checks, Luhn algorithm, date of birth extraction, gender and citizenship parsing.

---

## Deployment

The service auto-deploys to Vercel on every push to the `main` branch via GitHub Actions.

To deploy manually:

```bash
vercel --prod
```

Make sure all environment variables are configured in your Vercel project settings before deploying.

---

## Team

Group 4 — Tutorverse KYC Verification
Built as part of the Tutorverse marketplace platform.

---

*Protected by POPIA · © 2026 Tutorverse (Pty) Ltd*