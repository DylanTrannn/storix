import Link from 'next/link';
import { Suspense } from 'react';
import { MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@storix/ui/card';
import { Button } from '@storix/ui/button';
import { getStoreLocations } from '@/lib/api';
import { TableSkeleton } from '@/components/skeletons';

async function StoresContent() {
  let stores;
  try {
    stores = await getStoreLocations();
  } catch {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Store locations are not available right now.
      </p>
    );
  }

  if (stores.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">No store locations listed yet.</p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stores.map((store) => (
        <Card key={store.id}>
          <CardHeader>
            <CardTitle className="text-xl">{store.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {store.address}
            </p>
            {store.phone && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                {store.phone}
              </p>
            )}
            {store.hours && <p>{store.hours}</p>}
            {store.mapUrl && (
              <Button variant="outline" size="sm" asChild>
                <Link href={store.mapUrl} target="_blank" rel="noopener noreferrer">
                  View on map
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function StoresPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold">
        Store locations
      </h1>
      <p className="mt-2 text-muted-foreground">
        Visit us in person to experience our products.
      </p>
      <Suspense fallback={<TableSkeleton rows={3} />}>
        <div className="mt-8">
          <StoresContent />
        </div>
      </Suspense>
    </div>
  );
}
