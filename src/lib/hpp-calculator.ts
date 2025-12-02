import type { Product, Material, Overhead, LaborRate, HPPResult, Unit } from '@/types';
import { getMaterials, getOverheads, getLaborRates } from './store';

interface HPPOverrides {
  materialPrices?: { materialId: string; pricePerUnit: number }[];
  laborMinutes?: number;
  laborRateId?: string;
  marginPercent?: number;
  monthlyProduction?: number;
}

const DEFAULT_MARGIN = 30; // 30%
const DEFAULT_MONTHLY_PRODUCTION = 500; // units

export const calculateHPP = async (
  product: Product,
  overrides: HPPOverrides = {}
): Promise<HPPResult> => {
  const materials = await getMaterials();
  const overheads = await getOverheads();
  const laborRates = await getLaborRates();
  
  const marginPercent = overrides.marginPercent ?? DEFAULT_MARGIN;
  const monthlyProduction = overrides.monthlyProduction ?? DEFAULT_MONTHLY_PRODUCTION;
  const laborMinutes = overrides.laborMinutes ?? product.laborMinutes;
  
  // Calculate material costs
  const materialDetails = product.ingredients.map(ingredient => {
    const material = materials.find(m => m.id === ingredient.materialId);
    if (!material) {
      return {
        name: 'Unknown Material',
        quantity: ingredient.quantity,
        unit: 'pcs' as Unit,
        pricePerUnit: 0,
        total: 0,
      };
    }
    
    // Check for price override
    const priceOverride = overrides.materialPrices?.find(
      p => p.materialId === ingredient.materialId
    );
    const pricePerUnit = priceOverride?.pricePerUnit ?? material.pricePerUnit;
    
    // Calculate cost per unit of product
    const quantityPerUnit = ingredient.quantity / product.yieldPerBatch;
    const total = quantityPerUnit * pricePerUnit;
    
    return {
      name: material.name,
      quantity: quantityPerUnit,
      unit: material.unit,
      pricePerUnit,
      total,
    };
  });
  
  const materialsTotal = materialDetails.reduce((sum, m) => sum + m.total, 0);
  
  // Calculate labor cost
  const laborRate = overrides.laborRateId 
    ? laborRates.find(r => r.id === overrides.laborRateId)
    : laborRates[0];
  const wagePerMinute = (laborRate?.wagePerHour ?? 20000) / 60;
  const laborCost = wagePerMinute * laborMinutes;
  
  // Calculate overhead allocation
  let overheadCost = 0;
  overheads.forEach(overhead => {
    switch (overhead.allocationType) {
      case 'fixed':
        // Distribute monthly overhead across monthly production
        overheadCost += overhead.amount / monthlyProduction;
        break;
      case 'per_unit':
        overheadCost += overhead.amount;
        break;
      case 'percentage':
        overheadCost += (materialsTotal + laborCost) * (overhead.amount / 100);
        break;
    }
  });
  
  const hppPerUnit = materialsTotal + laborCost + overheadCost;
  
  // Calculate suggested price with margin
  const suggestedPrice = hppPerUnit / (1 - marginPercent / 100);
  
  return {
    productId: product.id,
    productName: product.name,
    computedAt: new Date(),
    breakdown: {
      materialsTotal,
      materialDetails,
      laborCost,
      overheadCost,
      hppPerUnit,
    },
    suggestedPrice: Math.ceil(suggestedPrice / 100) * 100, // Round up to nearest 100
    marginPercent,
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
};
