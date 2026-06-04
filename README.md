# Tutorverse KYC — Identity Verification Service

A standalone identity verification service for the Tutorverse tutor marketplace. Tutors submit their identity and qualification documents, the system reads and validates them automatically, and returns a clear verification status via API.

## What this does

- Tutors upload their SA ID document and qualification certificate
- The system reads the document automatically using OCR (Tesseract.js)
- The SA ID number is validated using the Luhn algorithm and date-of-birth checks
- The name on the form is checked against the text found in the document
- A verification status is returned via a REST API
- Identity is checked against Smile Identity's KYC provider (sandbox mode)

## How to run it locally

### 1. Clone the repository
git clone https://github.com/samkelendlovu847-sketch/tutorverse-kyc.git
cd tutorverse-kyc

### 2. Install dependencies
npm install

### 3. Set up environment variables
Create a .env.local file in the root folder with these values:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
SMILE_IDENTITY_API_KEY=your_smile_identity_sandbox_key

### 4. Run the development server
npm run dev

Then open http://localhost:3000 in your browser.

## API Documentation

### GET /api/verify

Check the verification status of a tutor by ID number.

**Parameters:**
- id_number (required) — the 13-digit SA ID number
- full_name (optional) — the tutor's full name

**Example request:**
GET /api/verify?id_number=9001015009087&full_name=Test Tutor

**Example response:**
{
  "id_number": "9001015009087",
  "full_name": "Test Tutor",
  "status": "pending",
  "valid_format": true,
  "details": {
    "dateOfBirth": "1990-01-01",
    "gender": "Male",
    "citizenship": "SA Citizen"
  },
  "kyc_check": {
    "verified": false,
    "message": "Verification is pending review",
    "provider": "smile_identity"
  }
}

**Status values:**
- pending — documents submitted, awaiting review
- verified — tutor has been fully verified
- not_found — no record found for this ID number

## What is real vs simulated

| Check | Status |
|-------|--------|
| SA ID number format validation | Real — runs Luhn algorithm |
| Date of birth extraction | Real — parsed from ID number |
| Gender and citizenship extraction | Real — parsed from ID number |
| OCR document reading | Real — uses Tesseract.js |
| Name matching against document | Real — checks extracted text |
| Home Affairs identity check | Simulated — uses Smile Identity sandbox |

## Tech stack

- Next.js — frontend and API
- Supabase — PostgreSQL database
- Tesseract.js — OCR document reading
- Smile Identity — KYC provider (sandbox)
- Vercel — hosting

## Privacy and POPIA compliance

- Only the minimum required data is collected
- No real personal documents are stored
- All testing uses synthetic sample data only
- The system never stores raw document images