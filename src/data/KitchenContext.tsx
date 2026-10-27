import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isStickerName } from '../components/Sticker';
import type { Database } from '../lib/database.types';
import { supabase } from '../lib/supabase';
import { sampleItems, sectionById, type Item, type LocationId } from './kitchen';
import { useSession } from './SessionContext';

type ItemRow = Database['public']['Tables']['items']['Row'];

type KitchenContextValue = {
  loading: boolean;
  error: string | null;
  items: Item[];
  itemsInSection: (sectionId: string) => Item[];
  itemsInLocation: (locationId: LocationId) => Item[];
  getItem: (id: string) => Item | undefined;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  addSampleFood: () => Promise<void>;
};

const KitchenContext = createContext<KitchenContextValue | null>(null);

function fromRow(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    sticker: isStickerName(row.sticker) ? row.sticker : 'can',
    sectionId: row.section_id,
    quantity: Number(row.quantity),
    unit: row.unit,
    expiresOn: row.expires_on,
    addedOn: row.added_on,
    addedBy: row.added_by_name,
  };
}

// The household's food, loaded from Supabase and kept live as other members make changes.
export function KitchenProvider({ children }: { children: ReactNode }) {
  const { household, myName } = useSession();
  const householdId = household?.id ?? null;
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!householdId) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data, error: loadError } = await supabase
      .from('items')
      .select('*')
      .eq('household_id', householdId)
      .order('name');
    if (loadError) {
      setError(loadError.message);
    } else {
      setItems((data ?? []).map(fromRow));
      setError(null);
    }
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    setLoading(true);
    load();
    if (!householdId) return;
    const channel = supabase
      .channel(`items-${householdId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `household_id=eq.${householdId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, load]);

  const value = useMemo<KitchenContextValue>(
    () => ({
      loading,
      error,
      items,
      itemsInSection: (sectionId) => items.filter((i) => i.sectionId === sectionId),
      itemsInLocation: (locationId) =>
        items.filter((i) => sectionById(i.sectionId)?.locationId === locationId),
      getItem: (id) => items.find((i) => i.id === id),
      setQuantity: (id, quantity) => {
        const next = Math.max(0, quantity);
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: next } : i)));
        supabase
          .from('items')
          .update({ quantity: next })
          .eq('id', id)
          .then(({ error: saveError }) => {
            if (saveError) {
              setError(saveError.message);
              load();
            }
          });
      },
      removeItem: (id) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
        supabase
          .from('items')
          .delete()
          .eq('id', id)
          .then(({ error: saveError }) => {
            if (saveError) {
              setError(saveError.message);
              load();
            }
          });
      },
      addSampleFood: async () => {
        if (!householdId) return;
        const rows = sampleItems().map((i) => ({
          household_id: householdId,
          name: i.name,
          sticker: i.sticker,
          section_id: i.sectionId,
          quantity: i.quantity,
          unit: i.unit,
          expires_on: i.expiresOn,
          added_by_name: myName,
        }));
        const { error: insertError } = await supabase.from('items').insert(rows);
        if (insertError) throw insertError;
        await load();
      },
    }),
    [loading, error, items, householdId, myName, load],
  );

  return <KitchenContext.Provider value={value}>{children}</KitchenContext.Provider>;
}

export function useKitchen(): KitchenContextValue {
  const value = useContext(KitchenContext);
  if (!value) throw new Error('useKitchen must be used inside KitchenProvider');
  return value;
}
