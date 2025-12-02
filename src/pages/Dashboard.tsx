import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Boxes, 
  TrendingUp, 
  DollarSign, 
  Calculator,
  ArrowRight,
  ShoppingCart 
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMaterials, getProducts, getSales, generateDemoSales } from '@/lib/store';
import { formatCurrency, formatNumber } from '@/lib/hpp-calculator';
import type { Product, Material, Sale } from '@/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const Dashboard: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedMaterials, loadedProducts, loadedSales] = await Promise.all([
          getMaterials(),
          getProducts(),
          getSales()
        ]);
        
        setMaterials(loadedMaterials);
        setProducts(loadedProducts);
        
        // Generate demo sales if no sales exist and there are products
        if (loadedProducts.length > 0 && loadedSales.length === 0) {
          await generateDemoSales(loadedProducts);
          const newSales = await getSales();
          setSales(newSales);
        } else {
          setSales(loadedSales);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);
    const totalUnits = sales.reduce((sum, s) => sum + s.quantity, 0);
    const averagePrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;

    // Last 30 days sales
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSales = sales.filter(s => new Date(s.soldAt) >= thirtyDaysAgo);
    const recentRevenue = recentSales.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);

    return {
      totalProducts: products.length,
      totalMaterials: materials.length,
      totalRevenue,
      recentRevenue,
      averagePrice,
      totalUnits,
    };
  }, [products, materials, sales]);

  // Chart data - sales by day (last 14 days)
  const chartData = useMemo(() => {
    const data: { date: string; revenue: number; units: number }[] = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const displayDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      const daySales = sales.filter(s => {
        const saleDate = new Date(s.soldAt).toISOString().split('T')[0];
        return saleDate === dateStr;
      });

      const revenue = daySales.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);
      const units = daySales.reduce((sum, s) => sum + s.quantity, 0);

      data.push({ date: displayDate, revenue, units });
    }

    return data;
  }, [sales]);

  // Product performance data
  const productPerformance = useMemo(() => {
    const performance = products.map(product => {
      const productSales = sales.filter(s => s.productId === product.id);
      const revenue = productSales.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);
      const units = productSales.reduce((sum, s) => sum + s.quantity, 0);
      return { name: product.name, revenue, units };
    });

    return performance.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [products, sales]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Ringkasan performa dan biaya produksi Anda"
      >
        <Link to="/calculator">
          <Button>
            <Calculator className="w-4 h-4 mr-2" />
            Hitung HPP
          </Button>
        </Link>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Produk"
          value={stats.totalProducts}
          subtitle={`${stats.totalMaterials} bahan baku`}
          icon={<Package className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="Penjualan 30 Hari"
          value={formatCurrency(stats.recentRevenue)}
          subtitle={`${formatNumber(stats.totalUnits, 0)} unit terjual`}
          icon={<ShoppingCart className="w-6 h-6 text-accent" />}
          trend="up"
          trendValue="+12.5%"
        />
        <StatCard
          title="Total Pendapatan"
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign className="w-6 h-6 text-success" />}
        />
        <StatCard
          title="Rata-rata Harga"
          value={formatCurrency(stats.averagePrice)}
          subtitle="per unit"
          icon={<TrendingUp className="w-6 h-6 text-warning" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tren Penjualan (14 Hari)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Pendapatan']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Product Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            {productPerformance.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Pendapatan']}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Belum ada data produk
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/materials" className="group">
              <div className="p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-all">
                <Boxes className="w-8 h-8 text-muted-foreground group-hover:text-accent mb-3" />
                <h3 className="font-medium">Kelola Bahan Baku</h3>
                <p className="text-sm text-muted-foreground mt-1">Tambah atau edit bahan</p>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent mt-3" />
              </div>
            </Link>

            <Link to="/products" className="group">
              <div className="p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-all">
                <Package className="w-8 h-8 text-muted-foreground group-hover:text-accent mb-3" />
                <h3 className="font-medium">Tambah Produk</h3>
                <p className="text-sm text-muted-foreground mt-1">Buat resep produk baru</p>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent mt-3" />
              </div>
            </Link>

            <Link to="/calculator" className="group">
              <div className="p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-all">
                <Calculator className="w-8 h-8 text-muted-foreground group-hover:text-accent mb-3" />
                <h3 className="font-medium">Hitung HPP</h3>
                <p className="text-sm text-muted-foreground mt-1">Kalkulasi biaya produksi</p>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent mt-3" />
              </div>
            </Link>

            <Link to="/forecast" className="group">
              <div className="p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-all">
                <TrendingUp className="w-8 h-8 text-muted-foreground group-hover:text-accent mb-3" />
                <h3 className="font-medium">Lihat Prediksi</h3>
                <p className="text-sm text-muted-foreground mt-1">Rekomendasi penjualan</p>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent mt-3" />
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
