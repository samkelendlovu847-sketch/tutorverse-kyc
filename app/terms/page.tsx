import React from 'react'

const DARK = '#000000'
const BORDER = '#E5E5E5'
const CARD = '#F8F9FA'
const MUTED = '#888888'

export default function TermsOfUse() {
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

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 100 }}>
        <a href="/" style={{ fontWeight: 700, fontSize: '18px', color: DARK, textDecoration: 'none' }}>✕ Tutorverse</a>
        <span style={{ fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Terms of Use</span>
      </nav>

      {/* Hero */}
      <div style={{ backgroundColor: DARK, padding: '64px 32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#fff', marginBottom: '12px', letterSpacing: '-0.5px' }}>Terms of Use</h1>
        <p style={{ fontSize: '15px', color: '#999', marginBottom: '8px' }}>Last updated: {lastUpdated}</p>
        <p style={{ fontSize: '15px', color: '#999' }}>Tutorverse (Pty) Ltd — KYC Verification Service</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 24px' }}>

        {/* Intro */}
        <div style={{ backgroundColor: CARD, borderRadius: '12px', padding: '24px 28px', marginBottom: '48px' }}>
          <P>
            Please read these Terms of Use carefully before using the Tutorverse KYC Verification Service. By creating an account or submitting your documents for verification, you agree to be bound by these terms. If you do not agree, please do not use this service.
          </P>
          <P style={{ margin: 0 }}>
            These terms apply to all tutors who register on the Tutorverse platform and submit their identity and qualification documents for verification.
          </P>
        </div>

        <Section title="1. About this service">
          <P>
            The Tutorverse KYC Verification Service (&quot;the Service&quot;) is operated by Tutorverse (Pty) Ltd (&quot;Tutorverse&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), a company registered in South Africa.
          </P>
          <P>
            The Service allows tutors to submit their South African identity documents and qualification certificates for automated verification. Upon successful verification, tutors receive a &quot;Verified Tutor&quot; badge on the Tutorverse marketplace platform, which increases trust with parents and students.
          </P>
          <P>
            The Service is a component of the broader Tutorverse marketplace platform and is governed by these Terms of Use in addition to the main Tutorverse platform terms.
          </P>
        </Section>

        <Section title="2. Eligibility">
          <P>To use this Service, you must:</P>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <Li>Be 18 years of age or older</Li>
            <Li>Be a South African citizen or permanent resident holding a valid South African ID document</Li>
            <Li>Be registering as a tutor on the Tutorverse platform</Li>
            <Li>Have genuine qualifications that you wish to verify</Li>
            <Li>Provide accurate and truthful information throughout the verification process</Li>
          </ul>
          <P>
            By using this Service, you confirm that you meet all of the above eligibility requirements.
          </P>
        </Section>

        <Section title="3. Your obligations">
          <P>When using this Service, you agree to:</P>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <Li><strong>Provide accurate information</strong> — all information you submit, including your name, ID number, and qualification documents, must be genuine, accurate, and your own</Li>
            <Li><strong>Submit original documents</strong> — you must submit photographs of your original identity document and genuine qualification certificates. Copies, screenshots, or altered documents are not accepted</Li>
            <Li><strong>Not impersonate others</strong> — you must not submit someone else&apos;s identity documents or attempt to verify under a false identity</Li>
            <Li><strong>Not tamper with documents</strong> — you must not submit altered, forged, or otherwise fraudulent documents</Li>
            <Li><strong>Keep your account secure</strong> — you are responsible for maintaining the security of your account credentials and must notify us immediately if you suspect unauthorised access</Li>
            <Li><strong>Comply with applicable laws</strong> — you must comply with all applicable South African laws and regulations when using this Service</Li>
          </ul>
        </Section>

        <Section title="4. Prohibited activities">
          <P>You must not use this Service to:</P>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <Li>Submit fraudulent, forged, altered, or stolen identity documents</Li>
            <Li>Impersonate another person or submit documents belonging to someone else</Li>
            <Li>Attempt to circumvent or bypass the verification checks</Li>
            <Li>Use automated tools, bots, or scripts to interact with the Service</Li>
            <Li>Attempt to reverse engineer, hack, or otherwise interfere with the Service</Li>
            <Li>Submit multiple accounts for the same person</Li>
            <Li>Use the Service for any unlawful purpose</Li>
          </ul>
          <P>
            Violation of any of the above may result in immediate termination of your account, reporting to relevant authorities, and legal action where appropriate.
          </P>
        </Section>

        <Section title="5. Verification process">
          <P>
            The verification process involves the following automated and manual checks:
          </P>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <Li>Automated reading and extraction of text from your identity document using OCR technology</Li>
            <Li>Validation of your SA ID number format, Luhn check digit, date of birth, gender, and citizenship</Li>
            <Li>Comparison of the name you provide against the text extracted from your document</Li>
            <Li>Document authenticity checks including file size, type, and content analysis</Li>
            <Li>Face matching between your selfie and your identity document photo</Li>
            <Li>Verification of your qualification certificate against a list of DHET-accredited institutions</Li>
            <Li>Identity verification against authoritative sources via our KYC provider (Smile Identity)</Li>
            <Li>Manual review by a Tutorverse administrator</Li>
          </ul>
          <P>
            We reserve the right to request additional documentation or information if we are unable to verify your identity through the automated process.
          </P>
          <P>
            Verification is not guaranteed. We reserve the right to decline verification at our sole discretion, including where we have reasonable grounds to suspect fraud or misrepresentation.
          </P>
        </Section>

        <Section title="6. Verified tutor badge">
          <P>
            Upon successful completion of the verification process and approval by a Tutorverse administrator, you will be awarded a &quot;Verified Tutor&quot; badge on your Tutorverse profile.
          </P>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <Li>The badge indicates that your identity and qualifications have been verified at the time of submission</Li>
            <Li>The badge does not guarantee the quality of your tutoring services</Li>
            <Li>We reserve the right to revoke the badge at any time if we discover that your verification was based on fraudulent or inaccurate information</Li>
            <Li>You must notify us immediately if any of your verified information changes, such as a change of name</Li>
          </ul>
        </Section>

        <Section title="7. Intellectual property">
          <P>
            All content, design, software, and technology comprising this Service is owned by Tutorverse (Pty) Ltd and is protected by South African and international intellectual property laws.
          </P>
          <P>
            You may not copy, reproduce, distribute, modify, or create derivative works of any part of this Service without our prior written consent.
          </P>
        </Section>

        <Section title="8. Privacy and data protection">
          <P>
            Your use of this Service is also governed by our <a href="/privacy" style={{ color: DARK, fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>, which is incorporated into these Terms of Use by reference.
          </P>
          <P>
            By using this Service, you consent to the collection, processing, and use of your personal information as described in our Privacy Policy, in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA) and, where applicable, the General Data Protection Regulation (GDPR).
          </P>
        </Section>

        <Section title="9. Disclaimers">
          <P>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. To the fullest extent permitted by law, Tutorverse disclaims all warranties, including but not limited to:
          </P>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <Li>Warranties of merchantability or fitness for a particular purpose</Li>
            <Li>Warranties that the Service will be uninterrupted, error-free, or secure</Li>
            <Li>Warranties regarding the accuracy or completeness of any information provided through the Service</Li>
          </ul>
          <P>
            The automated verification checks are designed to detect obvious fraud and errors but are not infallible. Final verification decisions are made by a human administrator.
          </P>
        </Section>

        <Section title="10. Limitation of liability">
          <P>
            To the fullest extent permitted by South African law, Tutorverse shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of this Service, including but not limited to:
          </P>
          <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
            <Li>Loss of income or revenue</Li>
            <Li>Loss of business or contracts</Li>
            <Li>Loss of data</Li>
            <Li>Any unauthorised access to your personal information despite our security measures</Li>
          </ul>
          <P>
            Our total liability to you for any claim arising out of or in connection with this Service shall not exceed the amount you have paid to us in the 12 months preceding the claim, or R500, whichever is greater.
          </P>
        </Section>

        <Section title="11. Termination">
          <P>
            We reserve the right to suspend or terminate your account and access to this Service at any time, with or without notice, if we reasonably believe that you have violated these Terms of Use or if we are required to do so by law.
          </P>
          <P>
            You may close your account at any time by using the &quot;Delete my account&quot; feature on your dashboard, or by contacting us at <strong>support@tutorverse.co.za</strong>.
          </P>
          <P>
            Upon termination, your right to use the Service ceases immediately and your Verified Tutor badge will be removed from your profile.
          </P>
        </Section>

        <Section title="12. Changes to these terms">
          <P>
            We may update these Terms of Use from time to time. When we make material changes, we will notify you by email and update the &quot;Last updated&quot; date at the top of this page. Your continued use of the Service after the effective date of the updated terms constitutes your acceptance of the changes.
          </P>
          <P>
            If you do not agree to the updated terms, you must stop using the Service and close your account.
          </P>
        </Section>

        <Section title="13. Governing law">
          <P>
            These Terms of Use are governed by and construed in accordance with the laws of the Republic of South Africa. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the South African courts.
          </P>
        </Section>

        <Section title="14. Contact us">
          <P>If you have any questions about these Terms of Use, please contact us:</P>
          <div style={{ backgroundColor: CARD, borderRadius: '12px', padding: '24px 28px', marginTop: '16px' }}>
            <p style={{ fontSize: '15px', color: DARK, fontWeight: 600, marginBottom: '8px' }}>Tutorverse (Pty) Ltd</p>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '4px' }}>Email: legal@tutorverse.co.za</p>
            <p style={{ fontSize: '14px', color: MUTED, marginBottom: '4px' }}>Support: support@tutorverse.co.za</p>
            <p style={{ fontSize: '14px', color: MUTED }}>South Africa</p>
          </div>
        </Section>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '32px', marginTop: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: MUTED, marginBottom: '8px' }}>
            These Terms of Use are governed by the laws of the Republic of South Africa.
          </p>
          <p style={{ fontSize: '12px', color: '#ccc' }}>
            © 2026 Tutorverse (Pty) Ltd · All rights reserved
          </p>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
            <a href="/" style={{ fontSize: '13px', color: MUTED, textDecoration: 'none' }}>Home</a>
            <a href="/privacy" style={{ fontSize: '13px', color: MUTED, textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/signin" style={{ fontSize: '13px', color: MUTED, textDecoration: 'none' }}>Sign in</a>
          </div>
        </div>

      </div>
    </main>
  )
}