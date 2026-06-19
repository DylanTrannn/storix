import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { ArrowRight, Shield, Sparkles, Truck } from 'lucide-react';
import { Button } from '@storix/ui/button';
import { getFeaturedCollections, getFeaturedProducts } from '@/lib/api';
import { CollectionGrid, ProductGrid, SectionHeader } from '@/components/storefront/product-card';
import { CollectionGridSkeleton, ProductGridSkeleton } from '@/components/skeletons';

const trustBadges = [
  { icon: Truck, label: 'Free shipping over $75' },
  { icon: Shield, label: 'Quality guaranteed' },
  { icon: Sparkles, label: 'Curated by experts' },
];

export default async function HomePage() {
  const [collections, products] = await Promise.all([
    getFeaturedCollections(3),
    getFeaturedProducts(8),
  ]);

  const heroImageUrl =
    collections.find((c) => c.imageUrl)?.imageUrl ??
    'https://images.unsplash.com/photo-1441984904996-e0b6bd687551?w=1200&q=80&auto=format&fit=crop';

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-stone-100 via-background to-stone-50">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-stone-300/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
          <div>
            <p className="section-label">Small-batch essentials</p>
            <h1 className="heading-display mt-4 text-balance text-5xl leading-[1.1] sm:text-6xl lg:text-7xl">
              Goods made to last, designed to feel at home
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Storix brings together independent makers and thoughtful design. Discover pieces
              chosen for everyday rituals.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="cursor-pointer rounded-full px-8 shadow-md">
                <Link href="/collections/all" className="inline-flex items-center gap-2">
                  Shop the collection
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="cursor-pointer rounded-full border-stone-300 px-8"
              >
                <Link href="/stores" className="inline-flex items-center">
                  Visit a store
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border shadow-2xl">
              <Image
                src={heroImageUrl}
                alt="Curated goods display"
                fill
                priority
                className="object-cover"
                sizes="50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent" />
            </div>
            <div className="glass-panel absolute -bottom-6 -left-6 max-w-xs rounded-xl p-6">
              <p className="heading-display text-xl">Crafted with care</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Every product is selected for quality materials and honest design.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 bg-background/80">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 py-6 sm:px-6 lg:px-8">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          label="Curated"
          title="Featured collections"
          href="/collections/all"
        />
        <Suspense fallback={<CollectionGridSkeleton />}>
          <CollectionGrid collections={collections} />
        </Suspense>
      </section>

      <section className="border-y border-border bg-stone-100/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeader label="New arrivals" title="Featured products" />
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid products={products} />
          </Suspense>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="section-label">Our story</p>
            <h2 className="heading-display mt-3 text-4xl">Built for brands that care</h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              Storix started with a simple idea: small brands deserve a beautiful place to sell
              online. We build tools that let makers focus on their craft while giving customers
              a calm, considered shopping experience.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              From studio ceramics to handwoven textiles, every item reflects a commitment to
              quality over quantity.
            </p>
            <Button asChild variant="outline" className="mt-8 cursor-pointer rounded-full">
              <Link href="/collections/all">Explore the shop</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="heading-display text-4xl text-primary">50+</p>
              <p className="mt-2 text-sm text-muted-foreground">Independent makers</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="heading-display text-4xl text-primary">12</p>
              <p className="mt-2 text-sm text-muted-foreground">Store locations</p>
            </div>
            <div className="col-span-2 rounded-xl bg-accent p-8 text-accent-foreground shadow-lg">
              <p className="heading-display text-2xl">Premium, without pretense</p>
              <p className="mt-3 text-sm leading-relaxed text-stone-400">
                Fast checkout, clear product pages, and room to tell your story.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
