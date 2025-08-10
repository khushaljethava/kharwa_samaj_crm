import Link from "next/link";
import { notFound } from "next/navigation";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function fetchRental(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inventory_rentals")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as any;
}

export default async function RentalDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const rental = await fetchRental(id);
  if (!rental) return notFound();
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rental {rental.invoice_number || rental.id.slice(0, 8)}</h1>
        <div className="flex items-center gap-3">
          <form action={async () => {
            'use server';
            const pdfBytes = await generateInvoicePdf(rental);
            return new Response(pdfBytes, {
              headers: {
                'content-type': 'application/pdf',
                'content-disposition': `attachment; filename="rental_${rental.id.slice(0,8)}.pdf"`,
              },
            });
          }}>
            <button className="text-sm underline" formAction="#">Download Invoice PDF</button>
          </form>
          {rental.status !== 'returned' && (
            <form action={async () => {
              'use server';
              await fetch(`/api/rentals/${rental.id}`, { method: 'PATCH' });
              revalidatePath(`/inventory/rentals/${rental.id}`);
            }}>
              <button className="text-sm underline text-green-700" formAction="#">Mark Returned</button>
            </form>
          )}
          <Link href="/inventory/rentals" className="text-sm underline">Back</Link>
        </div>
      </div>
      <div className="rounded border p-4">
        <h2 className="font-semibold mb-2">Summary</h2>
        <div className="text-sm">Member: {rental.member_id}</div>
        <div className="text-sm">Total: {rental.total_amount}</div>
        <div className="text-sm">Deposit: {rental.deposit}</div>
        <div className="text-sm">Status: {rental.status}</div>
      </div>
      <div className="rounded border p-4">
        <h2 className="font-semibold mb-2">Items</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="p-2">Item</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Rate</th>
              <th className="p-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(rental.items) && rental.items.map((it: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td className="p-2">{it.item_id}</td>
                <td className="p-2">{it.quantity}</td>
                <td className="p-2">{it.unit_rate}</td>
                <td className="p-2">{(it.quantity || 0) * (it.unit_rate || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function generateInvoicePdf(rental: any) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();
  let y = height - 50;

  function text(txt: string, x: number, yy: number, size = 12) {
    page.drawText(txt, { x, y: yy, size, font, color: rgb(0, 0, 0) });
  }

  text("Rental Invoice", 50, y, 18); y -= 24;
  text(`Invoice: ${rental.invoice_number || rental.id}`, 50, y); y -= 18;
  text(`Member: ${rental.member_id}`, 50, y); y -= 18;
  text(`Date: ${new Date(rental.created_at).toLocaleString()}`, 50, y); y -= 24;

  text("Items:", 50, y); y -= 18;
  const items = Array.isArray(rental.items) ? rental.items : [];
  items.forEach((it: any, idx: number) => {
    const line = `${idx + 1}. Item: ${it.item_id}  Qty: ${it.quantity}  Rate: ${it.unit_rate}  Amount: ${(it.quantity || 0) * (it.unit_rate || 0)}`;
    text(line, 60, y);
    y -= 16;
  });
  y -= 10;
  text(`Deposit: ${rental.deposit}`, 50, y); y -= 16;
  text(`Total: ${rental.total_amount}`, 50, y); y -= 16;

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}


