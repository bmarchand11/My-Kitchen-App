import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isStickerName } from '../components/Sticker';
import type { Database } from '../lib/database.types';
import { supabase } from '../lib/supabase';
import { sampleItems, sectionById, type Item, type LocationId } from './kitchen';
import { useSession } from './SessionContext';

type ItemRow = Database['public']['Tables']['items']['Row'];

export type NewItem = {
  name: string;
  sticker: string;
  sectionId: string;
  quantity: number;
  unit: string;
  expiresOn: string | null;
  barcode?: string | null;
};

export type RememberedProduct = { name: string; sticker: string; sectionId: string; unit: string };

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
  addItem: (item: NewItem) => Promise<void>;
  // What this household saved last time it scanned the barcode, if anything.
  rememberedProduct: (barcode: string) => Promise<RememberedProduct | null>;
  // Products this household has added by barcode before, matched by name.
  searchRememberedProducts: (query: string) => Promise<(RememberedProduct & { barcode: string })[]>;
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
      addItem: async (item) => {
        if (!householdId) return;
        const { error: insertError } = await supabase.from('items').insert({
          household_id: householdId,
          name: item.name.trim(),
          sticker: item.sticker,
          section_id: item.sectionId,
          quantity: item.quantity,
          unit: item.unit,
          expires_on: item.expiresOn,
          barcode: item.barcode ?? null,
          added_by_name: myName,
        });
        if (insertError) throw insertError;
        if (item.barcode) {
          // Best effort: a failure here only means the next scan won't fill itself in.
          await supabase.from('household_products').upsert({
            household_id: householdId,
            barcode: item.barcode,
            name: item.name.trim(),
            sticker: item.sticker,
            section_id: item.sectionId,
            unit: item.unit,
          });
        }
        await load();
      },
      rememberedProduct: async (barcode) => {
        if (!householdId) return null;
        const { data } = await supabase
          .from('household_products')
          .select('name, sticker, section_id, unit')
          .eq('household_id', householdId)
          .eq('barcode', barcode)
          .maybeSingle();
        return data ? { name: data.name, sticker: data.sticker, sectionId: data.section_id, unit: data.unit } : null;
      },
      searchRememberedProducts: async (query) => {
        const q = query.trim().replace(/[%_\\,()]/g, ' ');
        if (!householdId || q.length < 2) return [];
        const { data } = await supabase
          .from('household_products')
          .select('barcode, name, sticker, section_id, unit')
          .eq('household_id', householdId)
          .ilike('name', `%${q}%`)
          .order('updated_at', { ascending: false })
          .limit(4);
        return (data ?? []).map((p) => ({
          barcode: p.barcode,
          name: p.name,
          sticker: p.sticker,
          sectionId: p.section_id,
          unit: p.unit,
        }));
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
