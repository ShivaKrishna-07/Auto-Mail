import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-20 px-6">
      <div className="max-w-3xl w-full space-y-8 text-foreground">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last Updated: June 2026</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
            <p>Welcome to Auto Mail. We are committed to protecting your personal information and your right to privacy. This policy describes how we collect, use, and share your information when you use our application.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
            <p>When you use Auto Mail, we request access to your Gmail account via Google OAuth. The data we collect includes your email address, profile information, and the contents of your emails strictly for the purpose of organizing, summarizing, and enabling intelligent search across your inbox.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. How We Use Your Data</h2>
            <p>Your email data is processed securely to provide AI-driven features (such as summaries and smart categorization). We do not sell your data or use it for advertising purposes. AI processing is performed securely via the Google Gemini API.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Data Security</h2>
            <p>We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. Your data is encrypted at rest and in transit.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Contact Us</h2>
            <p>If you have questions or comments about this notice, you may email us at support@automail.example.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
