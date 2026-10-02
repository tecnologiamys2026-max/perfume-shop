'use client';
import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('productos');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Estados para Categorías, Marcas y Productos
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [newBrandName, setNewBrandName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  // Filtros de tabla
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterBrand, setFilterBrand] = useState('Todas');
  const [filterGender, setFilterGender] = useState('Todos');

  const [whatsapp, setWhatsapp] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [minStock, setMinStock] = useState(3);
  
  // Estados para POS y Pedidos
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [posSearch, setPosSearch] = useState('');
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // Filtros de fecha (Por defecto: 1 mes atrás hasta hoy)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Estado para modales personalizados
  const [modal, setModal] = useState({ isOpen: false, mode: '', type: '', id: null, name: '' });
  const [editingProduct, setEditingProduct] = useState(null);

  // Función para cargar datos iniciales
  const loadData = async () => {
    try {
      const resBrands = await fetch('/api/brands');
      const dataBrands = await resBrands.json();
      if (Array.isArray(dataBrands)) setBrands(dataBrands);

      const resCategories = await fetch('/api/categories');
      const dataCategories = await resCategories.json();
      if (Array.isArray(dataCategories)) setCategories(dataCategories);

      const resProducts = await fetch('/api/products');
      const dataProducts = await resProducts.json();
      if (Array.isArray(dataProducts)) setProducts(dataProducts);

      // Cargar configuración de la base de datos
      const resSettings = await fetch('/api/settings');
      const dataSettings = await resSettings.json();
      if (dataSettings && typeof dataSettings === 'object') {
        if (dataSettings.whatsapp) setWhatsapp(dataSettings.whatsapp);
        if (dataSettings.currency) setCurrency(dataSettings.currency);
        if (dataSettings.minStock) setMinStock(parseInt(dataSettings.minStock));
      }

      // Cargar Pedidos
      const resOrders = await fetch('/api/orders');
      const dataOrders = await resOrders.json();
      if (Array.isArray(dataOrders)) setOrders(dataOrders);

    } catch (error) {
      toast.error('Error al conectar con la base de datos');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      setIsAuthenticated(true);
      toast.success('Bienvenido al panel');
    } else {
      toast.error('Credenciales incorrectas');
    }
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!newBrandName) return;
    setLoading(true);
    try {
      await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBrandName })
      });
      setNewBrandName('');
      loadData();
      toast.success('Marca guardada exitosamente');
    } catch (error) {
      toast.error('Error al guardar la marca');
    }
    setLoading(false);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    setLoading(true);
    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      setNewCategoryName('');
      loadData();
      toast.success('Categoría guardada exitosamente');
    } catch (error) {
      toast.error('Error al guardar la categoría');
    }
    setLoading(false);
  };

  const handleDeleteClick = (type, id) => {
    setModal({ isOpen: true, mode: 'delete', type, id, name: '' });
  };

  const handleEditClick = (type, id, currentName) => {
    if (type === 'producto') {
      const p = products.find(prod => prod.id === id);
      setEditingProduct(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setModal({ isOpen: true, mode: 'edit', type, id, name: currentName });
    }
  };

  const confirmDelete = async () => {
    const { type, id } = modal;
    setModal({ ...modal, isOpen: false });
    toast.loading('Eliminando...', { id: 'deleteToast' });
    try {
      const endpoint = type === 'marca' ? '/api/brands' : type === 'categoria' ? '/api/categories' : '/api/products';
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar');
      }

      loadData();
      toast.success('Eliminado correctamente', { id: 'deleteToast' });
    } catch (error) {
      toast.error(error.message, { id: 'deleteToast', duration: 4000 });
    }
  };

  const confirmEdit = async () => {
    const { type, id, name } = modal;
    if (!name.trim()) return;
    setModal({ ...modal, isOpen: false });
    toast.loading('Actualizando...', { id: 'editToast' });
    
    try {
      const endpoint = type === 'marca' ? '/api/brands' : type === 'categoria' ? '/api/categories' : '/api/products';
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      loadData();
      toast.success('Actualizado correctamente', { id: 'editToast' });
    } catch (error) {
      toast.error('Error al actualizar', { id: 'editToast' });
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    if (editingProduct) {
      formData.append('id', editingProduct.id);
    }
    
    // Validación básica
    if (!formData.get('name') || !formData.get('price') || !formData.get('categoryId') || !formData.get('brandId')) {
      toast.error('Por favor, llena los campos obligatorios');
      return;
    }
    
    toast.loading(editingProduct ? 'Actualizando producto...' : 'Guardando producto...', { id: 'saveProduct' });
    try {
      const res = await fetch('/api/products', {
        method: editingProduct ? 'PUT' : 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(editingProduct ? 'Producto actualizado correctamente' : 'Producto guardado correctamente', { id: 'saveProduct' });
      form.reset(); // Limpiar el formulario
      setEditingProduct(null);
      loadData(); // Recargar productos
    } catch (error) {
      toast.error(error.message || 'Error al guardar', { id: 'saveProduct' });
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    toast.loading('Guardando configuración...', { id: 'saveConfig' });
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp, currency, minStock: minStock.toString() })
      });
      if (!response.ok) throw new Error();
      toast.success('Configuración global actualizada', { id: 'saveConfig' });
    } catch (error) {
      toast.error('Error al guardar', { id: 'saveConfig' });
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error('No hay stock de este producto');
      return;
    }
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('No hay más stock disponible');
        return;
      }
      setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { productId: product.id, name: product.name, price: parseFloat(product.price), quantity: 1 }]);
    }
  };

  const loadPendingOrder = (order) => {
    setCustomerName(order.customerName === "Cliente WhatsApp" ? "" : order.customerName || '');
    setCustomerPhone(order.customerPhone || '');
    setPaymentMethod(order.paymentMethod === "POR ACORDAR" ? "EFECTIVO" : order.paymentMethod || 'EFECTIVO');
    setEditingOrderId(order.id);
    setCart(order.items.map(i => ({ productId: i.productId, name: i.product?.name, price: parseFloat(i.price), quantity: i.quantity })));
    toast.success('Pedido cargado para editar');
  };

  // --- Estadísticas y Filtros ---
  const filteredOrders = orders.filter(o => {
    if (!startDate || !endDate) return true;
    const d = new Date(o.createdAt);
    
    // Evitar problemas de zona horaria parseando como local
    const [yearStart, monthStart, dayStart] = startDate.split('-');
    const start = new Date(yearStart, monthStart - 1, dayStart, 0, 0, 0, 0);
    
    const [yearEnd, monthEnd, dayEnd] = endDate.split('-');
    const end = new Date(yearEnd, monthEnd - 1, dayEnd, 23, 59, 59, 999);
    
    return d >= start && d <= end;
  });

  const completedOrders = filteredOrders.filter(o => o.status === 'COMPLETED');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
  
  // Agrupar ventas por fecha para el gráfico
  const salesByDate = completedOrders.reduce((acc, order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    if (!acc[date]) acc[date] = { date, Ventas: 0 };
    acc[date].Ventas += parseFloat(order.totalAmount);
    return acc;
  }, {});
  const chartData = Object.values(salesByDate);

  // Productos más vendidos
  const productSalesMap = {};
  completedOrders.forEach(order => {
    order.items?.forEach(item => {
      const pId = item.productId;
      if (!productSalesMap[pId]) productSalesMap[pId] = { name: item.product?.name, quantity: 0, revenue: 0 };
      productSalesMap[pId].quantity += item.quantity;
      productSalesMap[pId].revenue += item.quantity * parseFloat(item.price);
    });
  });
  const topProducts = Object.values(productSalesMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('El carrito está vacío');
    toast.loading('Procesando venta...', { id: 'checkout' });
    try {
      let response;
      if (editingOrderId) {
        response = await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingOrderId, status: 'COMPLETED', customerName, customerPhone, paymentMethod, items: cart })
        });
      } else {
        response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerName, customerPhone, paymentMethod, items: cart })
        });
      }

      if (!response.ok) throw new Error();
      toast.success('Venta registrada con éxito', { id: 'checkout' });
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setEditingOrderId(null);
      loadData(); 
    } catch (error) {
      toast.error('Error al procesar la venta', { id: 'checkout' });
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleUpdateOrder = async (id, status) => {
    toast.loading('Actualizando pedido...', { id: 'updateOrder' });
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (!response.ok) throw new Error();
      toast.success('Pedido actualizado', { id: 'updateOrder' });
      loadData();
    } catch (error) {
      toast.error('Error al actualizar', { id: 'updateOrder' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FBFA' }}>
        <Toaster position="top-right" />
        <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#2C3E50' }}>Acceso Seguro<br/><span style={{fontSize: '1rem', color: '#66A5AD'}}>Mayra Shop</span></h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Usuario</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <button type="submit" style={{ background: '#66A5AD', color: 'white', padding: '1rem', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>
              Ingresar al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <Toaster position="top-right" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo.jpg" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #d4af37' }} />
          <h2 style={{ color: '#1a1a1a', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Panel de Administración</h2>
        </div>
        <button onClick={() => setIsAuthenticated(false)} style={{ background: 'none', border: 'none', color: '#e74c3c', fontWeight: 'bold', cursor: 'pointer' }}>Cerrar Sesión</button>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('productos')} style={{ padding: '0.8rem 1.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: activeTab === 'productos' ? '#1a1a1a' : '#f0f0f0', color: activeTab === 'productos' ? '#d4af37' : '#333', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Productos</button>
        <button onClick={() => setActiveTab('pos')} style={{ padding: '0.8rem 1.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: activeTab === 'pos' ? '#1a1a1a' : '#f0f0f0', color: activeTab === 'pos' ? '#d4af37' : '#333', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>POS</button>
        <button onClick={() => setActiveTab('pedidos')} style={{ padding: '0.8rem 1.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: activeTab === 'pedidos' ? '#1a1a1a' : '#f0f0f0', color: activeTab === 'pedidos' ? '#d4af37' : '#333', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Pedidos</button>
        <button onClick={() => setActiveTab('dashboard')} style={{ padding: '0.8rem 1.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: activeTab === 'dashboard' ? '#1a1a1a' : '#f0f0f0', color: activeTab === 'dashboard' ? '#d4af37' : '#333', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Reportes</button>
        <button onClick={() => setActiveTab('marcas')} style={{ padding: '0.8rem 1.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: activeTab === 'marcas' ? '#1a1a1a' : '#f0f0f0', color: activeTab === 'marcas' ? '#d4af37' : '#333', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Categorías</button>
        <button onClick={() => setActiveTab('config')} style={{ padding: '0.8rem 1.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: activeTab === 'config' ? '#1a1a1a' : '#f0f0f0', color: activeTab === 'config' ? '#d4af37' : '#333', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Config</button>
      </div>

      {/* Filtros de Fecha Globales para Pedidos y Dashboard */}
      {(activeTab === 'dashboard' || activeTab === 'pedidos') && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.8rem', color: '#7f8c8d', fontWeight: 'bold', marginBottom: '0.3rem' }}>FECHA INICIAL</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.8rem', color: '#7f8c8d', fontWeight: 'bold', marginBottom: '0.3rem' }}>FECHA FINAL</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} />
          </div>
        </div>
      )}

      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        
        {activeTab === 'productos' && (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>{editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h3>
            <form key={editingProduct ? editingProduct.id : 'new'} onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem', borderBottom: '1px solid #eee', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Nombre del Producto *</label>
                  <input name="name" type="text" defaultValue={editingProduct?.name || ''} placeholder="Ej. Aqua Di Gio" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Imagen (Archivo)</label>
                  <input name="image" type="file" accept="image/*" style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Precio de Venta *</label>
                  <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price || ''} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Precio de Costo</label>
                  <input name="costPrice" type="number" step="0.01" defaultValue={editingProduct?.costPrice || ''} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Stock Inicial</label>
                  <input name="stock" type="number" defaultValue={editingProduct?.stock || ''} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Género</label>
                  <select name="gender" defaultValue={editingProduct?.gender || 'Damas'} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}>
                    <option value="Damas">Damas</option>
                    <option value="Caballeros">Caballeros</option>
                    <option value="Unisex">Unisex</option>
                    <option value="Infantil">Infantil</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Categoría *</label>
                  <select name="categoryId" defaultValue={editingProduct?.categoryId || ''} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} required>
                    <option value="">Selecciona una categoría...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Marca *</label>
                  <select name="brandId" defaultValue={editingProduct?.brandId || ''} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} required>
                    <option value="">Selecciona una marca...</option>
                    {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500', cursor: 'pointer' }}>
                  <input name="isAvailable" type="checkbox" value="true" defaultChecked={editingProduct ? editingProduct.isAvailable : true} style={{ width: '18px', height: '18px' }} />
                  Disponible para la venta
                </label>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" style={{ flex: 1, background: '#B2D8D8', padding: '1rem', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
                {editingProduct && (
                  <button type="button" onClick={() => setEditingProduct(null)} style={{ background: '#eee', padding: '1rem', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <h3 style={{ marginBottom: '1rem' }}>Lista de Productos</h3>
            
            {/* Filtros de la tabla */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white' }}
              >
                <option value="Todas">Todas las Categorías</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>

              <select 
                value={filterBrand} 
                onChange={(e) => setFilterBrand(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white' }}
              >
                <option value="Todas">Todas las Marcas</option>
                {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>

              <select 
                value={filterGender} 
                onChange={(e) => setFilterGender(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white' }}
              >
                <option value="Todos">Todos los Géneros</option>
                <option value="Damas">Damas</option>
                <option value="Caballeros">Caballeros</option>
                <option value="Unisex">Unisex</option>
                <option value="Infantil">Infantil</option>
              </select>
            </div>
            {products.length === 0 ? (
               <p style={{ color: '#888', marginBottom: '1rem' }}>Aún no hay productos reales. Al guardar uno, aparecerá aquí.</p>
            ) : (
              <div style={{ border: '1px solid #eee', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '600px', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f9f9f9' }}>
                    <tr>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Foto</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Nombre</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Marca</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Precio Venta</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Precio Costo</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Stock</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Estado</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => {
                      const matchCategory = filterCategory === 'Todas' || String(p.categoryId) === String(filterCategory);
                      const matchBrand = filterBrand === 'Todas' || String(p.brandId) === String(filterBrand);
                      const matchGender = filterGender === 'Todos' || p.gender === filterGender;
                      return matchCategory && matchBrand && matchGender;
                    }).map(p => (
                      <tr key={p.id}>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', background: '#ccc', borderRadius: '4px' }}></div>
                          )}
                        </td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{p.name}</td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{p.brand?.name}</td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>${parseFloat(p.price).toFixed(2)}</td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>${parseFloat(p.costPrice || 0).toFixed(2)}</td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                          <span style={{ fontWeight: 'bold', color: p.stock > 5 ? '#2e7d32' : p.stock > 0 ? '#f39c12' : '#e74c3c' }}>
                            {p.stock || 0}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                          <span style={{ padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', background: p.isAvailable ? '#e8f5e9' : '#f5f5f5', color: p.isAvailable ? '#2e7d32' : '#757575' }}>
                            {p.isAvailable ? 'Activo' : 'Oculto'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                          <button onClick={() => handleEditClick('producto', p.id, p.name)} style={{ color: '#3498db', background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>Editar</button>
                          <button onClick={() => handleDeleteClick('producto', p.id)} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'marcas' && (
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '1rem' }}>Crear Nueva Marca</h3>
              <form onSubmit={handleSaveBrand} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <input type="text" value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="Nombre" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
                <button disabled={loading} type="submit" style={{ background: '#66A5AD', color: 'white', padding: '0.8rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Guardar</button>
              </form>
              <h4>Marcas Existentes</h4>
              <ul style={{ listStyle: 'none', marginTop: '1rem', border: '1px solid #eee', borderRadius: '8px', padding: '1rem' }}>
                {brands.length === 0 ? <li style={{ color: '#888' }}>No hay marcas creadas</li> : null}
                {brands.map(brand => (
                  <li key={brand.id} style={{ padding: '0.8rem 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {brand.name} 
                    <div>
                      <button onClick={() => handleEditClick('marca', brand.id, brand.name)} style={{ color: '#3498db', background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>Editar</button>
                      <button onClick={() => handleDeleteClick('marca', brand.id)} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '1rem' }}>Crear Nueva Categoría</h3>
              <form onSubmit={handleSaveCategory} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nombre" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
                <button disabled={loading} type="submit" style={{ background: '#66A5AD', color: 'white', padding: '0.8rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Guardar</button>
              </form>
              <h4>Categorías Existentes</h4>
              <ul style={{ listStyle: 'none', marginTop: '1rem', border: '1px solid #eee', borderRadius: '8px', padding: '1rem' }}>
                {categories.length === 0 ? <li style={{ color: '#888' }}>No hay categorías creadas</li> : null}
                {categories.map(category => (
                  <li key={category.id} style={{ padding: '0.8rem 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {category.name}
                    <div>
                      <button onClick={() => handleEditClick('categoria', category.id, category.name)} style={{ color: '#3498db', background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>Editar</button>
                      <button onClick={() => handleDeleteClick('categoria', category.id)} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'pos' && (
          <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
            {/* Pedidos Pendientes de WhatsApp (Movemos esto al principio del POS) */}
            {orders.filter(o => o.status === 'PENDING').length > 0 && (
              <div style={{ background: '#e0f7fa', padding: '1rem', borderRadius: '12px', border: '1px solid #bce8f1' }}>
                <h3 style={{ marginBottom: '1rem', color: '#00796b' }}>🔔 Pedidos Pendientes de WhatsApp</h3>
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {orders.filter(o => o.status === 'PENDING').map(o => (
                    <div key={o.id} style={{ background: 'white', padding: '1rem', borderRadius: '8px', minWidth: '250px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                      <p style={{ margin: '0 0 0.5rem', fontWeight: 'bold' }}>Pedido #{o.id}</p>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#666' }}>{o.items?.length} productos (${parseFloat(o.totalAmount).toFixed(2)})</p>
                      <button onClick={() => loadPendingOrder(o)} style={{ width: '100%', padding: '0.5rem', background: '#00796b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cargar al Carrito</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '2rem' }}>
              {/* Lista de productos para vender */}
              <div style={{ flex: 2 }}>
                <h3 style={{ marginBottom: '1rem' }}>Catálogo de Productos</h3>
                <input 
                  type="text" 
                placeholder="🔍 Buscar producto en el catálogo..." 
                value={posSearch}
                onChange={(e) => setPosSearch(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '1rem' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {products.filter(p => p.isAvailable && p.name.toLowerCase().includes(posSearch.toLowerCase())).map(p => (
                  <div key={p.id} onClick={() => addToCart(p)} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem', cursor: p.stock > 0 ? 'pointer' : 'not-allowed', background: 'white', opacity: p.stock > 0 ? 1 : 0.5, textAlign: 'center', transition: 'transform 0.2s' }}>
                    <img src={p.imageUrl || '/logo.jpg'} alt={p.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }} />
                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{p.name}</h4>
                    <p style={{ margin: '0.5rem 0', fontWeight: 'bold', color: '#66A5AD' }}>${parseFloat(p.price).toFixed(2)}</p>
                    <p style={{ fontSize: '0.8rem', color: p.stock > 5 ? '#2e7d32' : p.stock > 0 ? '#f39c12' : '#e74c3c', margin: 0 }}>Stock: {p.stock || 0}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Carrito de Compras (Factura) */}
            <div style={{ flex: 1, background: '#f9f9f9', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee', alignSelf: 'start', position: 'sticky', top: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #66A5AD', paddingBottom: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>{editingOrderId ? `Editando Pedido #${editingOrderId}` : 'Nueva Factura'}</h3>
                {editingOrderId && (
                  <button onClick={() => { setEditingOrderId(null); setCart([]); setCustomerName(''); setCustomerPhone(''); }} style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar Edición</button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <input type="text" placeholder="Nombre del Cliente (Opcional)" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                <input type="text" placeholder="Teléfono (Opcional)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="TRANSFERENCIA">Transferencia / Zelle</option>
                </select>
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
                {cart.length === 0 ? <p style={{ color: '#888', textAlign: 'center' }}>Carrito vacío</p> : (
                  cart.map(item => (
                    <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', background: 'white', padding: '0.8rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name}</p>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>${item.price.toFixed(2)} x {item.quantity}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold' }}>${(item.price * item.quantity).toFixed(2)}</span>
                        <button onClick={() => setCart(cart.filter(c => c.productId !== item.productId))} style={{ background: '#ffcccc', color: '#e74c3c', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>X</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', borderTop: '2px dashed #ccc', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                <span>TOTAL:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>

              <button onClick={handleCheckout} disabled={cart.length === 0} style={{ width: '100%', background: cart.length > 0 ? '#2C3E50' : '#ccc', color: 'white', padding: '1rem', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: cart.length > 0 ? 'pointer' : 'not-allowed', fontSize: '1.1rem' }}>
                {editingOrderId ? 'Guardar y Facturar' : 'Procesar Venta'}
              </button>
            </div>
          </div>
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Alertas de Stock */}
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#e74c3c' }}>⚠️ Alertas de Stock Bajo (Min: {minStock})</h3>
              <div style={{ background: '#fff', border: '1px solid #ffcccc', borderRadius: '8px', padding: '1rem' }}>
                {products.filter(p => p.stock <= minStock).length === 0 ? (
                  <p style={{ color: '#2e7d32', margin: 0 }}>Todos los productos tienen buen inventario.</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {products.filter(p => p.stock <= minStock).map(p => (
                      <li key={p.id} style={{ padding: '0.8rem 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img src={p.imageUrl || '/logo.jpg'} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                          <span><strong>{p.name}</strong> ({p.brand?.name})</span>
                        </div>
                        <span style={{ background: p.stock === 0 ? '#e74c3c' : '#f39c12', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold' }}>Quedan: {p.stock}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Historial de Pedidos */}
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#2C3E50' }}>📄 Historial de Ventas</h3>
              <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #eee', borderRadius: '8px' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f9f9f9' }}>
                    <tr>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>ID</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Fecha</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Total</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.filter(o => o.status !== 'PENDING').length === 0 ? (
                      <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>No hay ventas registradas en estas fechas.</td></tr>
                    ) : (
                      filteredOrders.filter(o => o.status !== 'PENDING').map(o => (
                        <tr key={o.id}>
                          <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>#{o.id}</td>
                          <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>${parseFloat(o.totalAmount).toFixed(2)}</td>
                          <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                            <span style={{ background: o.status === 'COMPLETED' ? '#e8f5e9' : '#ffebee', color: o.status === 'COMPLETED' ? '#2e7d32' : '#c62828', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'inline-block', marginBottom: '0.5rem' }}>
                              {o.status === 'COMPLETED' ? 'Completado' : 'Cancelado'}
                            </span>
                            {o.status === 'COMPLETED' && (
                              <button onClick={() => setInvoiceOrder(o)} style={{ display: 'block', background: '#34495e', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>🖨️ Ver Factura</button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h3 style={{ margin: 0, color: '#2C3E50' }}>📊 Dashboard y Estadísticas</h3>
            
            {/* Tarjetas de Resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: '5px solid #27ae60' }}>
                <p style={{ margin: '0 0 0.5rem', color: '#7f8c8d', fontWeight: 'bold' }}>VENTAS TOTALES</p>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>${totalRevenue.toFixed(2)}</h2>
              </div>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: '5px solid #3498db' }}>
                <p style={{ margin: '0 0 0.5rem', color: '#7f8c8d', fontWeight: 'bold' }}>PEDIDOS COMPLETADOS</p>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>{completedOrders.length}</h2>
              </div>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: '5px solid #9b59b6' }}>
                <p style={{ margin: '0 0 0.5rem', color: '#7f8c8d', fontWeight: 'bold' }}>TICKET PROMEDIO</p>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>${completedOrders.length > 0 ? (totalRevenue / completedOrders.length).toFixed(2) : '0.00'}</h2>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {/* Gráfico de Ventas (CSS Puro para evitar errores) */}
              <div style={{ flex: '1 1 500px', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h4 style={{ margin: '0 0 1.5rem', color: '#2c3e50' }}>Ingresos por Fecha</h4>
                {chartData.length === 0 ? (
                  <p style={{ color: '#888' }}>No hay ventas registradas aún.</p>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '250px', paddingBottom: '0.5rem', borderBottom: '1px solid #eee', overflowX: 'auto' }}>
                    {chartData.map((data, index) => {
                      const maxRevenue = Math.max(...chartData.map(d => d.Ventas));
                      const heightPercent = maxRevenue > 0 ? (data.Ventas / maxRevenue) * 100 : 0;
                      return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '50px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold' }}>${data.Ventas.toFixed(0)}</span>
                          <div style={{ width: '100%', maxWidth: '40px', height: `${Math.max(heightPercent, 5)}%`, background: '#66A5AD', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }}></div>
                          <span style={{ fontSize: '0.75rem', color: '#888', whiteSpace: 'nowrap' }}>{data.date.substring(0, 5)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Productos Más Vendidos */}
              <div style={{ flex: '1 1 300px', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h4 style={{ margin: '0 0 1.5rem', color: '#2c3e50' }}>Top 5 Productos Más Vendidos</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {topProducts.map((p, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid #eee' }}>
                      <span><strong>{i+1}.</strong> {p.name}</span>
                      <span style={{ background: '#f8f9fa', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem' }}>{p.quantity} vendidos</span>
                    </li>
                  ))}
                  {topProducts.length === 0 && <p style={{ color: '#888' }}>No hay suficientes datos aún.</p>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div>
            <h3 style={{ marginBottom: '1.5rem' }}>Configuración de la Tienda</h3>
            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Número de WhatsApp de Ventas</label>
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Asegúrate de incluir el código de país, ej. +58 o +1.</p>
                <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej. +584141234567" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Alerta de Stock Mínimo</label>
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Cantidad mínima en inventario antes de mostrar alerta.</p>
                <input type="number" value={minStock} onChange={(e) => setMinStock(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Moneda Principal</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}>
                  <option value="USD">Dólar Estadounidense (USD $)</option>
                  <option value="VES">Bolívar Venezolano (VES Bs)</option>
                  <option value="DOP">Peso Dominicano (DOP RD$)</option>
                  <option value="EUR">Euro (EUR €)</option>
                  <option value="COP">Peso Colombiano (COP $)</option>
                  <option value="MXN">Peso Mexicano (MXN $)</option>
                </select>
              </div>
              <button type="submit" style={{ background: '#66A5AD', color: 'white', padding: '1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Configuración Global</button>
            </form>
          </div>
        )}


      </div>

      {/* MODAL PERSONALIZADO */}
      {modal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 15px 30px rgba(0,0,0,0.2)' }}>
            
            {modal.mode === 'delete' && (
              <>
                <h3 style={{ marginBottom: '1rem', color: '#e74c3c' }}>Confirmar Eliminación</h3>
                <p style={{ marginBottom: '2rem', color: '#666' }}>¿Estás totalmente seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button onClick={() => setModal({ ...modal, isOpen: false })} style={{ padding: '0.8rem 1.5rem', border: 'none', background: '#eee', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={confirmDelete} style={{ padding: '0.8rem 1.5rem', border: 'none', background: '#e74c3c', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Eliminar</button>
                </div>
              </>
            )}

            {modal.mode === 'edit' && (
              <>
                <h3 style={{ marginBottom: '1rem', color: '#3498db' }}>Editar {modal.type === 'marca' ? 'Marca' : 'Categoría'}</h3>
                <input 
                  type="text" 
                  value={modal.name} 
                  onChange={(e) => setModal({ ...modal, name: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '2rem' }}
                  autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button onClick={() => setModal({ ...modal, isOpen: false })} style={{ padding: '0.8rem 1.5rem', border: 'none', background: '#eee', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={confirmEdit} style={{ padding: '0.8rem 1.5rem', border: 'none', background: '#3498db', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Cambios</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* Modal Factura */}
      {invoiceOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 5px 20px rgba(0,0,0,0.2)' }}>
            <div id="invoice-print-area" style={{ fontFamily: 'monospace', color: 'black' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>TIENDA MAYRA</h2>
                <p style={{ margin: 0 }}>RIF: J-00000000</p>
                <p style={{ margin: 0 }}>Tel: {whatsapp}</p>
                <p style={{ margin: '1rem 0 0', fontWeight: 'bold' }}>FACTURA #{invoiceOrder.id}</p>
                <p style={{ margin: 0 }}>Fecha: {new Date(invoiceOrder.createdAt).toLocaleString()}</p>
              </div>
              <div style={{ borderBottom: '1px dashed #333', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <p style={{ margin: 0 }}>Cliente: {invoiceOrder.customerName || 'Consumidor Final'}</p>
                {invoiceOrder.customerPhone && <p style={{ margin: 0 }}>Teléfono: {invoiceOrder.customerPhone}</p>}
                <p style={{ margin: 0 }}>Pago: {invoiceOrder.paymentMethod}</p>
              </div>
              <table style={{ width: '100%', textAlign: 'left', marginBottom: '1rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed #333' }}>
                    <th style={{ paddingBottom: '0.5rem' }}>Cant</th>
                    <th style={{ paddingBottom: '0.5rem' }}>Desc</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceOrder.items?.map(item => (
                    <tr key={item.id}>
                      <td style={{ paddingTop: '0.5rem' }}>{item.quantity}</td>
                      <td style={{ paddingTop: '0.5rem' }}>{item.product?.name}</td>
                      <td style={{ paddingTop: '0.5rem', textAlign: 'right' }}>${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderTop: '1px dashed #333', paddingTop: '1rem', textAlign: 'right' }}>
                <h3 style={{ margin: 0 }}>TOTAL: ${(parseFloat(invoiceOrder.totalAmount)).toFixed(2)}</h3>
              </div>
              <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>¡Gracias por su compra!</p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }} className="no-print">
              <button onClick={() => {
                const printContent = document.getElementById('invoice-print-area').innerHTML;
                const originalContent = document.body.innerHTML;
                document.body.innerHTML = printContent;
                window.print();
                document.body.innerHTML = originalContent;
                window.location.reload();
              }} style={{ flex: 1, background: '#2C3E50', color: 'white', padding: '0.8rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Imprimir</button>
              <button onClick={() => setInvoiceOrder(null)} style={{ flex: 1, background: '#ccc', color: 'black', padding: '0.8rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
