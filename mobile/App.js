import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  FlatList, SafeAreaView, ActivityIndicator, Alert, Modal, StatusBar 
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// Ganti IP dengan IP LAN komputermu saat run di HP fisik (misal http://192.168.1.X:5000/api)
const API_URL = 'http://10.0.2.2:5000/api'; // 10.0.2.2 untuk Android Emulator, localhost untuk web

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Login Form State
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('AdminPassword123!');

  // Barcode / Quick Mutation Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mutationQty, setMutationQty] = useState('1');
  const [mutationType, setMutationType] = useState('StockIn');
  const [simulatedBarcode, setSimulatedBarcode] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/auth/login`, {
        usernameOrEmail: username,
        password: password
      });
      setToken(res.data.token);
      setUser(res.data);
      fetchProducts(res.data.token);
    } catch (err) {
      Alert.alert('Login Gagal', err.response?.data?.message || 'Tidak dapat terhubung ke Backend API');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (authToken = token) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/products${search ? `?search=${search}` : ''}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScan = (scannedSku) => {
    const found = products.find(p => p.sku.toLowerCase() === scannedSku.trim().toLowerCase());
    if (found) {
      setSelectedProduct(found);
      setModalVisible(true);
    } else {
      Alert.alert('Barcode Tidak Dikenali', `Produk dengan SKU "${scannedSku}" tidak terdaftar di gudang.`);
    }
  };

  const submitMutation = async () => {
    if (!selectedProduct) return;
    try {
      setLoading(true);
      await axios.post(`${API_URL}/stockmutations`, {
        productId: selectedProduct.id,
        quantity: parseInt(mutationQty, 10),
        type: mutationType,
        notes: `Mobile Scanner by ${user?.username}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Berhasil', `Mutasi stok ${selectedProduct.name} telah tersimpan.`);
      setModalVisible(false);
      fetchProducts();
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.card}>
          <View style={styles.logoCircle}>
            <Ionicons name="cube-outline" size={44} color="#38bdf8" />
          </View>
          <Text style={styles.title}>Stockify Mobile</Text>
          <Text style={styles.subtitle}>Warehouse Floor & Scanner App</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#64748b"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Masuk ke Gudang</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Stockify Mobile</Text>
          <Text style={styles.headerUser}>Petugas: {user?.username} ({user?.role})</Text>
        </View>
        <TouchableOpacity onPress={() => setToken(null)} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#f87171" />
        </TouchableOpacity>
      </View>

      {/* Barcode Scanner Box Simulation */}
      <View style={styles.scanSection}>
        <View style={styles.scanInputWrap}>
          <Ionicons name="barcode-outline" size={24} color="#38bdf8" style={styles.scanIcon} />
          <TextInput
            style={styles.scanInput}
            placeholder="Scan Barcode / Ketik SKU..."
            placeholderTextColor="#64748b"
            value={simulatedBarcode}
            onChangeText={setSimulatedBarcode}
            onSubmitEditing={() => handleBarcodeScan(simulatedBarcode)}
          />
        </View>
        <TouchableOpacity style={styles.scanBtn} onPress={() => handleBarcodeScan(simulatedBarcode)}>
          <Text style={styles.scanBtnText}>Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={fetchProducts}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.productCard}
            onPress={() => {
              setSelectedProduct(item);
              setModalVisible(true);
            }}
          >
            <View style={styles.prodHeader}>
              <Text style={styles.skuText}>{item.sku}</Text>
              <View style={[styles.stockBadge, item.stockQuantity <= 5 ? styles.stockLow : styles.stockSafe]}>
                <Text style={styles.stockBadgeText}>{item.stockQuantity} Unit</Text>
              </View>
            </View>
            <Text style={styles.prodName}>{item.name}</Text>
            <Text style={styles.prodPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Quick Mutation Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mutasi Stok Gudang</Text>
            {selectedProduct && (
              <Text style={styles.modalSubtitle}>{selectedProduct.name} ({selectedProduct.sku})</Text>
            )}

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeBtn, mutationType === 'StockIn' && styles.typeBtnActive]}
                onPress={() => setMutationType('StockIn')}
              >
                <Text style={styles.typeBtnText}>+ Stock In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, mutationType === 'StockOut' && styles.typeBtnActiveOut]}
                onPress={() => setMutationType('StockOut')}
              >
                <Text style={styles.typeBtnText}>- Stock Out</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              placeholder="Jumlah Unit"
              placeholderTextColor="#64748b"
              value={mutationQty}
              onChangeText={setMutationQty}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={submitMutation}>
                <Text style={styles.confirmText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  loginContainer: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#0f172a', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  logoCircle: { alignSelf: 'center', backgroundColor: '#0369a120', padding: 18, borderRadius: 50, marginBottom: 14 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 24, marginTop: 4 },
  input: { backgroundColor: '#020617', color: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 14 },
  button: { backgroundColor: '#0284c7', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: '#1e293b', backgroundColor: '#0f172a' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerUser: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: '#f8717120', borderRadius: 10 },

  scanSection: { flexDirection: 'row', padding: 16, gap: 10, backgroundColor: '#0f172a', borderBottomWidth: 1, borderColor: '#1e293b' },
  scanInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10 },
  scanIcon: { marginRight: 6 },
  scanInput: { flex: 1, color: '#fff', paddingVertical: 10 },
  scanBtn: { backgroundColor: '#0284c7', paddingHorizontal: 18, justifyContent: 'center', borderRadius: 12 },
  scanBtnText: { color: '#fff', fontWeight: 'bold' },

  listContent: { padding: 16 },
  productCard: { backgroundColor: '#0f172a', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', marginBottom: 12 },
  prodHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  skuText: { color: '#38bdf8', fontFamily: 'monospace', fontWeight: 'bold' },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  stockSafe: { backgroundColor: '#10b98120' },
  stockLow: { backgroundColor: '#f43f5e20' },
  stockBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  prodName: { fontSize: 16, fontWeight: '600', color: '#f8fafc', marginBottom: 4 },
  prodPrice: { fontSize: 13, color: '#94a3b8' },

  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0f172a', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  modalSubtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 16, marginTop: 4 },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#1e293b', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#059669' },
  typeBtnActiveOut: { backgroundColor: '#d97706' },
  typeBtnText: { color: '#fff', fontWeight: 'bold' },
  modalInput: { backgroundColor: '#020617', color: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { padding: 12 },
  cancelText: { color: '#94a3b8' },
  confirmBtn: { backgroundColor: '#0284c7', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  confirmText: { color: '#fff', fontWeight: 'bold' }
});
