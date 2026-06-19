import Link from 'next/link';
import { Instagram, Mail } from 'lucide-react';

const footerLinks = {
  shop: [
    { href: '/collections/all', label: 'All products' },
    { href: '/collections/new-arrivals', label: 'New arrivals' },
    { href: '/collections/essentials', label: 'Essentials' },
  ],
  company: [
    { href: '/stores', label: 'Store locations' },
    { href: '/account', label: 'My account' },
    { href: '/admin', label: 'Merchant login' },
  ],
};

export function StorefrontFooter() {
  return (
    <footer className="border-t border-stone-800 bg-accent text-accent-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="heading-display text-2xl">Storix</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-400">
              Thoughtfully made goods for people who care about craft, quality, and quiet design.
              Curated for everyday rituals.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a
                href="mailto:hello@storix.example"
                className="flex cursor-pointer items-center gap-2 text-sm text-stone-400 transition-colors duration-200 hover:text-primary"
              >
                <Mail className="h-4 w-4" />
                hello@storix.example
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="cursor-pointer text-stone-400 transition-colors duration-200 hover:text-primary"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Shop</p>
            <ul className="mt-4 space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="cursor-pointer text-sm text-stone-400 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Company</p>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="cursor-pointer text-sm text-stone-400 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-stone-800 pt-8 sm:flex-row">
          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} Storix. All rights reserved.
          </p>
          <p className="text-xs text-stone-500">Crafted with care · Ships worldwide</p>
        </div>
      </div>
    </footer>
  );
}
