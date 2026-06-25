import React from 'react'

const DARK = '#000000'
const BORDER = '#E5E5E5'
const CARD = '#F8F9FA'
const MUTED = '#888888'

export default function PrivacyPolicy() {
  const lastUpdated = '25 June 2026'

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: DARK, marginBottom: '16px', paddingBottom: '10px', borderBottom: `1px solid ${BORDER}` }}>
        {title}
      </h2>
      {children}
    </div>
  )

  const P = ({ children }: { children: React.ReactNode }) => (
    <p style={{ fontSize: '15px', color: '#333', lineHeight: '1.8', marginBottom: '14px' }}>
      {children}
    </p>
  )

  const Li = ({ children }: { children: React.ReactNode }) => (
    <li style={{ fontSize: '15px', color: '#333', lineHeight: '1.8', marginBottom: '8px', paddingLeft: '8px' }}>
      {children}
    </li>
  )

  const InfoBox = ({ icon, title, text }: { icon: string, title: string, text: string }) => (
    <div style={{ backgroundColor: CARD, borderRadius: '12px', padding: '20px 24px', marginBottom: '12px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '24px', flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ fontSize: '14px', fontWeight: 700, color: DARK, marginBottom: '4px' }}>{title}</p>
        <p style={{ fontSize: '14px', color: MUTED, lineHeight: '1.6', margin: 0 }}>{text}</p>
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 100 }}>
        <a href="/" style={{ fontWeight: 700, fontSize: '18px', color: DARK, textDecoration: 'none' }}>✕ Tutorverse</a>
        <span style={{ fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Privacy Policy</span>
      </nav>

      {/* Hero */}
      <div style={{ backgroundColor: DARK, padding: '64px 32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#fff', marginBottom: '12px', letterSpacing: '-0.5px' }}>Privacy Policy</h1>
        <p style={{ fontSize: '15px', color: '#999', marginBottom: '8px' }}>Last updated: {lastUpdated}</p>
        <p style={{ fontSize: '15px', color: '#999' }}>Tutorverse (Pty) Ltd — KYC Verification Service</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 24px' }}>

        {/* Summary cards */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '16px', color: MUTED, marginBottom: '24px', textAlign: 'center' }}>Here is a plain-language summary of the most important points:</p>
          <InfoBox icon="🔒" title="We collect only what we need" text="We only collect your name, email address, and the documents required to verify your identity as a tutor. Nothing more." />
          <InfoBox icon="🗑️" title="You can delete your data" text="You have the right to request deletion of all your personal data at any time. We will action this within 30 days." />
          <InfoBox icon="🌍" title="Your data is stored securely in the EU" text="Your data is stored in West EU (Ireland) on Supabase, which meets the data protection standards required by POPIA and GDPR." />
          <InfoBox icon="🚫" title="We never sell your data" text="We do not sell, rent, or share your personal data with third parties for marketing or advertising purposes. Ever." />
          <InfoBox icon="#️⃣" title="Your ID number is hashed" text="We never store your raw SA ID number. It is converted to a one-way hash (SHA-256) before being saved — it cannot be reversed." />
        </div>

        {/* Section 1 */}
        <Section title="1. Who we are">
          <P>
            This Privacy Policy applies to the Tutorverse KYC Verification Service, operated by Tutorverse (Pty) Ltd (&quot;Tutorverse&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). This service is used to verify the identity and qualifications of tutors on the Tutorverse marketplace platform.
          </P>
          <P>
            We are committed to protecting your personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA) and, where applicable, the General Data Protection Regulation (GDPR).
          </P>
          <P>
            If you have any questions about this policy, please contact us at <strong>privacy@tutorverse.co.za</strong>.
          </P>
        </Section>

        {/* Section 2 */}
        <Section title="2. What information we collect">
          <P>We collect the following categories of personal information:</P>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <Li><strong>Account information</strong> — your email address and password (or Google account details if you sign in with Google)</Li>
            <Li><strong>Identity information</strong> — your full name and South African ID number (stored as a one-way hash only)</Li>
            <Li><strong>Document images</strong> — photographs of your ID document (front and back) and qualification certificate, used for OCR processing only and never stored permanently</Li>
            <Li><strong>Biometric data</strong> — a selfie photograph used for face matching against your ID document, processed in your browser and never stored on our servers</Li>
            <Li><strong>Qualification information</strong> — the type of qualification, institution name, and year obtained, as extracted from your uploaded certificate</Li>
            <Li><strong>Consent record</strong> — a timestamp of when you agreed to this privacy policy and our terms of use</Li>
          </ul>
          <P>
            We do not collect your physical address, phone number, bank details, or any other personal information beyond what is listed above.
          </P>
        </Section>

        {/* Section 3 */}
        <Section title="3. Why we collect your information">
          <P>We collect and process your personal information for the following specific purposes:</P>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <Li><strong>Identity verification</strong> — to confirm that you are who you claim to be, as required for tutors on the Tutorverse marketplace</Li>
            <Li><strong>Qualification verification</strong> — to confirm that your educational qualifications are genuine and from an accredited institution</Li>
            <Li><strong>Fraud prevention</strong> — to detect and prevent fraudulent or fake identity submissions</Li>
            <Li><strong>Platform trust and safety</strong> — to enable Tutorverse to display a &quot;Verified Tutor&quot; badge on your profile, increasing trust with parents and students</Li>
            <Li><strong>Legal compliance</strong> — to comply with applicable South African laws and regulations</Li>
          </ul>
          <P>
            We will never use your personal information for marketing, advertising, or any purpose not listed above without your explicit consent.
          </P>
        </Section>

        {/* Section 4 */}
        <Section title="4. Legal basis for processing">
          <P>We process your personal information on the following legal bases:</P>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <Li><strong>Consent (POPIA Section 11(1)(a) / GDPR Article 6(1)(a))</strong> — you give us explicit consent when you sign up and submit your documents for verification</Li>
            <Li><strong>Contractual necessity (POPIA Section 11(1)(c) / GDPR Article 6(1)(b))</strong> — processing is necessary for you to use the Tutorverse platform as a tutor</Li>
            <Li><strong>Legitimate interest (POPIA Section 11(1)(f) / GDPR Article 6(1)(f))</strong> — fraud prevention and platform safety</Li>
          </ul>
        </Section>

        {/* Section 5 */}
        <Section title="5. How we protect your information">
          <P>We take the security of your personal information seriously. The following technical and organisational measures are in place:</P>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <Li><strong>Encryption in transit</strong> — all data is transmitted over HTTPS/TLS</Li>
            <Li><strong>Encryption at rest</strong> — all data stored in Supabase is encrypted at rest using AES-256</Li>
            <Li><strong>ID number hashing</strong> — your SA ID number is converted to a SHA-256 hash before being stored. The raw ID number is never saved to our database</Li>
            <Li><strong>Document images</strong> — document images are processed in your browser using Tesseract.js and are never uploaded to or stored on our servers</Li>
            <Li><strong>Selfie processing</strong> — your selfie is processed entirely in your browser using face-api.js and is never transmitted to our servers</Li>
            <Li><strong>Row Level Security</strong> — database-level access controls ensure you can only access your own records</Li>
            <Li><strong>Admin access controls</strong> — admin access requires a separate authorised account and is fully logged</Li>
            <Li><strong>Bot protection</strong> — hCaptcha is used on all authentication forms to prevent automated attacks</Li>
            <Li><strong>Rate limiting</strong> — all authentication endpoints are rate limited to prevent brute force attacks</Li>
            <Li><strong>Security headers</strong> — Content Security Policy, HSTS, X-Frame-Options and other security headers are applied to all pages</Li>
          </ul>
        </Section>

        {/* Section 6 */}
        <Section title="6. Where your information is stored">
          <P>
            Your personal information is stored in a PostgreSQL database hosted by Supabase in <strong>West EU (Ireland)</strong>. Ireland is a member state of the European Union and subject to GDPR, which the South African Information Regulator recognises as providing an adequate level of protection for personal information transferred from South Africa (POPIA Section 72).
          </P>
          <P>
            Your data does not leave the EU except where necessary to provide the verification service (for example, when checking your identity against the Smile Identity KYC provider, whose servers may be located in other jurisdictions).
          </P>
        </Section>

        {/* Section 7 */}
        <Section title="7. Who we share your information with">
          <P>We share your personal information with the following third parties only where strictly necessary:</P>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <Li><strong>Supabase</strong> — our database and authentication provider. Supabase processes your data on our behalf under a Data Processing Agreement</Li>
            <Li><strong>Smile Identity</strong> — our KYC provider, used to verify your identity against authoritative sources. Only your name and hashed ID number are shared</Li>
            <Li><strong>Tutorverse platform</strong> — your verification status (verified or not) and your name are shared with the main Tutorverse application to display your Verified Tutor badge. No raw documents or ID numbers are shared</Li>
          </ul>
          <P>
            We do not share your personal information with any other third parties. We do not sell your data to advertisers, data brokers, or any other parties.
          </P>
        </Section>

        {/* Section 8 */}
        <Section title="8. Your rights">
          <P>Under POPIA and GDPR, you have the following rights regarding your personal information:</P>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <Li><strong>Right of access</strong> — you have the right to request a copy of all personal information we hold about you</Li>
            <Li><strong>Right to rectification</strong> — you have the right to request correction of inaccurate personal information</Li>
            <Li><strong>Right to erasure</strong> — you have the right to request deletion of all your personal information. We will action this within 30 days</Li>
            <Li><strong>Right to object</strong> — you have the right to object to the processing of your personal information</Li>
            <Li><strong>Right to data portability</strong> — you have the right to receive your personal information in a structured, machine-readable format</Li>
            <Li><strong>Right to withdraw consent</strong> — you may withdraw your consent to processing at any time, without affecting the lawfulness of processing before withdrawal</Li>
          </ul>
          <P>
            To exercise any of these rights, please contact us at <strong>privacy@tutorverse.co.za</strong>. We will respond within 30 days.
          </P>
          <P>
            If you are not satisfied with our response, you have the right to lodge a complaint with the South African Information Regulator at <strong>inforeg@justice.gov.za</strong> or with your local data protection authority.
          </P>
        </Section>

        {/* Section 9 */}
        <Section title="9. Data retention">
          <P>
            We retain your personal information for as long as your account is active or as long as is necessary to provide the verification service. Specifically:
          </P>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <Li><strong>Account information</strong> — retained until you delete your account</Li>
            <Li><strong>Verification records</strong> — retained for 2 years from the date of submission, after which they are automatically deleted</Li>
            <Li><strong>Document images</strong> — never stored. Processed in-browser only</Li>
            <Li><strong>Selfie photographs</strong> — never stored. Processed in-browser only</Li>
          </ul>
          <P>
            If you request deletion of your account, all your personal information will be deleted within 30 days, except where retention is required by law.
          </P>
        </Section>

        {/* Section 10 */}
        <Section title="10. Cookies and tracking">
          <P>
            This service uses only strictly necessary cookies required for authentication (session tokens provided by Supabase Auth). We do not use advertising cookies, tracking pixels, or any third-party analytics tools that collect personal information.
          </P>
        </Section>

        {/* Section 11 */}
        <Section title="11. Children">
          <P>
            This service is intended for use by adults (18 years and older) who wish to register as tutors on the Tutorverse platform. We do not knowingly collect personal information from anyone under the age of 18. If you believe a minor has submitted personal information to us, please contact us immediately at <strong>privacy@tutorverse.co.za</strong>.
          </P>
        </Section>

        {/* Section 12 */}
        <Section title="12. Changes to this policy">
          <P>
            We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. When we make material changes, we will notify you by email and update the &quot;Last updated&quot; date at the top of this page. Your continued use of the service after the effective date of the updated policy constitutes your acceptance of the changes.
          </P>
        </Section>

        {/* Section 13 */}
        <Section title="13. Contact us">
          <P>If you have any questions, concerns or requests regarding this Privacy Policy or the handling of your personal information, please contact us:</P>
          <div style={{ backgroundColor: CARD, borderRadius: '12px', padding: '24px 28px', marginTop: '16px' }}>
            <p style={{ fontSize: '15px', color: DARK, fontWeight: 600, marginBottom: '8px' }}>Tutorverse (Pty) Ltd</p>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '4px' }}>Email: privacy@tutorverse.co.za</p>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '4px' }}>Information Officer: [Name to be appointed]</p>
            <p style={{ fontSize: '14px', color: MUTED }}>South Africa</p>
          </div>
        </Section>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '32px', marginTop: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: MUTED, marginBottom: '8px' }}>
            This policy is compliant with the Protection of Personal Information Act 4 of 2013 (POPIA) and the General Data Protection Regulation (GDPR).
          </p>
          <p style={{ fontSize: '12px', color: '#ccc' }}>
            © 2026 Tutorverse (Pty) Ltd · All rights reserved
          </p>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
            <a href="/" style={{ fontSize: '13px', color: MUTED, textDecoration: 'none' }}>Home</a>
            <a href="/signin" style={{ fontSize: '13px', color: MUTED, textDecoration: 'none' }}>Sign in</a>
            <a href="/signup" style={{ fontSize: '13px', color: MUTED, textDecoration: 'none' }}>Sign up</a>
          </div>
        </div>

      </div>
    </main>
  )
}