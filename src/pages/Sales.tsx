import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { getSales, addSale, deleteSale, getProducts, generateDemoSales } from '@/lib/store';
import { formatCurrency, formatNumber } from '@/lib/hpp-calculator';
import type { Sale, Product } from '@/types';

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    unitPrice: 0,
    soldAt: new Date().toISOString().split('T')[0],
  });

  const loadData = async () => {
    try {
      const loadedProducts = await getProducts();
      setProducts(loadedProducts);
      
      let loadedSales = await getSales();
      
      // Generate demo data if no sales and there are products
      if (loadedSales.length === 0 && loadedProducts.length > 0) {
        await generateDemoSales(loadedProducts);
        loadedSales = await getSales();
      }
      
      setSales(loadedSales);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Unknown Product';
  };

  const filteredSales = sales.filter(s => {
    const productName = getProductName(s.productId).toLowerCase();
    return productName.includes(search.toLowerCase());
  }).sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());

  const handleOpenDialog = () => {
    setFormData({
      productId: products[0]?.id || '',
      quantity: 1,
      unitPrice: 0,
      soldAt: new Date().toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId) {
      toast({ title: 'Error', description: 'Pilih produk', variant: 'destructive' });
      return;
    }

    await addSale({
      ...formData,
      soldAt: new Date(formData.soldAt),
    });
    
    await loadData();
    toast({ title: 'Berhasil', description: 'Penjualan berhasil ditambahkan' });
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSale(deleteId);
      await loadData();
      toast({ title: 'Berhasil', description: 'Penjualan berhasil dihapus' });
      setDeleteId(null);
    }
  };

  // Calculate summary stats
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);
  const totalUnits = filteredSales.reduce((sum, s) => sum + s.quantity, 0);

  const columns = [
    { key: 'soldAt', header: 'Tanggal', cell: (row: Sale) => (
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span>{new Date(row.soldAt).toLocaleDateString('id-ID', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        })}</span>
      </div>
    )},
    { key: 'product', header: 'Produk', cell: (row: Sale) => (
      <span className="font-medium">{getProductName(row.productId)}</span>
    )},
    { key: 'quantity', header: 'Jumlah', cell: (row: Sale) => (
      <span className="font-mono">{formatNumber(row.quantity, 0)}</span>
    ), className: 'text-right' },
    { key: 'unitPrice', header: 'Harga/Unit', cell: (row: Sale) => (
      <span className="font-mono">{formatCurrency(row.unitPrice)}</span>
    ), className: 'text-right' },
    { key: 'total', header: 'Total', cell: (row: Sale) => (
      <span className="font-mono font-medium">{formatCurrency(row.quantity * row.unitPrice)}</span>
    ), className: 'text-right' },
    { key: 'actions', header: '', cell: (row: Sale) => (
      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}>
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    ), className: 'w-16' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Penjualan" description="Catat dan kelola data penjualan">
        <Button onClick={handleOpenDialog} disabled={products.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Penjualan
        </Button>
      </PageHeader>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">
            Belum ada produk. Tambahkan produk terlebih dahulu untuk mencatat penjualan.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
              <p className="text-2xl font-bold font-mono">{formatNumber(filteredSales.length, 0)}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Total Unit Terjual</p>
              <p className="text-2xl font-bold font-mono">{formatNumber(totalUnits, 0)}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">Total Pendapatan</p>
              <p className="text-2xl font-bold font-mono text-accent">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={filteredSales.slice(0, 100)} // Show latest 100
            keyExtractor={(row) => row.id}
            emptyMessage="Belum ada data penjualan"
          />
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Penjualan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="product">Produk</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData({ ...formData, productId: value })}
                >
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Jumlah</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="unitPrice">Harga per Unit (Rp)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="input-currency"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="soldAt">Tanggal</Label>
                <Input
                  id="soldAt"
                  type="date"
                  value={formData.soldAt}
                  onChange={(e) => setFormData({ ...formData, soldAt: e.target.value })}
                />
              </div>

              {/* Total Preview */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-xl font-bold font-mono">
                    {formatCurrency(formData.quantity * formData.unitPrice)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Penjualan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Sales;
