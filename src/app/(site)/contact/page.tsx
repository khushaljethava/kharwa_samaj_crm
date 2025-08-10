import { Metadata } from "next";
import { ContactForm } from "@/kharva/marketing/ContactForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Kharva Samaj Mandvi. Contact information, location, and contact form.",
};

export default function ContactPage() {
  return (
    <main className="min-h-[80vh]">
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Contact Us</h1>
          <p className="text-blue-100" lang="gu">અમારો સંપર્ક કરો</p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Get in Touch</h3>
              <p className="text-muted-foreground">Reach out to us through any of the following methods.</p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">Our Location</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <address className="not-italic text-sm text-muted-foreground">
                    Romeshwar Road, Near Lighthouse, Mandvi-Kutch, Gujarat, India
                  </address>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle className="text-lg">Phone Number</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <a href="tel:+919104645440" className="font-medium hover:text-primary">+91 9104645440</a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Mail className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg">Email Address</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <a href="mailto:mandvikharvasamaj@gmail.com" className="font-medium hover:text-primary break-all">mandvikharvasamaj@gmail.com</a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <CardTitle className="text-lg">Office Hours</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Mon-Fri:</span> 9:00 AM - 6:00 PM</p>
                    <p><span className="font-medium">Saturday:</span> 9:00 AM - 2:00 PM</p>
                    <p><span className="font-medium">Sunday:</span> Closed</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}


