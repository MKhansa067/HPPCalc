import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, Download, Calendar, Package } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { getProducts, getSales } from '@/lib/store';
import { calculateHPP, formatCurrency, formatNumber } from '@/lib/hpp-calculator';
import { calculateForecast } from '@/lib/forecast';
import { exportToExcel } from '@/lib/excel-export';
import type { Product, Sale, HPPResult } from '@/types';

const Reports: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewStats, setPreviewStats] = useState<{
    hpp: number;
    suggestedPrice: number;
    totalTransactions: number;
    totalUnits: number;
    totalRevenue: number;
    totalCost: number;
    profit: number;
    profitMargin: number;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedProducts, loadedSales] = await Promise.all([
          getProducts(),
          getSales()
        ]);
        setProducts(loadedProducts);
        setSales(loadedSales);
        if (loadedProducts.length > 0) {
          setSelectedProductId(loadedProducts[0].id);
        }

        // Set default dates (last 30 days)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        
        setEndDate(end.toISOString().split('T')[0]);
        setStartDate(start.toISOString().split('T')[0]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Calculate preview stats when dependencies change
  useEffect(() => {
    const calculatePreview = async () => {
      if (!selectedProduct || !startDate || !endDate) {
        setPreviewStats(null);
        return;
      }

      const hpp = await calculateHPP(selectedProduct);
      
      const periodStart = new Date(startDate);
      const periodEnd = new Date(endDate);
      
      const filteredSales = sales.filter(s => {
        if (s.productId !== selectedProductId) return false;
        const saleDate = new Date(s.soldAt);
        return saleDate >= periodStart && saleDate <= periodEnd;
      });

      const totalRevenue = filteredSales.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);
      const totalUnits = filteredSales.reduce((sum, s) => sum + s.quantity, 0);
      const totalCost = totalUnits * hpp.breakdown.hppPerUnit;
      const profit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      setPreviewStats({
        hpp: hpp.breakdown.hppPerUnit,
        suggestedPrice: hpp.suggestedPrice,
        totalTransactions: filteredSales.length,
        totalUnits,
        totalRevenue,
        totalCost,
        profit,
        profitMargin,
      });
    };

    calculatePreview();
  }, [selectedProduct, selectedProductId, startDate, endDate, sales]);

  const handleExport = async () => {
    if (!selectedProduct) {
      toast({ title: 'Error', description: 'Pilih produk terlebih dahulu', variant: 'destructive' });
      return;
    }

    setIsExporting(true);

    try {
      const hpp = await calculateHPP(selectedProduct);
      const forecast = await calculateForecast(selectedProductId, 30);
      
      const periodStart = new Date(startDate);
      const periodEnd = new Date(endDate);
      
      const filteredSales = sales.filter(s => {
        if (s.productId !== selectedProductId) return false;
        const saleDate = new Date(s.soldAt);
        return saleDate >= periodStart && saleDate <= periodEnd;
      });

      exportToExcel({
        hpp,
        sales: filteredSales,
        forecast: forecast || undefined,
        period: { start: periodStart, end: periodEnd },
      });

      toast({ 
        title: 'Berhasil', 
        description: 'Laporan berhasil diexport ke Excel' 
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({ 
        title: 'Error', 
        description: 'Gagal mengexport laporan', 
        variant: 'destructive' 
      });
    } finally {
      setIsExporting(false);
    }
  };

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
        title="Laporan"
        description="Export laporan HPP dan penjualan ke Excel"
      />

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Belum ada produk. Tambahkan produk untuk membuat laporan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-accent" />
                Pengaturan Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Produk</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="mt-2">
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

              <div>
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Periode
                </Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Dari</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Sampai</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Laporan akan berisi:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ringkasan HPP dan harga jual</li>
                  <li>• Detail biaya bahan baku</li>
                  <li>• Biaya tenaga kerja & overhead</li>
                  <li>• Riwayat penjualan periode</li>
                  <li>• Prediksi penjualan 30 hari</li>
                </ul>
              </div>

              <Button 
                onClick={handleExport} 
                className="w-full" 
                size="lg"
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Mengexport...' : 'Export ke Excel'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview Laporan</CardTitle>
              </CardHeader>
              <CardContent>
                {previewStats ? (
                  <div className="space-y-6">
                    {/* Product Info */}
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{selectedProduct?.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedProduct?.description || 'Tidak ada deskripsi'}</p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">HPP/Unit</p>
                        <p className="text-xl font-bold font-mono mt-1">{formatCurrency(previewStats.hpp)}</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Harga Rekomendasi</p>
                        <p className="text-xl font-bold font-mono mt-1">{formatCurrency(previewStats.suggestedPrice)}</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Transaksi</p>
                        <p className="text-xl font-bold font-mono mt-1">{formatNumber(previewStats.totalTransactions, 0)}</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Unit Terjual</p>
                        <p className="text-xl font-bold font-mono mt-1">{formatNumber(previewStats.totalUnits, 0)}</p>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg">
                      <h4 className="font-semibold mb-4">Ringkasan Keuangan Periode</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Pendapatan</span>
                          <span className="font-mono font-medium">{formatCurrency(previewStats.totalRevenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Biaya Produksi</span>
                          <span className="font-mono font-medium text-destructive">-{formatCurrency(previewStats.totalCost)}</span>
                        </div>
                        <div className="h-px bg-border" />
                        <div className="flex justify-between">
                          <span className="font-semibold">Laba Kotor</span>
                          <span className={`font-mono font-bold ${previewStats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatCurrency(previewStats.profit)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Margin Keuntungan</span>
                          <span className={`font-mono font-medium ${previewStats.profitMargin >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatNumber(previewStats.profitMargin, 1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    Pilih produk untuk melihat preview
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
