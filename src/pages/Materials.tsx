import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
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
import { getMaterials, addMaterial, updateMaterial, deleteMaterial } from '@/lib/store';
import { formatCurrency, formatNumber } from '@/lib/hpp-calculator';
import type { Material, Unit } from '@/types';

const UNITS: { value: Unit; label: string }[] = [
  { value: 'g', label: 'Gram (g)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'ml', label: 'Mililiter (ml)' },
  { value: 'l', label: 'Liter (l)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'pack', label: 'Pack' },
];

const Materials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    unit: 'g' as Unit,
    pricePerUnit: 0,
    stockAmount: 0,
  });

  const loadMaterials = async () => {
    try {
      const data = await getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        unit: material.unit,
        pricePerUnit: material.pricePerUnit,
        stockAmount: material.stockAmount,
      });
    } else {
      setEditingMaterial(null);
      setFormData({ name: '', unit: 'g', pricePerUnit: 0, stockAmount: 0 });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Nama bahan harus diisi', variant: 'destructive' });
      return;
    }

    if (editingMaterial) {
      await updateMaterial(editingMaterial.id, formData);
      toast({ title: 'Berhasil', description: 'Bahan berhasil diperbarui' });
    } else {
      await addMaterial(formData);
      toast({ title: 'Berhasil', description: 'Bahan berhasil ditambahkan' });
    }

    await loadMaterials();
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMaterial(deleteId);
      await loadMaterials();
      toast({ title: 'Berhasil', description: 'Bahan berhasil dihapus' });
      setDeleteId(null);
    }
  };

  const columns = [
    { key: 'name', header: 'Nama Bahan', cell: (row: Material) => (
      <span className="font-medium">{row.name}</span>
    )},
    { key: 'unit', header: 'Satuan', cell: (row: Material) => (
      <span className="text-muted-foreground">{row.unit.toUpperCase()}</span>
    )},
    { key: 'pricePerUnit', header: 'Harga/Satuan', cell: (row: Material) => (
      <span className="font-mono">{formatCurrency(row.pricePerUnit)}</span>
    ), className: 'text-right' },
    { key: 'stockAmount', header: 'Stok', cell: (row: Material) => (
      <span className="font-mono">{formatNumber(row.stockAmount)} {row.unit}</span>
    ), className: 'text-right' },
    { key: 'actions', header: '', cell: (row: Material) => (
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
      <PageHeader title="Bahan Baku" description="Kelola inventaris bahan baku Anda">
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Bahan
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari bahan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredMaterials}
        keyExtractor={(row) => row.id}
        emptyMessage="Belum ada bahan baku. Klik 'Tambah Bahan' untuk memulai."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Edit Bahan' : 'Tambah Bahan Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Nama Bahan</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Tepung Terigu"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unit">Satuan</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value as Unit })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price">Harga per Satuan (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData({ ...formData, pricePerUnit: Number(e.target.value) })}
                    className="input-currency"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="stock">Jumlah Stok</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stockAmount}
                  onChange={(e) => setFormData({ ...formData, stockAmount: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {editingMaterial ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Bahan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Bahan akan dihapus secara permanen.
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

export default Materials;
