import type { Sale, Product, ForecastResult, Material } from '@/types';
import { getSales, getMaterials, getProducts } from './store';

export const calculateForecast = async (
  productId: string,
  horizonDays: number = 30,
  safetyDays: number = 7
): Promise<ForecastResult | null> => {
  const products = await getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return null;
  
  const allSales = await getSales();
  const sales = allSales.filter(s => s.productId === productId);
  
  // Get last 90 days of sales
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const recentSales = sales.filter(s => {
    const saleDate = new Date(s.soldAt);
    return saleDate >= ninetyDaysAgo && saleDate <= now;
  });
  
  // Aggregate sales by day
  const dailySales = new Map<string, number>();
  recentSales.forEach(sale => {
    const dateKey = new Date(sale.soldAt).toISOString().split('T')[0];
    dailySales.set(dateKey, (dailySales.get(dateKey) ?? 0) + sale.quantity);
  });
  
  // Convert to array for calculations
  const salesArray: { date: Date; qty: number }[] = [];
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    salesArray.push({
      date,
      qty: dailySales.get(dateKey) ?? 0,
    });
  }
  
  // Calculate moving averages
  const ma7 = calculateMovingAverage(salesArray.map(s => s.qty), 7);
  const ma30 = calculateMovingAverage(salesArray.map(s => s.qty), 30);
  
  // Simple linear regression for trend
  const { slope, intercept } = linearRegression(salesArray.map((s, i) => [i, s.qty]));
  
  // Determine trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  const trendPercent = (slope / Math.max(ma30, 1)) * 100 * 30; // Monthly change percentage
  
  if (trendPercent > 5) trend = 'up';
  else if (trendPercent < -5) trend = 'down';
  
  // Generate forecast
  const dailyForecast: { date: string; quantity: number }[] = [];
  const baseValue = ma7; // Use 7-day MA as base
  
  for (let i = 1; i <= horizonDays; i++) {
    const forecastDate = new Date(now);
    forecastDate.setDate(forecastDate.getDate() + i);
    
    // Apply trend to forecast
    const dayOfWeek = forecastDate.getDay();
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1;
    const trendFactor = 1 + (slope * i) / Math.max(baseValue, 1);
    
    const predictedQty = Math.max(0, Math.round(baseValue * trendFactor * weekendFactor));
    
    dailyForecast.push({
      date: forecastDate.toISOString().split('T')[0],
      quantity: predictedQty,
    });
  }
  
  const totalForecast = dailyForecast.reduce((sum, d) => sum + d.quantity, 0);
  
  // Calculate current stock (simplified - sum of material stock)
  const materials = await getMaterials();
  const currentStock = product.ingredients.reduce((total, ing) => {
    const material = materials.find(m => m.id === ing.materialId);
    if (!material) return total;
    return total + Math.floor(material.stockAmount / ing.quantity) * product.yieldPerBatch;
  }, 0) || 100; // Default if no ingredients
  
  // Calculate recommended restock
  const safetyBuffer = Math.ceil(ma7 * safetyDays);
  const recommendedRestock = Math.max(0, totalForecast - currentStock + safetyBuffer);
  
  return {
    productId,
    productName: product.name,
    horizon: horizonDays,
    dailyForecast,
    totalForecast,
    currentStock,
    recommendedRestock,
    averageDailySales: ma7,
    trend,
    trendPercent: Math.round(trendPercent * 10) / 10,
  };
};

const calculateMovingAverage = (data: number[], window: number): number => {
  if (data.length < window) return data.reduce((a, b) => a + b, 0) / data.length || 0;
  
  const windowData = data.slice(-window);
  return windowData.reduce((a, b) => a + b, 0) / window;
};

const linearRegression = (data: number[][]): { slope: number; intercept: number } => {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0 };
  
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  data.forEach(([x, y]) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept };
};
