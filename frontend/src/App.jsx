import React, { useState, useEffect } from 'react';
import api from './services/api';
import AuthModal from './components/AuthModal';
import { 
  Package, Plus, Search, Trash2, Edit2, LogOut, 
  Layers, DollarSign, Box, ShieldCheck, RefreshCw, X,
  ArrowDownRight, ArrowUpRight, History, ArrowLeftRight, Users, UserPlus, Key
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'mutations' | 'users'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mutations, setMutations] = useState([]);
  const [usersList, setUsersList] = useState([]);
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

  // Modal Mutation State
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [selectedProductForMutation, setSelectedProductForMutation] = useState(null);
  const [mutationForm, setMutationForm] = useState({
    type: 'StockIn',
    quantity: 1,
    notes: ''
  });

  // Modal User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Staff'
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
      if (activeTab === 'inventory') {
        fetchProducts();
        fetchCategories();
      } else if (activeTab === 'mutations') {
        fetchMutations();
      } else if (activeTab === 'users' && user.role === 'Admin') {
        fetchUsers();
      }
    }
  }, [user, search, activeTab]);

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
      console.error('Gagal mengambil mutasi', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsersList(res.data);
    } catch (err) {
      console.error('Gagal mengambil daftar user', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Product Actions
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
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus produk.');
    }
  };

  // User Management Actions
  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserForm({ username: '', email: '', password: '', role: 'Staff' });
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (u) => {
    setEditingUser(u);
    setUserForm({ username: u.username, email: u.email, password: '', role: u.role });
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          email: userForm.email,
          role: userForm.role,
          password: userForm.password ? userForm.password : null
        });
      } else {
        await api.post('/users', userForm);
      }

      setIsUserModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data user.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Yakin ingin menghapus user ini?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus user.');
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
              Stockify <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">v1.3</span>
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
            onClick={() => setActiveTab('mutations')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              activeTab === 'mutations' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History size={16} />
            Log Mutasi
          </button>
          {user.role === 'Admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users size={16} />
              Kelola User
            </button>
          )}
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

        {/* Tab Content: Inventory */}
        {activeTab === 'inventory' && (
          <>
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
                          Tidak ada data produk ditemukan.
                        </td>
                      </tr>
                    ) : (
                      products.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-4 px-6 font-mono font-medium text-blue-400">{item.sku}</td>
                          <td className="py-4 px-6 font-medium text-white">{item.name}</td>
                          <td className="py-4 px-6">
                            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                              {item.categoryName || 'Tanpa Kategori'}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-semibold">Rp {item.price.toLocaleString('id-ID')}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              item.stockQuantity <= 5 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
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
                              >
                                <ArrowDownRight size={13} /> + Masuk
                              </button>
                              <button
                                onClick={() => openMutationModal(item, 'StockOut')}
                                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium flex items-center gap-1"
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
        )}

        {/* Tab Content: Mutations */}
        {activeTab === 'mutations' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="text-blue-400" size={22} />
              Riwayat Mutasi & Audit Log Gudang
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase text-xs tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Waktu Transaksi</th>
                    <th className="py-4 px-6">Nama Produk</th>
                    <th className="py-4 px-6">Tipe</th>
                    <th className="py-4 px-6">Perubahan</th>
                    <th className="py-4 px-6">Sebelum $\rightarrow$ Akhir</th>
                    <th className="py-4 px-6">Petugas</th>
                    <th className="py-4 px-6">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {mutations.map((m) => {
                    const isPlus = m.quantityChanged > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-6 text-xs text-slate-400 font-mono">{new Date(m.createdAt).toLocaleString('id-ID')}</td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-white block">{m.productName}</span>
                          <span className="text-xs text-slate-500 font-mono">{m.productSKU}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700">{m.type}</span>
                        </td>
                        <td className="py-4 px-6 font-mono font-bold">
                          <span className={isPlus ? 'text-emerald-400' : 'text-rose-400'}>
                            {isPlus ? `+${m.quantityChanged}` : m.quantityChanged} Unit
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-mono text-xs">{m.previousStock} $\rightarrow$ <strong className="text-white">{m.currentStock}</strong></td>
                        <td className="py-4 px-6"><span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">{m.performedBy}</span></td>
                        <td className="py-4 px-6 text-xs text-slate-400 max-w-xs truncate">{m.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: User Management (Admin Only) */}
        {activeTab === 'users' && user.role === 'Admin' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="text-blue-400" size={22} />
                  Manajemen Akun & Petugas Gudang
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">Kelola hak akses role (Admin vs Staff) dan kredensial pengguna.</p>
              </div>
              <button
                onClick={openCreateUserModal}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20"
              >
                <UserPlus size={18} />
                Tambah User Baru
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase text-xs tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">Username</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Role Akses</th>
                    <th className="py-4 px-6">Tanggal Terdaftar</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-4 px-6 font-mono text-slate-400">{u.id}</td>
                      <td className="py-4 px-6 font-medium text-white">{u.username}</td>
                      <td className="py-4 px-6 text-slate-300">{u.email}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'Admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400 font-mono">{new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => openEditUserModal(u)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"
                          title="Edit User"
                        >
                          <Edit2 size={16} />
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                            title="Hapus User"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Dialog: Product Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-bold text-white">{editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nama Barang</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">SKU</label>
                  <input type="text" required value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Kategori</label>
                  <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Harga (Rp)</label>
                  <input type="number" required min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Stok Awal</label>
                  <input type="number" required min="0" value={formData.stockQuantity} onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400">Batal</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog: Mutation Form */}
      {isMutationModalOpen && selectedProductForMutation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><ArrowLeftRight size={18} className="text-blue-400" /> Mutasi Stok</h3>
              <button onClick={() => setIsMutationModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleMutationSubmit} className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-sm">
                <span className="text-slate-400">Sisa Stok:</span>
                <span className="font-bold text-white">{selectedProductForMutation.stockQuantity} Unit</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tipe Mutasi</label>
                <select value={mutationForm.type} onChange={(e) => setMutationForm({ ...mutationForm, type: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm">
                  <option value="StockIn">Stock In (+ Barang Masuk)</option>
                  <option value="StockOut">Stock Out (- Barang Keluar)</option>
                  <option value="Adjustment">Adjustment (Koreksi Opname)</option>
                  <option value="Damaged">Damaged (Barang Rusak)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Kuantitas</label>
                <input type="number" required min="1" value={mutationForm.quantity} onChange={(e) => setMutationForm({ ...mutationForm, quantity: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Catatan</label>
                <input type="text" value={mutationForm.notes} onChange={(e) => setMutationForm({ ...mutationForm, notes: e.target.value })} placeholder="Nomor PO / Ref" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsMutationModalOpen(false)} className="px-4 py-2 text-slate-400">Batal</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl font-medium">Konfirmasi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog: User Management Form (Create / Edit) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-blue-400" />
                {editingUser ? 'Edit Akun Petugas' : 'Tambah Petugas Baru'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Role Akses</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="Staff">Staff (Katalog & Mutasi Stok)</option>
                  <option value="Admin">Admin (Full Control, Hapus & User)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {editingUser ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-slate-400">Batal</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl font-medium">Simpan User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
