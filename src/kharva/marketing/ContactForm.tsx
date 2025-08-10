"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { Loader2, CheckCircle, AlertCircle, Send } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200, "Subject must be less than 200 characters"),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message must be less than 1000 characters"),
  honeypot: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps { className?: string }

export function ContactForm({ className }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<{ type: 'success' | 'error' | null; message: string; }>({ type: null, message: '' });

  const { register, handleSubmit, formState: { errors, isValid }, reset, watch } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: "onChange",
  });

  const watchedFields = watch();

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        setSubmitStatus({ type: 'success', message: result.message || 'Thank you for your message. We will get back to you soon.' });
        reset();
      } else {
        setSubmitStatus({ type: 'error', message: result.error || 'Something went wrong. Please try again.' });
      }
    } catch {
      setSubmitStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Contact Us</CardTitle>
        <CardTitle className="text-xl text-primary text-center" lang="gu">અમારો સંપર્ક કરો</CardTitle>
        <CardDescription className="text-center">Send us a message and we will get back to you as soon as possible.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <input {...register("honeypot")}
            type="text" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
            tabIndex={-1} autoComplete="off" aria-hidden="true" />

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none">Full Name <span className="text-red-500">*</span></label>
            <Input id="name" type="text" placeholder="Enter your full name" {...register("name")} className={cn(errors.name && "border-red-500 focus:border-red-500")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
            {errors.name && (<p id="name-error" className="text-sm text-red-500 flex items-center gap-1" role="alert"><AlertCircle className="h-4 w-4" />{errors.name.message}</p>)}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none">Email Address <span className="text-red-500">*</span></label>
            <Input id="email" type="email" placeholder="Enter your email address" {...register("email")} className={cn(errors.email && "border-red-500 focus:border-red-500")} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
            {errors.email && (<p id="email-error" className="text-sm text-red-500 flex items-center gap-1" role="alert"><AlertCircle className="h-4 w-4" />{errors.email.message}</p>)}
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium leading-none">Phone Number <span className="text-gray-500">(Optional)</span></label>
            <Input id="phone" type="tel" placeholder="Enter your phone number" {...register("phone")} className={cn(errors.phone && "border-red-500 focus:border-red-500")} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} />
            {errors.phone && (<p id="phone-error" className="text-sm text-red-500 flex items-center gap-1" role="alert"><AlertCircle className="h-4 w-4" />{errors.phone.message}</p>)}
          </div>

          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium leading-none">Subject <span className="text-red-500">*</span></label>
            <Input id="subject" type="text" placeholder="What is this message about?" {...register("subject")} className={cn(errors.subject && "border-red-500 focus:border-red-500")} aria-invalid={!!errors.subject} aria-describedby={errors.subject ? "subject-error" : undefined} />
            {errors.subject && (<p id="subject-error" className="text-sm text-red-500 flex items-center gap-1" role="alert"><AlertCircle className="h-4 w-4" />{errors.subject.message}</p>)}
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium leading-none">Message <span className="text-red-500">*</span></label>
            <Textarea id="message" placeholder="Please enter your message here..." rows={5} {...register("message")} className={cn(errors.message && "border-red-500 focus:border-red-500")} aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : "message-help"} />
            {errors.message ? (
              <p id="message-error" className="text-sm text-red-500 flex items-center gap-1" role="alert"><AlertCircle className="h-4 w-4" />{errors.message.message}</p>
            ) : (
              <p id="message-help" className="text-sm text-gray-500">{watchedFields.message?.length || 0}/1000 characters</p>
            )}
          </div>

          {submitStatus.type && (
            <div className={cn("p-4 rounded-lg flex items-center gap-2", submitStatus.type === 'success' ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200")} role="alert" aria-live="polite">
              {submitStatus.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
              <span>{submitStatus.message}</span>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !isValid} aria-describedby="submit-help">
            {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending Message...</>) : (<><Send className="mr-2 h-4 w-4" />Send Message</>)}
          </Button>
          <p id="submit-help" className="text-sm text-gray-500 text-center">We typically respond within 24 hours during business days.</p>
        </form>
      </CardContent>
    </Card>
  );
}


