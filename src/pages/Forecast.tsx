import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getProducts } from '@/lib/store';
import { calculateForecast } from '@/lib/forecast';
import { formatNumber } from '@/lib/hpp-calculator';
import type { Product, ForecastResult } from '@/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const Forecast: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [horizonDays, setHorizonDays] = useState(30);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedProducts = await getProducts();
        setProducts(loadedProducts);
        if (loadedProducts.length > 0) {
          setSelectedProductId(loadedProducts[0].id);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadForecast = async () => {
      if (selectedProductId) {
        const result = await calculateForecast(selectedProductId, horizonDays);
        setForecast(result);
      }
    };
    loadForecast();
  }, [selectedProductId, horizonDays]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-5 h-5 text-success" />;
      case 'down': return <TrendingDown className="w-5 h-5 text-destructive" />;
      default: return <Minus className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-success';
      case 'down': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const chartData = forecast?.dailyForecast.map(f => ({
    date: new Date(f.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    quantity: f.quantity,
  })) || [];

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
        title="Rekomendasi & Prediksi"
        description="Analisis tren penjualan dan rekomendasi stok"
      />

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Belum ada produk. Tambahkan produk dan data penjualan untuk melihat prediksi.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-2 block">Produk</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih produk" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-48">
                  <Label className="text-xs text-muted-foreground mb-2 block">Horizon Prediksi</Label>
                  <Select value={String(horizonDays)} onValueChange={(v) => setHorizonDays(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Hari</SelectItem>
                      <SelectItem value="14">14 Hari</SelectItem>
                      <SelectItem value="30">30 Hari</SelectItem>
                      <SelectItem value="60">60 Hari</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {forecast && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      {getTrendIcon(forecast.trend)}
                      <span className="text-sm text-muted-foreground">Tren Penjualan</span>
                    </div>
                    <p className={`text-2xl font-bold capitalize ${getTrendColor(forecast.trend)}`}>
                      {forecast.trend === 'up' ? 'Naik' : forecast.trend === 'down' ? 'Turun' : 'Stabil'}
                    </p>
                    <p className={`text-sm ${getTrendColor(forecast.trend)}`}>
                      {forecast.trendPercent > 0 ? '+' : ''}{formatNumber(forecast.trendPercent)}% / bulan
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-2">Prediksi {horizonDays} Hari</p>
                    <p className="text-2xl font-bold font-mono">
                      {formatNumber(forecast.totalForecast, 0)} unit
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ~{formatNumber(forecast.averageDailySales, 1)}/hari
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-2">Stok Estimasi</p>
                    <p className="text-2xl font-bold font-mono">
                      {formatNumber(forecast.currentStock, 0)} unit
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ~{formatNumber(forecast.currentStock / Math.max(forecast.averageDailySales, 1), 0)} hari
                    </p>
                  </CardContent>
                </Card>

                <Card className={forecast.recommendedRestock > 0 ? 'border-warning/50 bg-warning/5' : 'border-success/50 bg-success/5'}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      {forecast.recommendedRestock > 0 ? (
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-success" />
                      )}
                      <span className="text-sm text-muted-foreground">Restock</span>
                    </div>
                    <p className="text-2xl font-bold font-mono">
                      {formatNumber(forecast.recommendedRestock, 0)} unit
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {forecast.recommendedRestock > 0 ? 'Perlu restock' : 'Stok mencukupi'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Forecast Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prediksi Penjualan {horizonDays} Hari</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`${formatNumber(value, 0)} unit`, 'Prediksi']}
                        />
                        <ReferenceLine 
                          y={forecast.averageDailySales} 
                          stroke="hsl(var(--muted-foreground))" 
                          strokeDasharray="5 5"
                          label={{ value: 'Rata-rata', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="quantity"
                          stroke="hsl(var(--accent))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#forecastGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rekomendasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stock Recommendation */}
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">📦 Manajemen Stok</h4>
                      {forecast.recommendedRestock > 0 ? (
                        <p className="text-muted-foreground">
                          Berdasarkan prediksi {horizonDays} hari ke depan dan buffer keamanan 7 hari, 
                          Anda perlu melakukan restock sebanyak <strong className="text-foreground">{formatNumber(forecast.recommendedRestock, 0)} unit</strong>.
                        </p>
                      ) : (
                        <p className="text-muted-foreground">
                          Stok Anda saat ini mencukupi untuk {horizonDays} hari ke depan dengan buffer keamanan.
                        </p>
                      )}
                    </div>

                    {/* Trend Analysis */}
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">📈 Analisis Tren</h4>
                      {forecast.trend === 'up' ? (
                        <p className="text-muted-foreground">
                          Penjualan produk ini menunjukkan tren naik <strong className="text-success">+{formatNumber(forecast.trendPercent)}%</strong> per bulan. 
                          Pertimbangkan untuk meningkatkan kapasitas produksi dan stok bahan baku.
                        </p>
                      ) : forecast.trend === 'down' ? (
                        <p className="text-muted-foreground">
                          Penjualan produk ini menunjukkan tren menurun <strong className="text-destructive">{formatNumber(forecast.trendPercent)}%</strong> per bulan. 
                          Pertimbangkan untuk melakukan promosi atau evaluasi harga.
                        </p>
                      ) : (
                        <p className="text-muted-foreground">
                          Penjualan produk ini relatif stabil. Pertahankan strategi yang ada dan pantau secara berkala.
                        </p>
                      )}
                    </div>

                    {/* Production Planning */}
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">🏭 Perencanaan Produksi</h4>
                      <p className="text-muted-foreground">
                        Dengan rata-rata penjualan <strong className="text-foreground">{formatNumber(forecast.averageDailySales, 1)} unit/hari</strong>, 
                        targetkan produksi sekitar <strong className="text-foreground">{formatNumber(forecast.averageDailySales * 7, 0)} unit/minggu</strong> atau 
                        <strong className="text-foreground"> {formatNumber(forecast.averageDailySales * 30, 0)} unit/bulan</strong>.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Forecast;
