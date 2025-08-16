import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const updatePaymentSchema = z.object({
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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from("rent_payments")
      .select("*")
      .eq("id", id)
      .single();
      
    if (error) {
      console.error("Error fetching rent payment:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Unexpected error in rent payment GET:", error);
    return NextResponse.json({ 
      error: "Internal server error occurred while fetching rent payment" 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await rateLimit(req, "api:rent:payments:put");
  if (!rl.success) return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  
  try {
    const { id } = await params;
    const json = await req.json().catch(() => ({}));
    const parsed = updatePaymentSchema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

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
    const updateBody = {
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

    console.log("Updating rent payment with data:", updateBody);

    const { data, error } = await supabase
      .from("rent_payments")
      .update(updateBody)
      .eq("id", id)
      .select("*")
      .single();
      
    if (error) {
      console.error("Database error updating rent payment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Unexpected error in rent payment PUT:", error);
    return NextResponse.json({ 
      error: "Internal server error occurred while updating rent payment" 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await rateLimit(req, "api:rent:payments:delete");
  if (!rl.success) return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase
      .from("rent_payments")
      .delete()
      .eq("id", id);
      
    if (error) {
      console.error("Database error deleting rent payment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in rent payment DELETE:", error);
    return NextResponse.json({ 
      error: "Internal server error occurred while deleting rent payment" 
    }, { status: 500 });
  }
}
