import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(1000),
  honeypot: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);
  if (!userLimit) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }
  if (now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later.", code: "RATE_LIMIT_EXCEEDED" }, { status: 429 });
    }

    const body = (await request.json()) as ContactFormData;
    const validation = contactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Invalid form data", details: validation.error.issues, code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const { name, email, phone, subject, message, honeypot } = validation.data;

    if (honeypot && honeypot.trim() !== "") {
      return NextResponse.json({ success: true, message: "Thank you for your message. We will get back to you soon." });
    }

    const spamKeywords = ["viagra", "casino", "lottery", "winner", "congratulations", "click here"];
    const text = `${subject} ${message}`.toLowerCase();
    const hasSpam = spamKeywords.some((k) => text.includes(k));
    if (hasSpam) {
      return NextResponse.json({ success: true, message: "Thank you for your message. We will get back to you soon." });
    }

    console.log("Contact form submission:", {
      timestamp: new Date().toISOString(),
      ip,
      name,
      email,
      phone,
      subject,
      messageLength: message.length,
    });

    await new Promise((r) => setTimeout(r, 500));

    return NextResponse.json({ success: true, message: "Thank you for your message. We will get back to you soon.", timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ success: false, error: "Internal server error. Please try again later.", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}


