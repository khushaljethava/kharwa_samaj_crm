import Link from "next/link";
import { Hero } from "@/kharva/marketing/Hero";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Anchor, Users, Calendar, Heart, BookOpen, Waves } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-[80vh]">
      <Hero
        title="Shree Kharva Samaj Mandvi"
        titleGu="શ્રી ખારવા સમાજ માંડવી-કચ્છ"
        subtitle="Preserving Maritime Heritage, Fostering Community Unity"
        subtitleGu="ખારવા સમાજ માંડવી તમારે હાર્દિક સ્વાગત કરે છે."
        description="A community organization dedicated to the welfare, cultural preservation, and unity of the Kharva community in Mandvi, Kutch."
        descriptionGu="માંડવી, કચ્છમાં ખારવા સમુદાયના કલ્યાણ, સાંસ્કૃતિક સંરક્ષણ અને એકતા માટે સમર્પિત સમુદાયિક સંસ્થા."
        primaryAction={{ label: "Learn About Us", href: "/about" }}
        secondaryAction={{ label: "Contact Us", href: "/contact" }}
      />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[{
            title: "Maritime Heritage",
            titleGu: "દરિયાઈ વારસો",
            icon: Anchor,
            desc: "Preserving our rich maritime traditions and the legacy of our seafaring ancestors.",
          }, {
            title: "Community Unity",
            titleGu: "સમુદાયિક એકતા",
            icon: Users,
            desc: "Fostering strong bonds among community members through shared values and support.",
          }, {
            title: "Service & Support",
            titleGu: "સેવા અને સહાયતા",
            icon: Heart,
            desc: "Dedicated to serving our community through education and assistance.",
          }].map(({ title, titleGu, icon: Icon, desc }) => (
            <Card key={title}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardTitle className="text-base text-primary" lang="gu">{titleGu}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">{desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <article>
            <header className="flex items-center mb-6">
              <div className="p-2 bg-orange-100 rounded-lg mr-4">
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold">Religious Heritage</h3>
            </header>
            <h4 className="text-xl font-semibold text-orange-600 mb-4" lang="gu">
              ઈષ્ટ દેવ: જય શ્રી દરિયા લાલ - જય શ્રી રામેશ્વર મહાદેવ
            </h4>
            <p className="text-muted-foreground mb-6">
              Our community holds deep reverence for Shri Dariya Lal and Shri Rameshwar Mahadev.
            </p>
            <Button asChild>
              <Link href="/festivals">Learn About Our Festivals</Link>
            </Button>
          </article>

          <article>
            <header className="flex items-center mb-6">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold">Community Events</h3>
            </header>
            <h4 className="text-xl font-semibold text-blue-600 mb-4" lang="gu">
              સમાજની એકતા સમાજની તાકાત !!
            </h4>
            <p className="text-muted-foreground mb-6">
              Regular community gatherings, festivals, and cultural programs.
            </p>
            <Button variant="outline" asChild>
              <Link href="/events">View Upcoming Events</Link>
            </Button>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 bg-muted/40">
        <div className="text-center">
          <Waves className="h-14 w-14 mx-auto text-primary mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Community</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Be part of a community that values heritage, supports education, and fosters unity.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" asChild>
              <Link href="/contact">Get in Touch</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/events">Upcoming Events</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}


