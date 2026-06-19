import React from 'react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-20 px-6">
      <div className="max-w-2xl w-full space-y-8 text-foreground text-center">
        <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
        <p className="text-muted-foreground text-lg">
          We'd love to hear from you. Please reach out if you have any questions, feedback, or support inquiries.
        </p>

        <div className="mt-12 bg-card border border-border p-8 rounded-2xl shadow-sm text-left space-y-6 max-w-md mx-auto">
          <div>
            <h3 className="font-semibold text-lg">Email Support</h3>
            <p className="text-sm text-muted-foreground mt-1">support@automail.example.com</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">Business Inquiries</h3>
            <p className="text-sm text-muted-foreground mt-1">partnerships@automail.example.com</p>
          </div>

          <div>
            <h3 className="font-semibold text-lg">Office</h3>
            <p className="text-sm text-muted-foreground mt-1">
              123 AI Innovation Drive<br />
              Tech City, TC 10001<br />
              United States
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
