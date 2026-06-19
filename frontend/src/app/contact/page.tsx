'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Github, 
  Linkedin, 
  Globe, 
  Code2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

export default function ContactPage() {
  const contactLinks = [
    {
      name: 'Email',
      value: 'shivakrishna6032@gmail.com',
      href: 'mailto:shivakrishna6032@gmail.com',
      icon: <Mail className="w-5 h-5" />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      name: 'Mobile',
      value: '+91 8523014759',
      href: 'tel:+918523014759',
      icon: <Phone className="w-5 h-5" />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      name: 'Portfolio',
      value: 'shivakrishna.vercel.app',
      href: 'https://shivakrishna.vercel.app',
      icon: <Globe className="w-5 h-5" />,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      name: 'LinkedIn',
      value: 'linkedin.com/in/shivaaa07',
      href: 'https://www.linkedin.com/in/shivaaa07/',
      icon: <Linkedin className="w-5 h-5" />,
      color: 'text-blue-600',
      bg: 'bg-blue-600/10'
    },
    {
      name: 'GitHub',
      value: 'github.com/ShivaKrishna-07',
      href: 'https://github.com/ShivaKrishna-07',
      icon: <Github className="w-5 h-5" />,
      color: 'text-foreground',
      bg: 'bg-foreground/10'
    },
    {
      name: 'LeetCode',
      value: 'leetcode.com/u/shiva__7',
      href: 'https://leetcode.com/u/shiva__7/',
      icon: <Code2 className="w-5 h-5" />,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      
      {/* Navbar Minimal */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo size="md" className="group-hover:scale-105 transition-transform" />
            <span className="font-bold text-lg tracking-tight">Auto Mail</span>
          </Link>
          
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-24 px-6 flex flex-col items-center max-w-4xl mx-auto">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-16"
        >
          <div className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm mb-2">
            <span>Get in touch</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Contact Information
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Feel free to reach out to me through any of the platforms below. I'm always open to discussing new opportunities and ideas.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
        >
          {contactLinks.map((link, idx) => (
            <a 
              key={idx} 
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex items-center gap-4 group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${link.bg} ${link.color} group-hover:scale-110 transition-transform duration-300`}>
                {link.icon}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-foreground">
                  {link.name}
                </span>
                <span className="text-sm text-muted-foreground truncate group-hover:text-foreground transition-colors">
                  {link.value}
                </span>
              </div>
            </a>
          ))}
        </motion.div>

      </main>
    </div>
  );
}
