import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calculator, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  FileText, 
  Settings, 
  LogIn, 
  LogOut,
  BarChart3,
  Boxes
} from 'lucide-react';

const features = [
  {
    title: 'Bahan Baku',
    description: 'Kelola data bahan baku dengan harga dan stok terkini',
    icon: Boxes,
    href: '/materials',
    color: 'bg-blue-500',
  },
  {
    title: 'Produk',
    description: 'Buat resep produk dengan komposisi bahan dan waktu produksi',
    icon: Package,
    href: '/products',
    color: 'bg-green-500',
  },
  {
    title: 'Penjualan',
    description: 'Catat transaksi penjualan harian untuk analisis',
    icon: ShoppingCart,
    href: '/sales',
    color: 'bg-purple-500',
  },
  {
    title: 'Kalkulator HPP',
    description: 'Hitung harga pokok produksi secara akurat dan detail',
    icon: Calculator,
    href: '/calculator',
    color: 'bg-orange-500',
  },
  {
    title: 'Forecast',
    description: 'Prediksi penjualan dan kebutuhan bahan baku',
    icon: TrendingUp,
    href: '/forecast',
    color: 'bg-cyan-500',
  },
  {
    title: 'Laporan',
    description: 'Lihat laporan penjualan dan analisis keuntungan',
    icon: FileText,
    href: '/reports',
    color: 'bg-pink-500',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Calculator className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">HPPCalc</h1>
              <p className="text-xs text-muted-foreground">Kalkulator Harga Pokok Produksi</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
            )}
            <Button 
              variant={user ? "outline" : "default"} 
              onClick={handleAuthAction}
              disabled={loading}
            >
              {user ? (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Masuk
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <BarChart3 className="h-4 w-4" />
            Solusi Manajemen Biaya Produksi
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Hitung HPP dengan Mudah dan Akurat
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Aplikasi lengkap untuk menghitung Harga Pokok Produksi, mengelola bahan baku, 
            mencatat penjualan, dan menganalisis keuntungan bisnis Anda.
          </p>
          {user ? (
            <Button size="lg" onClick={() => navigate('/calculator')}>
              <Calculator className="h-5 w-5 mr-2" />
              Mulai Hitung HPP
            </Button>
          ) : (
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')}>
                Mulai Gratis
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                Pelajari Lebih Lanjut
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Fitur Lengkap</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Semua yang Anda butuhkan untuk mengelola biaya produksi dalam satu aplikasi
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <Card 
              key={feature.href} 
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
              onClick={() => user ? navigate(feature.href) : navigate('/auth')}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="container mx-auto px-4 py-16">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Siap Mengoptimalkan Bisnis Anda?</h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Daftar sekarang dan mulai kelola biaya produksi dengan lebih efisien
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/auth')}
              >
                Daftar Gratis Sekarang
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 MKhansa067. All right reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
