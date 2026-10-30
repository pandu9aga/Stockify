import React, { useState, useEffect } from 'react';
import api from './services/api';
import AuthModal from './components/AuthModal';
import { 
  Package, Plus, Search, Trash2, Edit2, LogOut, 
  Layers, DollarSign, Box, ShieldCheck, RefreshCw, X,
  ArrowDownRight, ArrowUpRight, History, ArrowLeftRight, FileText
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'mutations'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mutations, setMutations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Product State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    stockQuantity: '',
    categoryId: ''
  });

  // Modal Mutation State (Barang Masuk / Keluar)
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [selectedProductForMutation, setSelectedProductForMutation] = useState(null);
  const [mutationForm, setMutationForm] = useState({
    type: 'StockIn', // 'StockIn' | 'StockOut' | 'Adjustment' | 'Damaged'
    quantity: 1,
    notes: ''
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCategories();
      fetchMutations();
    }
  }, [user, search]);

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/products${search ? `?search=${search}` : ''}`);
      setProducts(res.data);
    } catch (err) {
      console.error('Gagal mengambil produk', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
      if (res.data.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: res.data[0].id }));
      }
    } catch (err) {
      console.error('Gagal mengambil kategori', err);
    }
  };

  const fetchMutations = async () => {
    try {
      const res = await api.get('/stockmutations');
      setMutations(res.data);
    } catch (err) {
      console.error('Gagal mengambil riwayat mutasi', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      price: '',
      stockQuantity: '',
      categoryId: categories[0]?.id || 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      price: prod.price,
      stockQuantity: prod.stockQuantity,
      categoryId: prod.categoryId
    });
    setIsModalOpen(true);
  };

  const openMutationModal = (prod, defaultType = 'StockIn') => {
    setSelectedProductForMutation(prod);
    setMutationForm({
      type: defaultType,
      quantity: 1,
      notes: ''
    });
    setIsMutationModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity, 10),
        categoryId: parseInt(formData.categoryId, 10)
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setIsModalOpen(false);
      fetchProducts();
      fetchMutations();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan produk.');
    }
  };

  const handleMutationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductForMutation) return;

    try {
      await api.post('/stockmutations', {
        productId: selectedProductForMutation.id,
        quantity: parseInt(mutationForm.quantity, 10),
        type: mutationForm.type,
        notes: mutationForm.notes
      });

      setIsMutationModalOpen(false);
      fetchProducts();
      fetchMutations();
      alert(`Berhasil mencatat mutasi stok untuk ${selectedProductForMutation.name}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mencatat mutasi.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
      fetchMutations();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus produk.');
    }
  };

  if (loading) return null;
  if (!user) return <AuthModal onAuthSuccess={(userData) => setUser(userData)} />;

  const totalItems = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const totalValue = products.reduce((acc, p) => acc + (p.price * p.stockQuantity), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-600/30">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Stockify <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">v1.2</span>
            </h1>
            <p className="text-xs text-slate-400">Enterprise Warehouse Management System</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box size={16} />
            Katalog Stok
          </button>
          <button
            onClick={() => {
              setActiveTab('mutations');
              fetchMutations();
            }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              activeTab === 'mutations' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History size={16} />
            Log Mutasi & Audit
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-sm">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="font-medium text-slate-200">{user.username}</span>
            <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-md font-mono">{user.role}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Produk Unik</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{products.length}</h3>
            </div>
            <div className="bg-indigo-500/10 text-indigo-400 p-3.5 rounded-xl">
              <Box size={26} />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Unit Barang (Stock)</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{totalItems}</h3>
            </div>
            <div className="bg-blue-500/10 text-blue-400 p-3.5 rounded-xl">
              <Layers size={26} />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-slate-400 text-sm font-medium">Estimasi Nilai Gudang</p>
              <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">
                Rp {totalValue.toLocaleString('id-ID')}
              </h3>
            </div>
            <div className="bg-emerald-500/10 text-emerald-400 p-3.5 rounded-xl">
              <DollarSign size={26} />
            </div>
          </div>
        </div>

        {/* Mobile Submenu Navigation */}
        <div className="flex md:hidden gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-2 text-center rounded-lg text-sm font-medium ${
              activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Katalog Stok
          </button>
          <button
            onClick={() => {
              setActiveTab('mutations');
              fetchMutations();
            }}
            className={`flex-1 py-2 text-center rounded-lg text-sm font-medium ${
              activeTab === 'mutations' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Log Mutasi
          </button>
        </div>

        {activeTab === 'inventory' ? (
          <>
            {/* Action Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama barang atau SKU..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={fetchProducts}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                  title="Refresh"
                >
                  <RefreshCw size={18} />
                </button>
                <button
                  onClick={openCreateModal}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20"
                >
                  <Plus size={18} />
                  Tambah Produk
                </button>
              </div>
            </div>

            {/* Table Inventory */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase text-xs tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-6">SKU</th>
                      <th className="py-4 px-6">Nama Produk</th>
                      <th className="py-4 px-6">Kategori</th>
                      <th className="py-4 px-6">Harga Unit</th>
                      <th className="py-4 px-6">Sisa Stok</th>
                      <th className="py-4 px-6 text-center">Mutasi Cepat</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          Tidak ada data produk ditemukan. Klik "Tambah Produk" untuk mulai.
                        </td>
                      </tr>
                    ) : (
                      products.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-4 px-6 font-mono font-medium text-blue-400">
                            {item.sku}
                          </td>
                          <td className="py-4 px-6 font-medium text-white">{item.name}</td>
                          <td className="py-4 px-6">
                            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                              {item.categoryName || 'Tanpa Kategori'}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-semibold">
                            Rp {item.price.toLocaleString('id-ID')}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              item.stockQuantity <= 5 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.stockQuantity <= 5 ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                              {item.stockQuantity} Unit
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => openMutationModal(item, 'StockIn')}
                                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium flex items-center gap-1"
                                title="Barang Masuk (Stock In)"
                              >
                                <ArrowDownRight size={13} /> + Masuk
                              </button>
                              <button
                                onClick={() => openMutationModal(item, 'StockOut')}
                                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium flex items-center gap-1"
                                title="Barang Keluar (Stock Out)"
                              >
                                <ArrowUpRight size={13} /> - Keluar
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            {user.role === 'Admin' && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                                title="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Tab Log Mutasi & Audit Trail */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="text-blue-400" size={22} />
                  Riwayat Mutasi & Audit Log Gudang
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">
                  Setiap pergerakan barang (In/Out/Adjustment) tercatat lengkap dengan penanggung jawab dan sisa stok.
                </p>
              </div>
              <button
                onClick={fetchMutations}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition"
                title="Refresh Log"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase text-xs tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-6">Waktu Transaksi</th>
                      <th className="py-4 px-6">Nama Produk</th>
                      <th className="py-4 px-6">Tipe Mutasi</th>
                      <th className="py-4 px-6">Perubahan</th>
                      <th className="py-4 px-6">Stok Sebelumnya $\rightarrow$ Akhir</th>
                      <th className="py-4 px-6">Petugas (User)</th>
                      <th className="py-4 px-6">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {mutations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          Belum ada riwayat mutasi stok. Lakukan transaksi "Masuk" atau "Keluar" pada katalog stok.
                        </td>
                      </tr>
                    ) : (
                      mutations.map((m) => {
                        const isPlus = m.quantityChanged > 0;
                        return (
                          <tr key={m.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                              {new Date(m.createdAt).toLocaleString('id-ID')}
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-medium text-white block">{m.productName}</span>
                              <span className="text-xs text-slate-500 font-mono">{m.productSKU}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                m.type === 'StockIn' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : m.type === 'StockOut'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : m.type === 'Damaged'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}>
                                {m.type}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-mono font-bold">
                              <span className={isPlus ? 'text-emerald-400' : 'text-rose-400'}>
                                {isPlus ? `+${m.quantityChanged}` : m.quantityChanged} Unit
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                              {m.previousStock} $\rightarrow$ <strong className="text-white">{m.currentStock}</strong>
                            </td>
                            <td className="py-4 px-6">
                              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">
                                {m.performedBy}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-slate-400 max-w-xs truncate">
                              {m.notes || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Dialog (Create & Edit Product) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-bold text-white">
                {editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru ke Gudang'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nama Barang
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Rak Pallet Heavy Duty"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    SKU / Kode Barang
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Jumlah Stok Awal
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog (Stock Mutation: Masuk / Keluar / Koreksi) */}
      {isMutationModalOpen && selectedProductForMutation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ArrowLeftRight size={18} className="text-blue-400" />
                  Catat Mutasi Stok Barang
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Produk: <strong className="text-white">{selectedProductForMutation.name}</strong> ({selectedProductForMutation.sku})
                </p>
              </div>
              <button
                onClick={() => setIsMutationModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleMutationSubmit} className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-sm">
                <span className="text-slate-400">Sisa Stok Saat Ini:</span>
                <span className="font-bold text-white text-base">{selectedProductForMutation.stockQuantity} Unit</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Tipe Mutasi
                </label>
                <select
                  value={mutationForm.type}
                  onChange={(e) => setMutationForm({ ...mutationForm, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="StockIn">Stock In (Barang Masuk dari Supplier / PO)</option>
                  <option value="StockOut">Stock Out (Barang Keluar / Penjualan)</option>
                  <option value="Adjustment">Adjustment (Koreksi Selisih Opname Fisik)</option>
                  <option value="Damaged">Damaged (Barang Rusak / Afkir)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Jumlah Kuantitas (Unit)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={mutationForm.quantity}
                  onChange={(e) => setMutationForm({ ...mutationForm, quantity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Catatan / Nomor Dokumen Ref
                </label>
                <input
                  type="text"
                  value={mutationForm.notes}
                  onChange={(e) => setMutationForm({ ...mutationForm, notes: e.target.value })}
                  placeholder="Contoh: PO-2026-009 / Delivery Order #45"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMutationModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition shadow-lg shadow-blue-600/30"
                >
                  Konfirmasi Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
