import type { StoreLocation } from '@storix/shared';
import { getStoreLocations } from '@/lib/api';
import { StoresPageContent } from '@/components/admin/stores-page-content';

export default async function AdminStoresPage() {
  let stores: StoreLocation[] = [];
  try {
    stores = await getStoreLocations();
  } catch {
    stores = [];
  }

  return (
    <StoresPageContent
      stores={stores.map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
      }))}
    />
  );
}
