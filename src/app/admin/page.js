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
  const [productSearch, setProductSearch] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'table'

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

  // Formato de precio según moneda seleccionada
  const formatPrice = (price) => {
    const symbol = currency === 'VES' ? 'Bs ' : currency === 'DOP' ? 'RD$ ' : currency === 'EUR' ? '€ ' : '$ ';
    return `${symbol}${parseFloat(price || 0).toFixed(2)}`;
  };

  // Función para cargar datos iniciales
  const loadData = async () => {
    try {
      const [resBrands, resCategories, resProducts, resSettings, resOrders] = await Promise.all([
        fetch('/api/brands'),
        fetch('/api/categories'),
        fetch('/api/products'),
        fetch('/api/settings'),
        fetch('/api/orders')
      ]);

      const [dataBrands, dataCategories, dataProducts, dataSettings, dataOrders] = await Promise.all([
        resBrands.json(),
        resCategories.json(),
        resProducts.json(),
        resSettings.json(),
        resOrders.json()
      ]);

      if (Array.isArray(dataBrands)) setBrands(dataBrands);
      if (Array.isArray(dataCategories)) setCategories(dataCategories);
      if (Array.isArray(dataProducts)) setProducts(dataProducts);

      if (dataSettings && typeof dataSettings === 'object') {
        if (dataSettings.whatsapp) setWhatsapp(dataSettings.whatsapp);
        if (dataSettings.currency) setCurrency(dataSettings.currency);
        if (dataSettings.minStock) setMinStock(parseInt(dataSettings.minStock));
      }

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
      toast.success('Bienvenido al panel Mayra Shop', {
        icon: '✨',
        style: { background: '#111', color: '#fff', borderLeft: '3px solid #d4af37' }
      });
    } else {
      toast.error('Credenciales incorrectas');
    }
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBrandName.trim() })
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
    if (!newCategoryName.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() })
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
    
    if (!formData.get('name') || !formData.get('price') || !formData.get('categoryId') || !formData.get('brandId')) {
      toast.error('Por favor, llena los campos obligatorios (*)');
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
      form.reset();
      setEditingProduct(null);
      loadData();
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
      toast.error('No hay stock disponible de este producto');
      return;
    }
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error(`Solo quedan ${product.stock} unidades en stock`);
        return;
      }
      setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { productId: product.id, name: product.name, price: parseFloat(product.price), quantity: 1 }]);
    }
    toast.success(`${product.name} al carrito`, { duration: 1500 });
  };

  const loadPendingOrder = (order) => {
    setCustomerName(order.customerName === "Cliente WhatsApp" ? "" : order.customerName || '');
    setCustomerPhone(order.customerPhone || '');
    setPaymentMethod(order.paymentMethod === "POR ACORDAR" ? "EFECTIVO" : order.paymentMethod || 'EFECTIVO');
    setEditingOrderId(order.id);
    setCart(order.items.map(i => ({ productId: i.productId, name: i.product?.name, price: parseFloat(i.price), quantity: i.quantity })));
    setActiveTab('pos');
    toast.success(`Pedido #${order.id} cargado en el POS`);
  };

  // --- Estadísticas y Filtros ---
  const filteredOrders = orders.filter(o => {
    if (!startDate || !endDate) return true;
    const d = new Date(o.createdAt);
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
    if (cart.length === 0) return toast.error('El carrito de facturación está vacío');
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

  // ═══════════════════════════════════════════
  // PANTALLA DE LOGIN (ESTILO ALTA GAMA)
  // ═══════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper">
        <Toaster position="top-center" />
        <div className="admin-login-box">
          <img src="/logo2.jpg" alt="Mayra Shop" className="admin-login-brand-logo" onError={(e) => { e.target.src = '/logo.jpeg'; }} />
          <h2 className="admin-login-title">MAYRA SHOP</h2>
          <p className="admin-login-subtitle">Panel de Control & Gestión</p>

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="admin-field-group">
              <label className="admin-field-label">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="admin-input-luxury"
                autoFocus
                required
              />
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="admin-input-luxury"
                required
              />
            </div>

            <button type="submit" className="admin-btn-gold" style={{ marginTop: '0.75rem' }}>
              <span>Entrar al Panel</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // PANEL ADMINISTRATIVO AUTENTICADO
  // ═══════════════════════════════════════════
  return (
    <div className="admin-shell">
      <Toaster position="top-center" />

      {/* ── HEADER SUPERIOR ── */}
      <header className="admin-header-bar">
        <div className="admin-header-content">
          <div className="admin-header-brand-wrap">
            <img src="/logo2.jpg" alt="Mayra Shop" className="admin-header-logo" onError={(e) => { e.target.src = '/logo.jpeg'; }} />
            <div>
              <h2 className="admin-header-title">MAYRA SHOP</h2>
              <span className="admin-header-badge">Control & Facturación</span>
            </div>
          </div>

          <div className="admin-header-actions">
            <a href="/" target="_blank" rel="noreferrer" className="admin-btn-view-store">
              <span>Ver Tienda</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>

            <button onClick={() => setIsAuthenticated(false)} className="admin-btn-logout">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* ── PESTAÑAS NAVEGABLES (SWIPE EN MÓVILES) ── */}
      <nav className="admin-tabs-scroller">
        <div className="admin-tabs-inner">
          <button
            onClick={() => setActiveTab('productos')}
            className={`admin-tab-item ${activeTab === 'productos' ? 'active' : ''}`}
          >
            <span>📦</span> Productos ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`admin-tab-item ${activeTab === 'pos' ? 'active' : ''}`}
          >
            <span>💳</span> POS / Facturar
            {orders.filter(o => o.status === 'PENDING').length > 0 && (
              <span style={{ background: '#e74c3c', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>
                {orders.filter(o => o.status === 'PENDING').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pedidos')}
            className={`admin-tab-item ${activeTab === 'pedidos' ? 'active' : ''}`}
          >
            <span>📋</span> Historial Ventas
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`admin-tab-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <span>📊</span> Métricas & Reportes
          </button>

          <button
            onClick={() => setActiveTab('marcas')}
            className={`admin-tab-item ${activeTab === 'marcas' ? 'active' : ''}`}
          >
            <span>🏷️</span> Categorías & Marcas
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`admin-tab-item ${activeTab === 'config' ? 'active' : ''}`}
          >
            <span>⚙️</span> Ajustes Tienda
          </button>
        </div>
      </nav>

      {/* ── CONTENIDO PRINCIPAL SEGÚN PESTAÑA ── */}
      <main className="admin-main-wrap">

        {/* ═══════════════════════════════════════════
            TAB 1: PRODUCTOS
        ═══════════════════════════════════════════ */}
        {activeTab === 'productos' && (
          <div>
            {/* Formulario de Crear / Editar */}
            <div className="admin-luxury-card">
              <div className="admin-card-header-line">
                <h3 className="admin-card-title">
                  <span>{editingProduct ? '✏️' : '✨'}</span>
                  {editingProduct ? `Editando: ${editingProduct.name}` : 'Añadir Nuevo Producto'}
                </h3>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    style={{ background: '#f1f1f1', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    ✕ Cancelar Edición
                  </button>
                )}
              </div>

              <form key={editingProduct ? editingProduct.id : 'new'} onSubmit={handleSaveProduct}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.3rem', color: '#555' }}>
                      Nombre del Producto *
                    </label>
                    <input
                      name="name"
                      type="text"
                      defaultValue={editingProduct?.name || ''}
                      placeholder="Ej. Bleu Intense / Crema Argán"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #d4af37', outline: 'none' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.3rem', color: '#555' }}>
                      Imagen del Producto
                    </label>
                    <input
                      name="image"
                      type="file"
                      accept="image/*"
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.3rem', color: '#555' }}>
                      Precio de Venta ($) *
                    </label>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={editingProduct?.price || ''}
                      placeholder="Ej. 25.00"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.3rem', color: '#555' }}>
                      Precio de Costo ($)
                    </label>
                    <input
                      name="costPrice"
                      type="number"
                      step="0.01"
                      defaultValue={editingProduct?.costPrice || ''}
                      placeholder="Ej. 15.00"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.3rem', color: '#555' }}>
                      Stock en Almacén
                    </label>
                    <input
                      name="stock"
                      type="number"
                      defaultValue={editingProduct?.stock || 5}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.3rem', color: '#555' }}>
                      Género
                    </label>
                    <select
                      name="gender"
                      defaultValue={editingProduct?.gender || 'Damas'}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}
                    >
                      <option value="Damas">Damas</option>
                      <option value="Caballeros">Caballeros</option>
                      <option value="Unisex">Unisex</option>
                      <option value="Infantil">Infantil</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.3rem', color: '#555' }}>
                      Categoría *
                    </label>
                    <select
                      name="categoryId"
                      defaultValue={editingProduct?.categoryId || ''}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}
                      required
                    >
                      <option value="">Selecciona una categoría...</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.3rem', color: '#555' }}>
                      Marca *
                    </label>
                    <select
                      name="brandId"
                      defaultValue={editingProduct?.brandId || ''}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}
                      required
                    >
                      <option value="">Selecciona una marca...</option>
                      {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  <input
                    name="isAvailable"
                    type="checkbox"
                    id="isAvailableCheck"
                    value="true"
                    defaultChecked={editingProduct ? editingProduct.isAvailable : true}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#d4af37' }}
                  />
                  <label htmlFor="isAvailableCheck" style={{ fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                    Producto activo y visible para los clientes
                  </label>
                </div>

                <button type="submit" className="admin-btn-gold" style={{ maxWidth: '320px' }}>
                  {editingProduct ? 'Guardar Cambios del Producto' : '+ Registrar Producto'}
                </button>
              </form>
            </div>

            {/* Catálogo de Productos con Buscador y Filtros */}
            <div className="admin-luxury-card">
              <div className="admin-card-header-line">
                <h3 className="admin-card-title">
                  <span>💎</span> Catálogo de Productos ({products.length})
                </h3>
                
                {/* Selector de vista: Tarjetas o Tabla */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => setViewMode('cards')}
                    style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #ccc', background: viewMode === 'cards' ? '#111' : '#fff', color: viewMode === 'cards' ? '#d4af37' : '#333', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    Tarjetas
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #ccc', background: viewMode === 'table' ? '#111' : '#fff', color: viewMode === 'table' ? '#d4af37' : '#333', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    Tabla
                  </button>
                </div>
              </div>

              {/* Filtros */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ flex: '1 1 200px', padding: '0.65rem 1rem', borderRadius: '25px', border: '1px solid #ccc', outline: 'none' }}
                />

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{ padding: '0.65rem 1rem', borderRadius: '25px', border: '1px solid #ccc', background: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="Todas">Todas las Categorías</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>

                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  style={{ padding: '0.65rem 1rem', borderRadius: '25px', border: '1px solid #ccc', background: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="Todas">Todas las Marcas</option>
                  {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>

                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  style={{ padding: '0.65rem 1rem', borderRadius: '25px', border: '1px solid #ccc', background: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="Todos">Todos los Géneros</option>
                  <option value="Damas">Damas</option>
                  <option value="Caballeros">Caballeros</option>
                  <option value="Unisex">Unisex</option>
                  <option value="Infantil">Infantil</option>
                </select>
              </div>

              {/* Vista Móvil / Tarjetas Ergonómicas */}
              {viewMode === 'cards' ? (
                <div className="admin-product-cards-grid">
                  {products
                    .filter(p => {
                      const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.brand?.name || '').toLowerCase().includes(productSearch.toLowerCase());
                      const matchCat = filterCategory === 'Todas' || String(p.categoryId) === String(filterCategory);
                      const matchBr = filterBrand === 'Todas' || String(p.brandId) === String(filterBrand);
                      const matchG = filterGender === 'Todos' || p.gender === filterGender;
                      return matchSearch && matchCat && matchBr && matchG;
                    })
                    .map(p => (
                      <div key={p.id} className="admin-product-row-card">
                        <img src={p.imageUrl || '/logo2.jpg'} alt={p.name} className="admin-prod-thumb" onError={(e) => { e.target.src = '/logo.jpeg'; }} />
                        <div className="admin-prod-info">
                          <span style={{ fontSize: '0.68rem', color: '#b89225', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            {p.brand?.name || 'Marca'} • {p.gender || 'Unisex'}
                          </span>
                          <h4>{p.name}</h4>
                          <div className="admin-prod-prices">
                            <span className="admin-prod-sell-price">{formatPrice(p.price)}</span>
                            {p.costPrice > 0 && <span className="admin-prod-cost-price">Costo: {formatPrice(p.costPrice)}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: p.stock > 5 ? '#27ae60' : p.stock > 0 ? '#e67e22' : '#e74c3c' }}>
                              Stock: {p.stock}
                            </span>
                            <div className="admin-prod-actions">
                              <button onClick={() => handleEditClick('producto', p.id, p.name)} className="admin-btn-action-edit">
                                Editar
                              </button>
                              <button onClick={() => handleDeleteClick('producto', p.id)} className="admin-btn-action-del">
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                /* Vista de Tabla Clásica */
                <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                  <table style={{ width: '100%', minWidth: '650px', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ background: '#111', color: '#f5e4b2' }}>
                      <tr>
                        <th style={{ padding: '0.75rem' }}>Foto</th>
                        <th style={{ padding: '0.75rem' }}>Nombre</th>
                        <th style={{ padding: '0.75rem' }}>Marca</th>
                        <th style={{ padding: '0.75rem' }}>Precio Venta</th>
                        <th style={{ padding: '0.75rem' }}>Costo</th>
                        <th style={{ padding: '0.75rem' }}>Stock</th>
                        <th style={{ padding: '0.75rem' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products
                        .filter(p => {
                          const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
                          const matchCat = filterCategory === 'Todas' || String(p.categoryId) === String(filterCategory);
                          const matchBr = filterBrand === 'Todas' || String(p.brandId) === String(filterBrand);
                          const matchG = filterGender === 'Todos' || p.gender === filterGender;
                          return matchSearch && matchCat && matchBr && matchG;
                        })
                        .map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '0.6rem' }}>
                              <img src={p.imageUrl || '/logo2.jpg'} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} onError={(e) => { e.target.src = '/logo.jpeg'; }} />
                            </td>
                            <td style={{ padding: '0.6rem', fontWeight: 'bold' }}>{p.name}</td>
                            <td style={{ padding: '0.6rem' }}>{p.brand?.name}</td>
                            <td style={{ padding: '0.6rem', fontWeight: 'bold' }}>{formatPrice(p.price)}</td>
                            <td style={{ padding: '0.6rem', color: '#777' }}>{formatPrice(p.costPrice)}</td>
                            <td style={{ padding: '0.6rem' }}>
                              <span style={{ fontWeight: 'bold', color: p.stock > 5 ? '#27ae60' : p.stock > 0 ? '#e67e22' : '#e74c3c' }}>
                                {p.stock}
                              </span>
                            </td>
                            <td style={{ padding: '0.6rem' }}>
                              <button onClick={() => handleEditClick('producto', p.id, p.name)} className="admin-btn-action-edit" style={{ marginRight: '5px' }}>
                                Editar
                              </button>
                              <button onClick={() => handleDeleteClick('producto', p.id)} className="admin-btn-action-del">
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB 2: POS / FACTURACIÓN RÁPIDA
        ═══════════════════════════════════════════ */}
        {activeTab === 'pos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Banner de Pedidos Pendientes de WhatsApp */}
            {orders.filter(o => o.status === 'PENDING').length > 0 && (
              <div style={{ background: 'linear-gradient(135deg, #103328, #18483b)', color: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(39, 174, 96, 0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>🔔</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#a3e4d7' }}>Pedidos Pendientes de WhatsApp</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
                  {orders.filter(o => o.status === 'PENDING').map(o => (
                    <div key={o.id} style={{ background: '#fff', color: '#111', padding: '0.85rem', borderRadius: '10px', minWidth: '240px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                      <p style={{ margin: '0 0 0.25rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Pedido #{o.id}</p>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#666' }}>{o.items?.length} productos • {formatPrice(o.totalAmount)}</p>
                      <button
                        onClick={() => loadPendingOrder(o)}
                        style={{ width: '100%', padding: '0.55rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                      >
                        Cargar al Facturador ➔
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Catálogo de selección rápida */}
              <div className="admin-luxury-card" style={{ marginBottom: 0 }}>
                <h3 className="admin-card-title" style={{ marginBottom: '1rem' }}>
                  <span>🧴</span> Catálogo para Facturar
                </h3>
                <input
                  type="text"
                  placeholder="🔍 Buscar perfume o crema..."
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '25px', border: '1px solid #ccc', marginBottom: '1rem', outline: 'none' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
                  {products
                    .filter(p => p.isAvailable && p.name.toLowerCase().includes(posSearch.toLowerCase()))
                    .map(p => (
                      <div
                        key={p.id}
                        onClick={() => addToCart(p)}
                        style={{
                          border: '1px solid #e8e4dc',
                          borderRadius: '10px',
                          padding: '0.65rem',
                          textAlign: 'center',
                          cursor: p.stock > 0 ? 'pointer' : 'not-allowed',
                          opacity: p.stock > 0 ? 1 : 0.45,
                          background: '#fff',
                          transition: 'transform 0.15s'
                        }}
                      >
                        <img
                          src={p.imageUrl || '/logo2.jpg'}
                          alt={p.name}
                          style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '6px', marginBottom: '0.4rem' }}
                          onError={(e) => { e.target.src = '/logo.jpeg'; }}
                        />
                        <h4 style={{ fontSize: '0.78rem', margin: '0 0 0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </h4>
                        <strong style={{ fontSize: '0.85rem', color: '#b89225', display: 'block' }}>
                          {formatPrice(p.price)}
                        </strong>
                        <small style={{ fontSize: '0.7rem', color: p.stock > 5 ? '#27ae60' : '#e67e22' }}>
                          Stock: {p.stock}
                        </small>
                      </div>
                    ))}
                </div>
              </div>

              {/* Facturador / Carrito POS */}
              <div className="admin-luxury-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="admin-card-header-line">
                  <h3 className="admin-card-title">
                    <span>🧾</span> {editingOrderId ? `Editando Pedido #${editingOrderId}` : 'Factura de Venta'}
                  </h3>
                  {editingOrderId && (
                    <button
                      onClick={() => { setEditingOrderId(null); setCart([]); setCustomerName(''); setCustomerPhone(''); }}
                      style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: '20px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Nombre del Cliente (Opcional)"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #ccc' }}
                  />
                  <input
                    type="text"
                    placeholder="Teléfono (Opcional)"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #ccc' }}
                  />
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}
                  >
                    <option value="EFECTIVO">💵 Divisas / Efectivo</option>
                    <option value="PAGO_MOVIL">📲 Pago Móvil (Tasa BCV)</option>
                    <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                    <option value="TARJETA">💳 Punto de Venta / Tarjeta</option>
                  </select>
                </div>

                {/* Items agregados */}
                <div style={{ flex: 1, minHeight: '160px', maxHeight: '280px', overflowY: 'auto', marginBottom: '1rem' }}>
                  {cart.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999', margin: '2rem 0', fontSize: '0.88rem' }}>
                      🛒 Toca productos del catálogo para añadirlos a la factura.
                    </p>
                  ) : (
                    cart.map(item => (
                      <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #eee' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.85rem' }}>{item.name}</p>
                          <small style={{ color: '#777' }}>{formatPrice(item.price)} x {item.quantity}</small>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{formatPrice(item.price * item.quantity)}</span>
                          <button
                            onClick={() => setCart(cart.filter(c => c.productId !== item.productId))}
                            style={{ background: '#fce4e4', color: '#e74c3c', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Total & Checkout */}
                <div style={{ borderTop: '2px dashed #ddd', paddingTop: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Total a Cobrar:</span>
                  <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: '800', color: '#111' }}>
                    {formatPrice(cartTotal)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="admin-btn-gold"
                  style={{ width: '100%', opacity: cart.length === 0 ? 0.45 : 1 }}
                >
                  {editingOrderId ? 'Guardar y Completar Pedido' : 'Procesar Venta'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB 3: HISTORIAL DE PEDIDOS
        ═══════════════════════════════════════════ */}
        {activeTab === 'pedidos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Alerta de Stock Bajo */}
            <div className="admin-luxury-card" style={{ borderLeft: '4px solid #e74c3c' }}>
              <h3 className="admin-card-title" style={{ color: '#c0392b', marginBottom: '0.75rem' }}>
                <span>⚠️</span> Alertas de Inventario Crítico (Stock ≤ {minStock})
              </h3>
              {products.filter(p => p.stock <= minStock).length === 0 ? (
                <p style={{ color: '#27ae60', margin: 0, fontWeight: '600' }}>✓ Todos los productos tienen buen nivel de inventario.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.65rem' }}>
                  {products.filter(p => p.stock <= minStock).map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#fff5f5', border: '1px solid #fed7d7', padding: '0.6rem', borderRadius: '8px' }}>
                      <img src={p.imageUrl || '/logo2.jpg'} alt={p.name} style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }} onError={(e) => { e.target.src = '/logo.jpeg'; }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                        <span style={{ fontSize: '0.72rem', color: '#c0392b', fontWeight: 'bold' }}>Quedan: {p.stock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historial de Ventas */}
            <div className="admin-luxury-card">
              <div className="admin-card-header-line">
                <h3 className="admin-card-title">
                  <span>📄</span> Historial de Ventas & Pedidos
                </h3>

                {/* Filtro de Fechas */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.8rem' }}
                  />
                  <span>al</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                <table style={{ width: '100%', minWidth: '600px', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead style={{ background: '#111', color: '#f5e4b2' }}>
                    <tr>
                      <th style={{ padding: '0.75rem' }}>ID</th>
                      <th style={{ padding: '0.75rem' }}>Fecha</th>
                      <th style={{ padding: '0.75rem' }}>Cliente</th>
                      <th style={{ padding: '0.75rem' }}>Total</th>
                      <th style={{ padding: '0.75rem' }}>Método</th>
                      <th style={{ padding: '0.75rem' }}>Estado</th>
                      <th style={{ padding: '0.75rem' }}>Recibo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No hay pedidos en el rango de fechas seleccionado.</td></tr>
                    ) : (
                      filteredOrders.map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>#{o.id}</td>
                          <td style={{ padding: '0.75rem' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '0.75rem' }}>{o.customerName || 'Cliente'}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{formatPrice(o.totalAmount)}</td>
                          <td style={{ padding: '0.75rem', fontSize: '0.78rem' }}>{o.paymentMethod || 'POR ACORDAR'}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              background: o.status === 'COMPLETED' ? '#e8f5e9' : o.status === 'PENDING' ? '#fff3cd' : '#ffebee',
                              color: o.status === 'COMPLETED' ? '#2e7d32' : o.status === 'PENDING' ? '#856404' : '#c62828',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              {o.status === 'COMPLETED' ? 'Completado' : o.status === 'PENDING' ? 'Pendiente' : 'Cancelado'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <button
                              onClick={() => setInvoiceOrder(o)}
                              style={{ background: '#111', color: '#d4af37', border: '1px solid #d4af37', padding: '0.35rem 0.75rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                            >
                              🖨️ Factura
                            </button>
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

        {/* ═══════════════════════════════════════════
            TAB 4: MÉTRICAS & REPORTES
        ═══════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 className="admin-card-title">
              <span>📊</span> Resumen Financiero & Estadísticas
            </h3>

            {/* Tarjetas Métricas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #16222f, #2c3e50)', color: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Ventas Totales</span>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', margin: '0.5rem 0 0', color: '#f5e4b2' }}>
                  {formatPrice(totalRevenue)}
                </h2>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #103328, #18483b)', color: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Ventas Realizadas</span>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', margin: '0.5rem 0 0', color: '#a3e4d7' }}>
                  {completedOrders.length}
                </h2>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #2b1f3d, #3e2d56)', color: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Ticket Promedio</span>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', margin: '0.5rem 0 0', color: '#d7bde2' }}>
                  {formatPrice(completedOrders.length > 0 ? (totalRevenue / completedOrders.length) : 0)}
                </h2>
              </div>
            </div>

            {/* Gráfico y Top 5 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {/* Gráfico de barras puro */}
              <div className="admin-luxury-card" style={{ marginBottom: 0 }}>
                <h4 style={{ margin: '0 0 1.25rem', fontFamily: 'Playfair Display, serif', fontSize: '1.1rem' }}>Ingresos por Fecha</h4>
                {chartData.length === 0 ? (
                  <p style={{ color: '#888', textAlign: 'center', margin: '3rem 0' }}>No hay ventas registradas en este período.</p>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '220px', paddingBottom: '0.5rem', borderBottom: '1px solid #eee', overflowX: 'auto' }}>
                    {chartData.map((data, index) => {
                      const maxRevenue = Math.max(...chartData.map(d => d.Ventas));
                      const heightPercent = maxRevenue > 0 ? (data.Ventas / maxRevenue) * 100 : 0;
                      return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: '45px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#444', fontWeight: 'bold' }}>${data.Ventas.toFixed(0)}</span>
                          <div style={{ width: '100%', maxWidth: '36px', height: `${Math.max(heightPercent, 6)}%`, background: 'var(--gold-metallic)', borderRadius: '4px 4px 0 0', transition: 'height 0.4s' }}></div>
                          <span style={{ fontSize: '0.7rem', color: '#888', whiteSpace: 'nowrap' }}>{data.date.substring(0, 5)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top 5 Productos */}
              <div className="admin-luxury-card" style={{ marginBottom: 0 }}>
                <h4 style={{ margin: '0 0 1.25rem', fontFamily: 'Playfair Display, serif', fontSize: '1.1rem' }}>Top 5 Fragancias Más Vendidas</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {topProducts.map((p, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: '#f8f6f0', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '✨'} {p.name}
                      </span>
                      <span style={{ background: '#111', color: '#d4af37', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.75rem' }}>
                        {p.quantity} uds
                      </span>
                    </li>
                  ))}
                  {topProducts.length === 0 && <p style={{ color: '#888', textAlign: 'center', margin: '2rem 0' }}>Aún no hay suficientes ventas registradas.</p>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB 5: CATEGORÍAS & MARCAS
        ═══════════════════════════════════════════ */}
        {activeTab === 'marcas' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Gestión de Marcas */}
            <div className="admin-luxury-card">
              <h3 className="admin-card-title" style={{ marginBottom: '1rem' }}>
                <span>✨</span> Marcas ({brands.length})
              </h3>
              <form onSubmit={handleSaveBrand} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value)}
                  placeholder="Nueva Marca (Ej. Dior, L'Bel)"
                  style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', border: '1px solid #ccc' }}
                  required
                />
                <button disabled={loading} type="submit" className="admin-btn-gold" style={{ width: 'auto', padding: '0.7rem 1.25rem' }}>
                  Guardar
                </button>
              </form>

              <ul style={{ listStyle: 'none', border: '1px solid #eee', borderRadius: '8px', padding: '0.5rem' }}>
                {brands.length === 0 && <li style={{ padding: '1rem', color: '#888' }}>No hay marcas registradas.</li>}
                {brands.map(brand => (
                  <li key={brand.id} style={{ padding: '0.7rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{brand.name}</strong>
                    <div>
                      <button onClick={() => handleEditClick('marca', brand.id, brand.name)} className="admin-btn-action-edit" style={{ marginRight: '6px' }}>Editar</button>
                      <button onClick={() => handleDeleteClick('marca', brand.id)} className="admin-btn-action-del">✕</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gestión de Categorías */}
            <div className="admin-luxury-card">
              <h3 className="admin-card-title" style={{ marginBottom: '1rem' }}>
                <span>🏷️</span> Categorías ({categories.length})
              </h3>
              <form onSubmit={handleSaveCategory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Nueva Categoría (Ej. Perfumes, Splash)"
                  style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', border: '1px solid #ccc' }}
                  required
                />
                <button disabled={loading} type="submit" className="admin-btn-gold" style={{ width: 'auto', padding: '0.7rem 1.25rem' }}>
                  Guardar
                </button>
              </form>

              <ul style={{ listStyle: 'none', border: '1px solid #eee', borderRadius: '8px', padding: '0.5rem' }}>
                {categories.length === 0 && <li style={{ padding: '1rem', color: '#888' }}>No hay categorías registradas.</li>}
                {categories.map(cat => (
                  <li key={cat.id} style={{ padding: '0.7rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{cat.name}</strong>
                    <div>
                      <button onClick={() => handleEditClick('categoria', cat.id, cat.name)} className="admin-btn-action-edit" style={{ marginRight: '6px' }}>Editar</button>
                      <button onClick={() => handleDeleteClick('categoria', cat.id)} className="admin-btn-action-del">✕</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB 6: CONFIGURACIÓN
        ═══════════════════════════════════════════ */}
        {activeTab === 'config' && (
          <div className="admin-luxury-card" style={{ maxWidth: '600px' }}>
            <h3 className="admin-card-title" style={{ marginBottom: '1.5rem' }}>
              <span>⚙️</span> Configuración Global de Mayra Shop
            </h3>

            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                  Número de WhatsApp para Pedidos
                </label>
                <p style={{ fontSize: '0.78rem', color: '#777', marginBottom: '0.4rem' }}>
                  Incluye el código de país (ej. +584141234567 o +18091234567)
                </p>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ej. +584141234567"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1.5px solid #d4af37' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                  Umbral de Alerta para Stock Mínimo
                </label>
                <p style={{ fontSize: '0.78rem', color: '#777', marginBottom: '0.4rem' }}>
                  Los perfumes con stock igual o inferior a este número mostrarán alerta roja en el panel.
                </p>
                <input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                  Moneda Principal del Catálogo
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}
                >
                  <option value="USD">Dólar Estadounidense (USD $)</option>
                  <option value="VES">Bolívar Venezolano (VES Bs)</option>
                  <option value="DOP">Peso Dominicano (DOP RD$)</option>
                  <option value="EUR">Euro (EUR €)</option>
                  <option value="COP">Peso Colombiano (COP $)</option>
                  <option value="MXN">Peso Mexicano (MXN $)</option>
                </select>
              </div>

              <button type="submit" className="admin-btn-gold" style={{ marginTop: '0.5rem' }}>
                Guardar Configuración
              </button>
            </form>
          </div>
        )}

      </main>

      {/* ═══════════════════════════════════════════
          MODAL DE CONFIRMACIÓN / EDICIÓN
      ═══════════════════════════════════════════ */}
      {modal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: '1px solid var(--gold-border)' }}>
            
            {modal.mode === 'delete' && (
              <>
                <h3 style={{ marginBottom: '0.75rem', color: '#e74c3c', fontSize: '1.25rem' }}>¿Confirmar Eliminación?</h3>
                <p style={{ marginBottom: '1.75rem', color: '#666', fontSize: '0.9rem' }}>
                  ¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button onClick={() => setModal({ ...modal, isOpen: false })} style={{ padding: '0.7rem 1.25rem', border: 'none', background: '#eee', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Cancelar
                  </button>
                  <button onClick={confirmDelete} style={{ padding: '0.7rem 1.25rem', border: 'none', background: '#e74c3c', color: 'white', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Sí, Eliminar
                  </button>
                </div>
              </>
            )}

            {modal.mode === 'edit' && (
              <>
                <h3 style={{ marginBottom: '0.75rem', color: '#111', fontSize: '1.25rem' }}>Editar {modal.type === 'marca' ? 'Marca' : 'Categoría'}</h3>
                <input
                  type="text"
                  value={modal.name}
                  onChange={(e) => setModal({ ...modal, name: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1.5px solid #d4af37', marginBottom: '1.5rem', outline: 'none' }}
                  autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button onClick={() => setModal({ ...modal, isOpen: false })} style={{ padding: '0.7rem 1.25rem', border: 'none', background: '#eee', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Cancelar
                  </button>
                  <button onClick={confirmEdit} className="admin-btn-gold" style={{ width: 'auto', padding: '0.7rem 1.25rem' }}>
                    Guardar
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MODAL DE FACTURA IMPRIMIBLE
      ═══════════════════════════════════════════ */}
      {invoiceOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <div id="invoice-print-area" style={{ fontFamily: 'monospace', color: 'black' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ margin: 0, letterSpacing: '2px' }}>MAYRA SHOP</h2>
                <p style={{ margin: '2px 0', fontSize: '0.8rem' }}>Haute Parfumerie & Beauté</p>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>Tel: {whatsapp}</p>
                <div style={{ borderTop: '1px dashed #000', margin: '0.75rem 0' }}></div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>FACTURA / RECIBO #{invoiceOrder.id}</p>
                <p style={{ margin: 0, fontSize: '0.75rem' }}>{new Date(invoiceOrder.createdAt).toLocaleString()}</p>
              </div>

              <div style={{ borderBottom: '1px dashed #333', paddingBottom: '0.5rem', marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                <p style={{ margin: '2px 0' }}>Cliente: <strong>{invoiceOrder.customerName || 'Consumidor Final'}</strong></p>
                {invoiceOrder.customerPhone && <p style={{ margin: '2px 0' }}>Teléfono: {invoiceOrder.customerPhone}</p>}
                <p style={{ margin: '2px 0' }}>Método: {invoiceOrder.paymentMethod || 'EFECTIVO'}</p>
              </div>

              <table style={{ width: '100%', textAlign: 'left', marginBottom: '1rem', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed #333' }}>
                    <th style={{ paddingBottom: '0.4rem' }}>Cant</th>
                    <th style={{ paddingBottom: '0.4rem' }}>Descripción</th>
                    <th style={{ paddingBottom: '0.4rem', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceOrder.items?.map(item => (
                    <tr key={item.id}>
                      <td style={{ paddingTop: '0.4rem' }}>{item.quantity}</td>
                      <td style={{ paddingTop: '0.4rem' }}>{item.product?.name || item.name}</td>
                      <td style={{ paddingTop: '0.4rem', textAlign: 'right' }}>{formatPrice(item.quantity * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed #333', paddingTop: '0.75rem', textAlign: 'right' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>TOTAL: {formatPrice(invoiceOrder.totalAmount)}</h3>
              </div>
              <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', fontStyle: 'italic' }}>
                ¡Gracias por su preferencia!
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  const printContent = document.getElementById('invoice-print-area').innerHTML;
                  const originalContent = document.body.innerHTML;
                  document.body.innerHTML = printContent;
                  window.print();
                  document.body.innerHTML = originalContent;
                  window.location.reload();
                }}
                className="admin-btn-gold"
                style={{ flex: 1 }}
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={() => setInvoiceOrder(null)}
                style={{ flex: 1, background: '#eee', color: '#111', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
