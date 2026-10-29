const INGREDIENT_PRICES: Record<string, { price: number; unit: string }> = {
  ail: { price: 12, unit: 'kg' },
  aneth: { price: 20, unit: 'kg' },
  aubergine: { price: 2.5, unit: 'kg' },
  avocado: { price: 2, unit: 'piece' },
  'bechamel': { price: 1.5, unit: 'l' },
  beurre: { price: 8, unit: 'kg' },
  'boeuf': { price: 25, unit: 'kg' },
  'boeuf hache': { price: 15, unit: 'kg' },
  bouillon: { price: 1.5, unit: 'l' },
  brocoli: { price: 3.5, unit: 'kg' },
  cacahuetes: { price: 6, unit: 'kg' },
  carottes: { price: 1.6, unit: 'kg' },
  champignons: { price: 6, unit: 'kg' },
  chapelure: { price: 3, unit: 'kg' },
  'chou rouge': { price: 2, unit: 'kg' },
  citron: { price: 2.5, unit: 'kg' },
  concombre: { price: 1.8, unit: 'kg' },
  'confit de canard': { price: 25, unit: 'kg' },
  courgette: { price: 2.5, unit: 'kg' },
  creme: { price: 4.5, unit: 'l' },
  crevettes: { price: 18, unit: 'kg' },
  cumin: { price: 30, unit: 'kg' },
  curry: { price: 25, unit: 'kg' },
  edamame: { price: 5, unit: 'kg' },
  'epices chili': { price: 30, unit: 'kg' },
  'epices fajitas': { price: 28, unit: 'kg' },
  'epices ras-el-hanout': { price: 30, unit: 'kg' },
  'escalope de veau': { price: 22, unit: 'kg' },
  farine: { price: 1.2, unit: 'kg' },
  feta: { price: 9, unit: 'kg' },
  'filet de poisson': { price: 16, unit: 'kg' },
  fromage: { price: 12, unit: 'kg' },
  gnocchi: { price: 3, unit: 'kg' },
  'haricots blancs': { price: 3, unit: 'kg' },
  'haricots rouges': { price: 2.5, unit: 'kg' },
  herbes: { price: 25, unit: 'kg' },
  'herbes de provence': { price: 30, unit: 'kg' },
  houmous: { price: 6, unit: 'kg' },
  jambon: { price: 12, unit: 'kg' },
  lait: { price: 1.1, unit: 'l' },
  'lait de coco': { price: 4, unit: 'l' },
  lardons: { price: 11, unit: 'kg' },
  lentilles: { price: 3, unit: 'kg' },
  'lentilles corail': { price: 3.5, unit: 'kg' },
  mais: { price: 2.5, unit: 'kg' },
  moules: { price: 7, unit: 'kg' },
  mozzarella: { price: 8, unit: 'kg' },
  navets: { price: 1.8, unit: 'kg' },
  nouilles: { price: 3.5, unit: 'kg' },
  'nouilles de riz': { price: 4, unit: 'kg' },
  oeufs: { price: 3.5, unit: 'kg' },
  oignon: { price: 1.5, unit: 'kg' },
  'oignon rouge': { price: 2, unit: 'kg' },
  oignons: { price: 1.5, unit: 'kg' },
  olives: { price: 6, unit: 'kg' },
  pain: { price: 4, unit: 'kg' },
  'pain a burger': { price: 6, unit: 'kg' },
  'pain de mie': { price: 5, unit: 'kg' },
  parmesan: { price: 20, unit: 'kg' },
  'pate a pizza': { price: 3, unit: 'kg' },
  'pate brisee': { price: 4, unit: 'kg' },
  pates: { price: 2, unit: 'kg' },
  'pates a lasagne': { price: 3.5, unit: 'kg' },
  persil: { price: 15, unit: 'kg' },
  pesto: { price: 15, unit: 'kg' },
  'petits pois': { price: 4, unit: 'kg' },
  'pois chiches': { price: 3, unit: 'kg' },
  poivron: { price: 3, unit: 'kg' },
  'pommes de terre': { price: 1.5, unit: 'kg' },
  poulet: { price: 8, unit: 'kg' },
  pruneaux: { price: 8, unit: 'kg' },
  quinoa: { price: 6, unit: 'kg' },
  reblochon: { price: 18, unit: 'kg' },
  riz: { price: 2.5, unit: 'kg' },
  'riz arborio': { price: 6, unit: 'kg' },
  'riz complet': { price: 3.5, unit: 'kg' },
  'roti de porc': { price: 12, unit: 'kg' },
  salade: { price: 4, unit: 'kg' },
  'salade romaine': { price: 5, unit: 'kg' },
  'sauce cesar': { price: 8, unit: 'l' },
  'sauce soja': { price: 6, unit: 'l' },
  'saucisse de toulouse': { price: 12, unit: 'kg' },
  sauge: { price: 40, unit: 'kg' },
  saumon: { price: 25, unit: 'kg' },
  semoule: { price: 2, unit: 'kg' },
  sole: { price: 30, unit: 'kg' },
  tagliatelles: { price: 3, unit: 'kg' },
  thon: { price: 10, unit: 'kg' },
  thym: { price: 35, unit: 'kg' },
  tomates: { price: 3, unit: 'kg' },
  'tomates cerises': { price: 7, unit: 'kg' },
  'tomates concassees': { price: 2, unit: 'kg' },
  tortillas: { price: 5, unit: 'kg' },
  veau: { price: 20, unit: 'kg' },
  'vin blanc': { price: 4, unit: 'l' },
  'vin rouge': { price: 6, unit: 'l' },
}

const DEFAULT_PRICE: { price: number; unit: string } = { price: 4, unit: 'kg' }

const UNIT_TO_QUANTITY: Record<string, number> = {
  g: 0.001,
  kg: 1,
  ml: 0.001,
  cl: 0.01,
  l: 1,
  piece: 1,
}

const DEFAULT_USAGE_QUANTITY: Record<string, number> = {
  ail: 0.01,
  aneth: 0.005,
  cumin: 0.005,
  curry: 0.005,
  herbes: 0.005,
  'herbes de provence': 0.005,
  persil: 0.01,
  sauge: 0.003,
  thym: 0.003,
  oignon: 0.15,
  'oignon rouge': 0.15,
  oignons: 0.15,
  poivron: 0.2,
  aubergine: 0.3,
  courgette: 0.3,
  concombre: 0.4,
  avocat: 0.2,
  citron: 0.1,
  carottes: 0.15,
  'chou rouge': 0.3,
  brocoli: 0.3,
}

export function normalizePriceKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function estimateIngredientPriceEur(
  name: string,
  quantity: number | null,
  unit: string | null,
): number {
  const key = normalizePriceKey(name)
  const entry = INGREDIENT_PRICES[key] ?? DEFAULT_PRICE
  if (quantity === null || unit === null) {
    const usage = DEFAULT_USAGE_QUANTITY[key]
    if (usage !== undefined) {
      const inEntryUnit = usage / (UNIT_TO_QUANTITY[entry.unit] ?? 1)
      return round2(entry.price * inEntryUnit)
    }
    if (quantity !== null) {
      return round2(entry.price * quantity * 0.15)
    }
    return round2(entry.price * 0.1)
  }
  const inEntryUnit =
    (UNIT_TO_QUANTITY[unit] ?? 1) / (UNIT_TO_QUANTITY[entry.unit] ?? 1)
  return round2(entry.price * quantity * inEntryUnit)
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
