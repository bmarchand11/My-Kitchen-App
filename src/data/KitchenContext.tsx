import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { sampleItems, sectionById, type Item, type LocationId } from './kitchen';

type KitchenContextValue = {
  items: Item[];
  itemsInSection: (sectionId: string) => Item[];
  itemsInLocation: (locationId: LocationId) => Item[];
  getItem: (id: string) => Item | undefined;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
};

const KitchenContext = createContext<KitchenContextValue | null>(null);

// Holds the household's food in memory for now; saving to an account comes later.
export function KitchenProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(() => sampleItems());

  const value = useMemo<KitchenContextValue>(
    () => ({
      items,
      itemsInSection: (sectionId) => items.filter((i) => i.sectionId === sectionId),
      itemsInLocation: (locationId) =>
        items.filter((i) => sectionById(i.sectionId)?.locationId === locationId),
      getItem: (id) => items.find((i) => i.id === id),
      setQuantity: (id, quantity) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i))),
      removeItem: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
    }),
    [items],
  );

  return <KitchenContext.Provider value={value}>{children}</KitchenContext.Provider>;
}

export function useKitchen(): KitchenContextValue {
  const value = useContext(KitchenContext);
  if (!value) throw new Error('useKitchen must be used inside KitchenProvider');
  return value;
}
