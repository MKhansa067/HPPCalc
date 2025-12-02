import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import type { Material, Product, ProductIngredient, Overhead, LaborRate, Sale, Unit } from '@/types';

// Seed data for demo
const seedMaterials: Omit<Material, 'id' | 'updatedAt'>[] = [
  { name: 'Tepung Terigu', unit: 'kg', pricePerUnit: 12000, stockAmount: 50 },
  { name: 'Gula Pasir', unit: 'kg', pricePerUnit: 15000, stockAmount: 30 },
  { name: 'Telur', unit: 'pcs', pricePerUnit: 2500, stockAmount: 200 },
  { name: 'Mentega', unit: 'g', pricePerUnit: 80, stockAmount: 5000 },
  { name: 'Susu UHT', unit: 'ml', pricePerUnit: 20, stockAmount: 10000 },
  { name: 'Cokelat Bubuk', unit: 'g', pricePerUnit: 150, stockAmount: 2000 },
  { name: 'Vanili', unit: 'g', pricePerUnit: 500, stockAmount: 500 },
  { name: 'Baking Powder', unit: 'g', pricePerUnit: 100, stockAmount: 1000 },
];

const seedOverheads: Omit<Overhead, 'id'>[] = [
  { name: 'Listrik & Gas', amount: 500000, allocationType: 'fixed' },
  { name: 'Sewa Tempat', amount: 2000000, allocationType: 'fixed' },
  { name: 'Packaging', amount: 500, allocationType: 'per_unit' },
];

const seedLaborRates: Omit<LaborRate, 'id'>[] = [
  { name: 'Baker', wagePerHour: 25000 },
  { name: 'Helper', wagePerHour: 15000 },
];

// ============ MATERIALS API ============
export const getMaterials = async (): Promise<Material[]> => {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching materials:', error);
    return [];
  }

  // Seed if empty
  if (!data || data.length === 0) {
    await seedMaterialsData();
    return getMaterials();
  }

  return data.map(m => ({
    id: m.id,
    name: m.name,
    unit: m.unit as Unit,
    pricePerUnit: m.price_per_unit,
    stockAmount: m.stock_amount,
    updatedAt: new Date(m.updated_at),
  }));
};

const seedMaterialsData = async () => {
  const materials = seedMaterials.map(m => ({
    id: uuidv4(),
    name: m.name,
    unit: m.unit,
    price_per_unit: m.pricePerUnit,
    stock_amount: m.stockAmount,
  }));

  const { error } = await supabase.from('materials').insert(materials);
  if (error) console.error('Error seeding materials:', error);
};

export const addMaterial = async (material: Omit<Material, 'id' | 'updatedAt'>): Promise<Material | null> => {
  const { data, error } = await supabase
    .from('materials')
    .insert({
      id: uuidv4(),
      name: material.name,
      unit: material.unit,
      price_per_unit: material.pricePerUnit,
      stock_amount: material.stockAmount,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding material:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    unit: data.unit as Unit,
    pricePerUnit: data.price_per_unit,
    stockAmount: data.stock_amount,
    updatedAt: new Date(data.updated_at),
  };
};

export const updateMaterial = async (id: string, updates: Partial<Material>): Promise<Material | null> => {
  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.unit !== undefined) updateData.unit = updates.unit;
  if (updates.pricePerUnit !== undefined) updateData.price_per_unit = updates.pricePerUnit;
  if (updates.stockAmount !== undefined) updateData.stock_amount = updates.stockAmount;

  const { data, error } = await supabase
    .from('materials')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating material:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    unit: data.unit as Unit,
    pricePerUnit: data.price_per_unit,
    stockAmount: data.stock_amount,
    updatedAt: new Date(data.updated_at),
  };
};

export const deleteMaterial = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) {
    console.error('Error deleting material:', error);
    return false;
  }
  return true;
};

// ============ PRODUCTS API ============
export const getProducts = async (): Promise<Product[]> => {
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      product_ingredients (*)
    `)
    .order('name');

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  if (!products || products.length === 0) {
    return [];
  }

  return products.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    yieldPerBatch: p.yield_per_batch,
    laborMinutes: p.labor_minutes,
    ingredients: (p.product_ingredients || []).map((i: { id: string; material_id: string; quantity: number }) => ({
      id: i.id,
      materialId: i.material_id,
      quantity: i.quantity,
    })),
    createdAt: new Date(p.created_at),
    updatedAt: new Date(p.updated_at),
  }));
};

export const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | null> => {
  const productId = uuidv4();

  const { data, error } = await supabase
    .from('products')
    .insert({
      id: productId,
      name: product.name,
      description: product.description,
      yield_per_batch: product.yieldPerBatch,
      labor_minutes: product.laborMinutes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding product:', error);
    return null;
  }

  // Insert ingredients
  if (product.ingredients && product.ingredients.length > 0) {
    const ingredients = product.ingredients.map(i => ({
      id: uuidv4(),
      product_id: productId,
      material_id: i.materialId,
      quantity: i.quantity,
    }));

    const { error: ingError } = await supabase.from('product_ingredients').insert(ingredients);
    if (ingError) console.error('Error adding ingredients:', ingError);
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    yieldPerBatch: data.yield_per_batch,
    laborMinutes: data.labor_minutes,
    ingredients: product.ingredients || [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product | null> => {
  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.yieldPerBatch !== undefined) updateData.yield_per_batch = updates.yieldPerBatch;
  if (updates.laborMinutes !== undefined) updateData.labor_minutes = updates.laborMinutes;

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    return null;
  }

  // Update ingredients if provided
  if (updates.ingredients) {
    // Delete existing ingredients
    await supabase.from('product_ingredients').delete().eq('product_id', id);

    // Insert new ingredients
    if (updates.ingredients.length > 0) {
      const ingredients = updates.ingredients.map(i => ({
        id: uuidv4(),
        product_id: id,
        material_id: i.materialId,
        quantity: i.quantity,
      }));
      await supabase.from('product_ingredients').insert(ingredients);
    }
  }

  // Fetch updated product with ingredients
  const { data: updated } = await supabase
    .from('products')
    .select(`*, product_ingredients (*)`)
    .eq('id', id)
    .single();

  if (!updated) return null;

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description || '',
    yieldPerBatch: updated.yield_per_batch,
    laborMinutes: updated.labor_minutes,
    ingredients: (updated.product_ingredients || []).map((i: { id: string; material_id: string; quantity: number }) => ({
      id: i.id,
      materialId: i.material_id,
      quantity: i.quantity,
    })),
    createdAt: new Date(updated.created_at),
    updatedAt: new Date(updated.updated_at),
  };
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  // Delete ingredients first (cascade should handle this, but just in case)
  await supabase.from('product_ingredients').delete().eq('product_id', id);

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    console.error('Error deleting product:', error);
    return false;
  }
  return true;
};

// ============ OVERHEADS API ============
export const getOverheads = async (): Promise<Overhead[]> => {
  const { data, error } = await supabase
    .from('overheads')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching overheads:', error);
    return [];
  }

  if (!data || data.length === 0) {
    await seedOverheadsData();
    return getOverheads();
  }

  return data.map(o => ({
    id: o.id,
    name: o.name,
    amount: o.amount,
    allocationType: o.allocation_type as 'fixed' | 'per_unit' | 'percentage',
  }));
};

const seedOverheadsData = async () => {
  const overheads = seedOverheads.map(o => ({
    id: uuidv4(),
    name: o.name,
    amount: o.amount,
    allocation_type: o.allocationType,
  }));

  const { error } = await supabase.from('overheads').insert(overheads);
  if (error) console.error('Error seeding overheads:', error);
};

export const addOverhead = async (overhead: Omit<Overhead, 'id'>): Promise<Overhead | null> => {
  const { data, error } = await supabase
    .from('overheads')
    .insert({
      id: uuidv4(),
      name: overhead.name,
      amount: overhead.amount,
      allocation_type: overhead.allocationType,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding overhead:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    amount: data.amount,
    allocationType: data.allocation_type as 'fixed' | 'per_unit' | 'percentage',
  };
};

export const updateOverhead = async (id: string, updates: Partial<Overhead>): Promise<Overhead | null> => {
  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.amount !== undefined) updateData.amount = updates.amount;
  if (updates.allocationType !== undefined) updateData.allocation_type = updates.allocationType;

  const { data, error } = await supabase
    .from('overheads')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating overhead:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    amount: data.amount,
    allocationType: data.allocation_type as 'fixed' | 'per_unit' | 'percentage',
  };
};

export const deleteOverhead = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('overheads').delete().eq('id', id);
  if (error) {
    console.error('Error deleting overhead:', error);
    return false;
  }
  return true;
};

// ============ LABOR RATES API ============
export const getLaborRates = async (): Promise<LaborRate[]> => {
  const { data, error } = await supabase
    .from('labor_rates')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching labor rates:', error);
    return [];
  }

  if (!data || data.length === 0) {
    await seedLaborRatesData();
    return getLaborRates();
  }

  return data.map(r => ({
    id: r.id,
    name: r.name,
    wagePerHour: r.wage_per_hour,
  }));
};

const seedLaborRatesData = async () => {
  const rates = seedLaborRates.map(r => ({
    id: uuidv4(),
    name: r.name,
    wage_per_hour: r.wagePerHour,
  }));

  const { error } = await supabase.from('labor_rates').insert(rates);
  if (error) console.error('Error seeding labor rates:', error);
};

export const saveLaborRates = async (rates: LaborRate[]): Promise<void> => {
  // Delete all existing rates and insert new ones
  await supabase.from('labor_rates').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (rates.length > 0) {
    const newRates = rates.map(r => ({
      id: r.id || uuidv4(),
      name: r.name,
      wage_per_hour: r.wagePerHour,
    }));
    await supabase.from('labor_rates').insert(newRates);
  }
};

// ============ SALES API ============
export const getSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('sold_at', { ascending: false });

  if (error) {
    console.error('Error fetching sales:', error);
    return [];
  }

  return (data || []).map(s => ({
    id: s.id,
    productId: s.product_id,
    quantity: s.quantity,
    unitPrice: s.unit_price,
    soldAt: new Date(s.sold_at),
  }));
};

export const addSale = async (sale: Omit<Sale, 'id'>): Promise<Sale | null> => {
  const { data, error } = await supabase
    .from('sales')
    .insert({
      id: uuidv4(),
      product_id: sale.productId,
      quantity: sale.quantity,
      unit_price: sale.unitPrice,
      sold_at: sale.soldAt instanceof Date ? sale.soldAt.toISOString() : sale.soldAt,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding sale:', error);
    return null;
  }

  return {
    id: data.id,
    productId: data.product_id,
    quantity: data.quantity,
    unitPrice: data.unit_price,
    soldAt: new Date(data.sold_at),
  };
};

export const deleteSale = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) {
    console.error('Error deleting sale:', error);
    return false;
  }
  return true;
};

// Generate demo sales data
export const generateDemoSales = async (products: Product[]): Promise<void> => {
  if (products.length === 0) return;

  const sales: {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    sold_at: string;
  }[] = [];
  const now = new Date();

  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    products.forEach(product => {
      const dayOfWeek = date.getDay();
      const baseQty = dayOfWeek === 0 || dayOfWeek === 6 ? 8 : 5;
      const qty = Math.floor(Math.random() * 10) + baseQty;

      if (qty > 0) {
        sales.push({
          id: uuidv4(),
          product_id: product.id,
          quantity: qty,
          unit_price: Math.floor(Math.random() * 5000) + 15000,
          sold_at: date.toISOString(),
        });
      }
    });
  }

  // Insert in batches of 100
  for (let i = 0; i < sales.length; i += 100) {
    const batch = sales.slice(i, i + 100);
    const { error } = await supabase.from('sales').insert(batch);
    if (error) console.error('Error inserting sales batch:', error);
  }
};

// Legacy sync wrappers (deprecated - for backward compatibility during migration)
export const saveMaterials = (_materials: Material[]): void => {
  console.warn('saveMaterials is deprecated. Use individual add/update/delete functions.');
};

export const saveProducts = (_products: Product[]): void => {
  console.warn('saveProducts is deprecated. Use individual add/update/delete functions.');
};

export const saveOverheads = (_overheads: Overhead[]): void => {
  console.warn('saveOverheads is deprecated. Use individual add/update/delete functions.');
};

export const saveSales = (_sales: Sale[]): void => {
  console.warn('saveSales is deprecated. Use individual add/update/delete functions.');
};
