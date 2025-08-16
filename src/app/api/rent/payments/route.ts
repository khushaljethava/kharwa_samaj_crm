import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const paymentSchema = z.object({
  agreement_id: z.string().uuid().optional().nullable(),
  payment_month: z.string(),
  months_covered: z.number().int().min(1).max(24).default(1),
  amount_due: z.number().min(0),
  amount_paid: z.number().min(0),
  payment_date: z.string().optional(),
  payment_method: z.string().optional(),
  transaction_reference: z.string().optional(),
  source_id: z.string().uuid().optional().nullable(),
  receiver_name: z.string().optional(),
  status: z.string().optional().default("paid"),
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rent_payments")
    .select("*, source_id:metadata->>source_id")
    .order("payment_month", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, "api:rent:payments:post");
  if (!rl.success) return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = paymentSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    
    // Convert YYYY-MM format to YYYY-MM-01 for proper date insertion
    const formatPaymentMonth = (monthString: string): string => {
      // If it's already a full date, return as is
      if (/^\d{4}-\d{2}-\d{2}/.test(monthString)) {
        return monthString;
      }
      // If it's YYYY-MM format, append -01
      if (/^\d{4}-\d{2}$/.test(monthString)) {
        return `${monthString}-01`;
      }
      // Otherwise, assume it needs formatting
      return monthString;
    };

    // TEMPORARY WORKAROUND: If no agreement_id is provided, try to create or get a default one
    let agreementId = parsed.data.agreement_id;
    if (!agreementId) {
      try {
        // First, try to get an existing default agreement
        const { data: existingAgreement } = await supabase
          .from('rental_agreements')
          .select('id')
          .eq('id', '00000000-0000-0000-0000-000000000001')
          .single();
        
        if (existingAgreement) {
          agreementId = existingAgreement.id;
        } else {
          // Create default property and agreement if they don't exist
          const { data: property } = await supabase
            .from('properties')
            .insert({
              id: '00000000-0000-0000-0000-000000000001',
              property_code: 'GENERAL-RENT',
              property_details: {
                name: 'General Rent Payments',
                description: 'Default property for general rent payments not tied to specific properties'
              },
              status: 'active'
            })
            .select('id')
            .single();
          
          if (property) {
            const { data: agreement } = await supabase
              .from('rental_agreements')
              .insert({
                id: '00000000-0000-0000-0000-000000000001',
                property_id: property.id,
                agreement_details: {
                  type: 'general',
                  description: 'Default agreement for general rent payments'
                },
                start_date: '2020-01-01',
                monthly_rent: 0,
                status: 'active'
              })
              .select('id')
              .single();
            
            if (agreement) {
              agreementId = agreement.id;
            }
          }
        }
      } catch (error) {
        console.warn('Could not create default agreement, proceeding with null:', error);
      }
    }

    // Store the source_id into metadata to avoid altering existing schema
    const insertBody = {
      agreement_id: agreementId, // Use the resolved agreement ID or null
      payment_month: formatPaymentMonth(parsed.data.payment_month),
      amount_due: parsed.data.amount_due,
      amount_paid: parsed.data.amount_paid,
      payment_date: parsed.data.payment_date || null,
      payment_method: parsed.data.payment_method || null,
      transaction_reference: parsed.data.transaction_reference || null,
      receiver_name: parsed.data.receiver_name || null,
      status: parsed.data.status,
      metadata: {
        ...(parsed.data.source_id ? { source_id: parsed.data.source_id } : {}),
        months_covered: parsed.data.months_covered,
      },
    } as const;

    console.log("Inserting rent payment with data:", insertBody);

    const { data, error } = await supabase
      .from("rent_payments")
      .upsert(insertBody, { onConflict: 'agreement_id,payment_month' })
      .select("*")
      .single();
      
    if (error) {
      console.error("Database error inserting rent payment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in rent payments POST:", error);
    return NextResponse.json({ 
      error: "Internal server error occurred while processing rent payment" 
    }, { status: 500 });
  }
}


