// Looks up products in Open Food Facts, a free shared product database, by
// barcode or by name. Coverage is good for big brands and patchy for store
// brands, so callers must handle "not found" by letting the person type the name.

export type ProductInfo = {
  name: string;
  // Extra words (categories, package size) that help guess the picture and section.
  hints: string;
};

type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  quantity?: string;
  categories_tags?: string[];
};

type OffResponse = {
  status?: number;
  product?: OffProduct;
};

type OffSearchResponse = { products?: OffProduct[] };

function cleanBrand(brands: string | undefined): string {
  return (brands ?? '').split(',')[0].trim();
}

function toProductInfo(product: OffProduct): ProductInfo | null {
  const base = (product.product_name_en || product.product_name || '').trim();
  if (!base) return null;
  const brand = cleanBrand(product.brands);
  const name = brand && !base.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${base}` : base;
  const categories = (product.categories_tags ?? []).map((t) => t.replace(/^[a-z]{2}:/, '').replace(/-/g, ' '));
  return { name: name.slice(0, 100), hints: [base, ...categories].join(' ') };
}

export async function lookUpBarcode(barcode: string, signal?: AbortSignal): Promise<ProductInfo | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,product_name_en,brands,quantity,categories_tags`;
  const response = await fetch(url, { signal, headers: { 'User-Agent': 'MyKitchen/0.1 (iOS app)' } });
  if (!response.ok) return null;
  const body = (await response.json()) as OffResponse;
  const product = body.product;
  if (body.status !== 1 || !product) return null;

  return toProductInfo(product);
}

export type ProductMatch = ProductInfo & { barcode: string | null };

// Searches Open Food Facts by name, for when a scan comes up empty or someone wants a specific brand.
export async function searchProducts(query: string, signal?: AbortSignal): Promise<ProductMatch[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url =
    'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&json=1&page_size=8' +
    '&fields=code,product_name,product_name_en,brands,categories_tags' +
    `&search_terms=${encodeURIComponent(q)}`;
  const response = await fetch(url, { signal, headers: { 'User-Agent': 'MyKitchen/0.1 (iOS app)' } });
  if (!response.ok) return [];
  const body = (await response.json()) as OffSearchResponse;
  const seen = new Set<string>();
  const matches: ProductMatch[] = [];
  for (const product of body.products ?? []) {
    const info = toProductInfo(product);
    if (!info || seen.has(info.name.toLowerCase())) continue;
    seen.add(info.name.toLowerCase());
    matches.push({ ...info, barcode: product.code ?? null });
  }
  return matches;
}
