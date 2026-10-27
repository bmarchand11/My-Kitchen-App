// Looks up a barcode in Open Food Facts, a free shared product database.
// Coverage is good for big brands and patchy for store brands, so callers
// must handle "not found" by letting the person type the name.

export type ProductInfo = {
  name: string;
  // Extra words (categories, package size) that help guess the picture and section.
  hints: string;
};

type OffResponse = {
  status?: number;
  product?: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    quantity?: string;
    categories_tags?: string[];
  };
};

function cleanBrand(brands: string | undefined): string {
  return (brands ?? '').split(',')[0].trim();
}

export async function lookUpBarcode(barcode: string, signal?: AbortSignal): Promise<ProductInfo | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,product_name_en,brands,quantity,categories_tags`;
  const response = await fetch(url, { signal, headers: { 'User-Agent': 'MyKitchen/0.1 (iOS app)' } });
  if (!response.ok) return null;
  const body = (await response.json()) as OffResponse;
  const product = body.product;
  if (body.status !== 1 || !product) return null;

  const base = (product.product_name_en || product.product_name || '').trim();
  if (!base) return null;
  const brand = cleanBrand(product.brands);
  const name = brand && !base.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${base}` : base;

  const categories = (product.categories_tags ?? []).map((t) => t.replace(/^[a-z]{2}:/, '').replace(/-/g, ' '));
  return { name: name.slice(0, 100), hints: [base, ...categories].join(' ') };
}
