import React from 'react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-20 px-6">
      <div className="max-w-3xl w-full space-y-8 text-foreground">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last Updated: June 2026</p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>By accessing and using Auto Mail, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Description of Service</h2>
            <p>Auto Mail provides users with access to a suite of AI-powered email management tools, including summarization, categorization, and semantic search (the "Service").</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. User Conduct</h2>
            <p>You agree to use the Service only for lawful purposes. You agree not to take any action that might compromise the security of the site, render the site inaccessible to others, or otherwise cause damage to the site or the Content.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Third-Party Services</h2>
            <p>Our Service integrates with Google Gmail via OAuth. Your use of this third-party integration is governed by Google's Terms of Service and Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Termination</h2>
            <p>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including, without limitation, if you breach the Terms.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
