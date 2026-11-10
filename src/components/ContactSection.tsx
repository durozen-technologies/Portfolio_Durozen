'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Check, 
  ExternalLink, 
  MessageCircle, 
  Building2, 
  AlertCircle
} from 'lucide-react';

interface ContactFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  description: string;
}

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    service: 'Custom Software Development',
    budget: '₹1 - ₹3 Lakhs',
    description: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'opened_mail_client'>('idle');

  const services = [
    'Custom Software Development',
    'Web & Full-Stack Applications',
    'Mobile Application Development',
    'Cloud Infrastructure & DevOps',
    'Enterprise AI & Automation',
    'UI/UX Design Engineering',
    'Technology Consulting'
  ];

  const budgetOptions = [
    'Under ₹1 Lakh',
    '₹1 - ₹3 Lakhs',
    '₹3 - ₹10 Lakhs',
    '₹10 Lakhs+'
  ];

  const validate = () => {
    const newErrors: Partial<Record<keyof ContactFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'Please enter your name.';
    if (!formData.email.trim()) {
      newErrors.email = 'Work email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (formData.phone.replace(/\D/g, '').length < 7) {
      newErrors.phone = 'Please enter a valid phone number.';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Please describe your project requirements.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const subject = encodeURIComponent(
      `Project Inquiry: ${formData.name} ${formData.company ? `(${formData.company})` : ''} - ${formData.service}`
    );
    const body = encodeURIComponent(
      `Hello Durozen Technologies Team,\n\n` +
      `I would like to inquire about partnering on a new project.\n\n` +
      `Client Details:\n` +
      `- Name: ${formData.name}\n` +
      `- Company: ${formData.company || 'N/A'}\n` +
      `- Work Email: ${formData.email}\n` +
      `- Phone: ${formData.phone}\n` +
      `- Service Required: ${formData.service}\n` +
      `- Budget Range: ${formData.budget}\n\n` +
      `Project Description:\n` +
      `${formData.description}\n\n` +
      `Best regards,\n` +
      `${formData.name}`
    );

    const mailtoUrl = `mailto:info@durozen.in?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    setSubmissionStatus('opened_mail_client');
  };

  const googleMapsUrl = "https://www.google.com/maps?q=11.148956,78.215225";
  const mapEmbedUrl = "https://maps.google.com/maps?q=11.148956,78.215225&hl=en&z=15&output=embed";

  const whatsappMessage = encodeURIComponent(
    `Hello Durozen Technologies! I am ${formData.name || 'interested'} from ${formData.company || 'my company'} and would like to discuss a project regarding ${formData.service} (${formData.budget}).`
  );
  const whatsappUrl = `https://wa.me/918122339694?text=${whatsappMessage}`;

  return (
    <section 
      id="contact" 
      className="py-20 sm:py-28 px-6 max-w-7xl mx-auto border-t border-slate-100 relative z-10 scroll-mt-20 overflow-hidden"
    >
      {/* Background Soft Gradients */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/3 w-[650px] h-[500px] bg-gradient-to-br from-red-50/20 via-slate-50/20 to-blue-50/20 rounded-full blur-3xl opacity-60" />
      </div>

      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center mb-14 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs font-mono text-slate-700 mb-4 shadow-xs">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold text-slate-900">GET IN TOUCH</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-600">DUROZEN TECHNOLOGIES</span>
        </div>

        <h2 
          className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Let's Build Something Exceptional Together.
        </h2>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Partner with Durozen Technologies for custom software, web platforms, and mobile apps. Our engineering team is ready to assist you.
        </p>
      </div>

      {/* Main Grid: Left Form (7 cols) + Right Info & Map (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        {/* LEFT COLUMN: The Interactive Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden relative"
        >
          {/* Top Brand Red Accent Line */}
          <div className="h-1.5 w-full bg-[#E52521]" />

          <div className="p-6 sm:p-9">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Row 1: Your Name & Company Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-2">
                    YOUR NAME <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Alex Morgan"
                    className={`w-full px-4 py-3 rounded-xl bg-slate-50/70 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                      errors.name 
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200' 
                        : 'border-slate-200 focus:border-slate-800'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-2">
                    COMPANY NAME
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Acme Technologies"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50/70 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-800 transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Work Email & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-2">
                    WORK EMAIL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="alex@enterprise.com"
                    className={`w-full px-4 py-3 rounded-xl bg-slate-50/70 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                      errors.email 
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200' 
                        : 'border-slate-200 focus:border-slate-800'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-2">
                    PHONE NUMBER <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 98785 43210"
                    className={`w-full px-4 py-3 rounded-xl bg-slate-50/70 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all ${
                      errors.phone 
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200' 
                        : 'border-slate-200 focus:border-slate-800'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Service Required */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-2">
                  SERVICE REQUIRED <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.service}
                    onChange={(e) => handleInputChange('service', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50/70 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-800 transition-all cursor-pointer font-medium appearance-none"
                  >
                    {services.map((svc) => (
                      <option key={svc} value={svc}>
                        {svc}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Row 4: Project Budget Range */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                  PROJECT BUDGET RANGE
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {budgetOptions.map((b) => {
                    const isSelected = formData.budget === b;
                    return (
                      <button
                        type="button"
                        key={b}
                        onClick={() => handleInputChange('budget', b)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#E52521] text-white border-[#E52521] shadow-md shadow-red-500/20'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 5: Project Description */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-2">
                  PROJECT DESCRIPTION <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your technical objectives, existing system constraints, target timelines, and core deliverables..."
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50/70 border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all resize-y ${
                    errors.description 
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200' 
                      : 'border-slate-200 focus:border-slate-800'
                  }`}
                />
                {errors.description && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Email Opened Notification */}
              {submissionStatus === 'opened_mail_client' && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Email client opened with formatted project inquiry. Hit send to submit!</span>
                </div>
              )}

              {/* Red Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-2xl bg-[#E52521] hover:bg-[#d01f1b] text-white font-bold text-sm shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] group"
                >
                  <Send className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Send Project Inquiry</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Direct Communications + Office Location Map */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: DIRECT COMMUNICATIONS */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl bg-white border border-slate-200/90 shadow-md overflow-hidden"
          >
            {/* Top Brand Blue Accent Line */}
            <div className="h-1.5 w-full bg-[#2563EB]" />

            <div className="p-6 sm:p-7 space-y-5">
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
              DIRECT COMMUNICATIONS
            </div>

            {/* Email Direct */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase font-bold text-slate-400">
                  EMAIL DIRECT
                </div>
                <a 
                  href="mailto:info@durozen.in" 
                  className="text-sm font-bold text-slate-900 hover:text-red-600 transition-colors block"
                >
                  info@durozen.in
                </a>
                <p className="text-xs text-slate-500 mt-0.5">
                  Project scoping & general enquiries
                </p>
              </div>
            </div>

            {/* Phone / Call */}
            <div className="flex items-start gap-3.5 pt-2 border-t border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase font-bold text-slate-400">
                  PHONE / CALL
                </div>
                <a 
                  href="tel:+918122339694" 
                  className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors block"
                >
                  +91 81223 39694
                </a>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct line to technical advisory
                </p>
              </div>
            </div>

            {/* Office Location */}
            <div className="flex items-start gap-3.5 pt-2 border-t border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase font-bold text-slate-400">
                  OFFICE LOCATION
                </div>
                <div className="text-sm font-bold text-slate-900">
                  Durozen Technologies Private Limited
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Namakkal, Tamil Nadu, India
                </p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1.5"
                >
                  <span>Open on Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* WhatsApp Quick Enquiry Button */}
            <div className="pt-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <MessageCircle className="w-4 h-4 fill-white text-white" />
                <span>WhatsApp Quick Enquiry</span>
              </a>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Connect directly with our team on WhatsApp
              </p>
            </div>
            </div>
          </motion.div>

          {/* Card 2: OFFICE LOCATION · MAP */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded-3xl bg-white border border-slate-200/90 shadow-md overflow-hidden"
          >
            {/* Top Brand Green Accent Line */}
            <div className="h-1.5 w-full bg-[#22C55E]" />

            <div className="p-6 space-y-4">
            {/* Header with Coordinates */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-mono font-bold tracking-wider text-slate-700 uppercase text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#E52521] animate-pulse" />
                <span>OFFICE LOCATION · MAP</span>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">
                11.15° N, 78.22° E
              </span>
            </div>

            {/* Address Details */}
            <div>
              <div className="text-sm font-bold text-slate-900">
                Durozen Technologies Private Limited
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Namakkal, Tamil Nadu, India
              </div>
            </div>

            {/* Embedded Interactive Google Map */}
            <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
              <iframe
                title="Durozen Technologies Namakkal Location"
                src={mapEmbedUrl}
                className="w-full h-full border-0 filter contrast-[1.02] saturate-[1.05]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />

              {/* View Full Map Floating Button */}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-[11px] font-bold shadow-md border border-slate-200 transition-all hover:scale-105"
              >
                <span>View Full Map</span>
                <ExternalLink className="w-3 h-3 text-blue-600" />
              </a>
            </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
