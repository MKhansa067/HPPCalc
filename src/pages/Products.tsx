import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Package } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { getProducts, addProduct, updateProduct, deleteProduct, getMaterials } from '@/lib/store';
import { formatNumber } from '@/lib/hpp-calculator';
import type { Product, Material, ProductIngredient } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    yieldPerBatch: 1,
    laborMinutes: 30,
    ingredients: [] as ProductIngredient[],
  });

  const loadData = async () => {
    try {
      const [loadedProducts, loadedMaterials] = await Promise.all([
        getProducts(),
        getMaterials()
      ]);
      setProducts(loadedProducts);
      setMaterials(loadedMaterials);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        yieldPerBatch: product.yieldPerBatch,
        laborMinutes: product.laborMinutes,
        ingredients: [...product.ingredients],
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        yieldPerBatch: 1,
        laborMinutes: 30,
        ingredients: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        { id: uuidv4(), materialId: '', quantity: 0 },
      ],
    });
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...formData.ingredients];
    newIngredients.splice(index, 1);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleIngredientChange = (index: number, field: keyof ProductIngredient, value: string | number) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Nama produk harus diisi', variant: 'destructive' });
      return;
    }

    if (formData.ingredients.length === 0) {
      toast({ title: 'Error', description: 'Tambahkan minimal satu bahan', variant: 'destructive' });
      return;
    }

    const validIngredients = formData.ingredients.filter(i => i.materialId && i.quantity > 0);

    if (editingProduct) {
      await updateProduct(editingProduct.id, { ...formData, ingredients: validIngredients });
      toast({ title: 'Berhasil', description: 'Produk berhasil diperbarui' });
    } else {
      await addProduct({ ...formData, ingredients: validIngredients });
      toast({ title: 'Berhasil', description: 'Produk berhasil ditambahkan' });
    }

    await loadData();
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProduct(deleteId);
      await loadData();
      toast({ title: 'Berhasil', description: 'Produk berhasil dihapus' });
      setDeleteId(null);
    }
  };

  const getMaterialName = (materialId: string) => {
    return materials.find(m => m.id === materialId)?.name || 'Unknown';
  };

  const columns = [
    { key: 'name', header: 'Nama Produk', cell: (row: Product) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.description || 'Tidak ada deskripsi'}</p>
        </div>
      </div>
    )},
    { key: 'ingredients', header: 'Bahan', cell: (row: Product) => (
      <div className="flex flex-wrap gap-1">
        {row.ingredients.slice(0, 3).map((ing, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {getMaterialName(ing.materialId)}
          </Badge>
        ))}
        {row.ingredients.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{row.ingredients.length - 3}
          </Badge>
        )}
      </div>
    )},
    { key: 'yield', header: 'Yield', cell: (row: Product) => (
      <span className="font-mono">{formatNumber(row.yieldPerBatch)} unit</span>
    ), className: 'text-right' },
    { key: 'labor', header: 'Waktu Kerja', cell: (row: Product) => (
      <span className="font-mono">{row.laborMinutes} menit</span>
    ), className: 'text-right' },
    { key: 'actions', header: '', cell: (row: Product) => (
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleOpenDialog(row); }}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    ), className: 'w-24' },
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
      <PageHeader title="Produk" description="Kelola produk dan resep Anda">
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        keyExtractor={(row) => row.id}
        emptyMessage="Belum ada produk. Klik 'Tambah Produk' untuk memulai."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="name">Nama Produk</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Brownies Coklat"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="yield">Yield per Batch (unit)</Label>
                  <Input
                    id="yield"
                    type="number"
                    min="1"
                    value={formData.yieldPerBatch}
                    onChange={(e) => setFormData({ ...formData, yieldPerBatch: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi singkat produk..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="labor">Waktu Kerja (menit per batch)</Label>
                <Input
                  id="labor"
                  type="number"
                  min="1"
                  value={formData.laborMinutes}
                  onChange={(e) => setFormData({ ...formData, laborMinutes: Number(e.target.value) })}
                />
              </div>

              {/* Ingredients Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Resep Bahan (per batch)</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddIngredient}>
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah Bahan
                  </Button>
                </div>

                {formData.ingredients.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground">
                    Belum ada bahan. Klik "Tambah Bahan" untuk menambahkan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.ingredients.map((ing, index) => (
                      <div key={ing.id} className="flex gap-3 items-end p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <Label className="text-xs">Bahan</Label>
                          <Select
                            value={ing.materialId}
                            onValueChange={(value) => handleIngredientChange(index, 'materialId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih bahan" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map(m => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.name} ({m.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-32">
                          <Label className="text-xs">Jumlah</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ing.quantity}
                            onChange={(e) => handleIngredientChange(index, 'quantity', Number(e.target.value))}
                            className="input-currency"
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveIngredient(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingProduct ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Produk akan dihapus secara permanen.
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

export default Products;
