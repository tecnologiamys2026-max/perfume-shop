'use client';
import { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';

export default function Home() {
  // ── Estados de datos (Preservando estructura de base de datos) ──
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [currency, setCurrency] = useState('USD');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(true);

  // ── Carrito y Favoritos (localStorage) ──
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // ── Filtros ──
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [selectedGender, setSelectedGender] = useState('Todos');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // ── Modales interactivos (Nuevas funcionalidades) ──
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState({ gender: '', vibe: '', occasion: '' });

  // ── Cargar datos del servidor ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProducts, resCat, resBrand, resConfig] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
          fetch('/api/brands'),
          fetch('/api/settings')
        ]);

        const [dataProducts, dataCat, dataBrand, dataConfig] = await Promise.all([
          resProducts.json(),
          resCat.json(),
          resBrand.json(),
          resConfig.json()
        ]);

        if (Array.isArray(dataProducts)) setProducts(dataProducts);
        if (Array.isArray(dataCat)) setCategories(dataCat);
        if (Array.isArray(dataBrand)) setBrands(dataBrand);
        if (dataConfig && typeof dataConfig === 'object') {
          if (dataConfig.whatsapp) setWhatsapp(dataConfig.whatsapp);
          if (dataConfig.currency) setCurrency(dataConfig.currency);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
      setLoading(false);
    };
    fetchData();

    // Cargar favoritos de localStorage
    try {
      const savedFavs = localStorage.getItem('mayrashop_favs');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
      const savedCart = localStorage.getItem('mayrashop_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {
      console.warn('Error leyendo localStorage', e);
    }
  }, []);

  // Guardar favoritos en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mayrashop_favs', JSON.stringify(favorites));
    } catch (e) {}
  }, [favorites]);

  // Guardar carrito en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mayrashop_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  // ── Formato de precio ──
  const formatPrice = (price) => {
    const symbol = currency === 'VES' ? 'Bs' : currency === 'DOP' ? 'RD$' : currency === 'EUR' ? '€' : '$';
    return `${symbol}${parseFloat(price || 0).toFixed(2)} ${currency}`;
  };

  // ── Gestión de favoritos ──
  const toggleFavorite = (productId, e) => {
    if (e) e.stopPropagation();
    if (favorites.includes(productId)) {
      setFavorites(favorites.filter(id => id !== productId));
      toast('Eliminado de favoritos', { icon: '🤍', style: { background: '#111', color: '#fff', fontSize: '14px' } });
    } else {
      setFavorites([...favorites, productId]);
      toast('Añadido a favoritos', { icon: '❤️', style: { background: '#111', color: '#fff', fontSize: '14px', borderLeft: '3px solid #d4af37' } });
    }
  };

  // ── Carrito ──
  const addToCart = (product, qtyToAdd = 1, e) => {
    if (e) e.stopPropagation();
    const existing = cart.find(item => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const requestedTotal = currentQty + qtyToAdd;

    if (requestedTotal > product.stock) {
      toast.error(`Solo quedan ${product.stock} unidades disponibles`, {
        style: { background: '#111', color: '#fff', borderLeft: '3px solid #e74c3c' }
      });
      return;
    }

    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: requestedTotal } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: qtyToAdd }]);
    }

    toast.success(`${product.name} añadido`, {
      style: { background: '#111', color: '#fff', borderLeft: '3px solid #d4af37' },
      iconTheme: { primary: '#d4af37', secondary: '#111' }
    });
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      setCart(cart.filter(item => item.id !== productId));
      return;
    }
    const product = products.find(p => p.id === productId);
    if (product && newQty > product.stock) {
      toast.error(`Solo quedan ${product.stock} disponibles`);
      return;
    }
    setCart(cart.map(item =>
      item.id === productId ? { ...item, quantity: newQty } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  // ── Filtrado de productos ──
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (!product.isAvailable || product.stock <= 0) return false;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.brand?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || product.category?.name === selectedCategory;
      const matchesBrand = selectedBrand === 'Todas' || product.brand?.name === selectedBrand;
      const matchesGender = selectedGender === 'Todos' || product.gender === selectedGender;
      const matchesFav = !onlyFavorites || favorites.includes(product.id);
      const matchesLowStock = !onlyLowStock || product.stock <= 3;
      return matchesSearch && matchesCategory && matchesBrand && matchesGender && matchesFav && matchesLowStock;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, selectedGender, onlyFavorites, favorites, onlyLowStock]);

  const hasActiveFilters = searchQuery || selectedCategory !== 'Todas' || selectedBrand !== 'Todas' || selectedGender !== 'Todos' || onlyFavorites || onlyLowStock;

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Todas');
    setSelectedBrand('Todas');
    setSelectedGender('Todos');
    setOnlyFavorites(false);
    setOnlyLowStock(false);
  };

  // ── Checkout por WhatsApp ──
  const handleCheckout = async () => {
    if (!cart.length || !whatsapp) return;
    toast.loading('Registrando pedido...', { id: 'order' });

    const orderItems = cart.map(item => ({
      productId: item.id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity
    }));

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: "Cliente Web / WhatsApp",
          customerPhone: "",
          paymentMethod: "POR ACORDAR",
          status: "PENDING",
          items: orderItems
        })
      });
      toast.success('¡Pedido registrado!', { id: 'order' });

      const text = `🛍️ *¡HOLA MAYRA SHOP! DESEO REALIZAR UN PEDIDO*\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        orderItems.map((i, idx) => `*${idx + 1}.* ${i.name} (x${i.quantity}) → *${formatPrice(i.price * i.quantity)}*`).join('\n') +
        `\n━━━━━━━━━━━━━━━━━━\n` +
        `💰 *TOTAL A PAGAR: ${formatPrice(cartTotal)}*\n\n` +
        `📍 ¿Cuáles son los datos para el pago móvil / transferencia? ¡Quedo atento(a)!`;

      window.open(`https://wa.me/${whatsapp.replace('+', '')}?text=${encodeURIComponent(text)}`, '_blank');
      setCart([]);
      setCartOpen(false);
    } catch (e) {
      toast.error('Error al registrar pedido', { id: 'order' });
    }
  };

  // Consulta por WhatsApp de un producto específico
  const consultProductWhatsApp = (product) => {
    if (!whatsapp) return;
    const text = `Hola Mayra Shop ✨ Me gustaría más información sobre el producto:\n*${product.name}* (${product.brand?.name || 'Perfumería'})\nPrecio: *${formatPrice(product.price)}*\n¿Está disponible para entrega?`;
    window.open(`https://wa.me/${whatsapp.replace('+', '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // ── Íconos de género ──
  const genderLabel = (gender) => {
    switch (gender) {
      case 'Damas': return '♀ Dama';
      case 'Caballeros': return '♂ Caballero';
      case 'Unisex': return '⚥ Unisex';
      case 'Infantil': return '★ Infantil';
      default: return gender || '';
    }
  };

  // ── Lógica del Quiz Olfativo ──
  const quizRecommended = useMemo(() => {
    if (!quizAnswers.gender && !quizAnswers.vibe) return [];
    return products.filter(p => {
      if (!p.isAvailable || p.stock <= 0) return false;
      const matchGender = !quizAnswers.gender || quizAnswers.gender === 'Todos' || p.gender === quizAnswers.gender;
      return matchGender;
    }).slice(0, 4);
  }, [products, quizAnswers]);

  return (
    <main className="store">
      <Toaster position="top-center" toastOptions={{ duration: 2500 }} />

      {/* ═══════════════════════════════════════════
          NAVBAR LUXURY
      ═══════════════════════════════════════════ */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand" onClick={() => { resetFilters(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>
            <div className="navbar-logo-wrap">
              <img src="/logo2.jpg" alt="Mayra Shop" onError={(e) => { e.target.src = '/logo.jpeg'; }} />
            </div>
            <div className="navbar-brand-text">
              <span className="navbar-brand-name">MAYRA SHOP</span>
              <span className="navbar-brand-tagline">Haute Parfumerie & Beauté</span>
            </div>
          </div>

          <div className="navbar-actions">
            {/* Botón Quiz en Navbar */}
            <button
              className="navbar-quiz-btn"
              onClick={() => { setQuizOpen(true); setQuizStep(1); }}
              title="Descubre tu fragancia ideal"
            >
              <span className="quiz-sparkle">✨</span>
              <span className="navbar-quiz-text">Quiz Olfativo</span>
            </button>

            {/* Favoritos */}
            <button
              className={`nav-icon-btn ${onlyFavorites ? 'active' : ''}`}
              onClick={() => {
                setOnlyFavorites(!onlyFavorites);
                const el = document.getElementById('catalogo');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              title="Mis Favoritos"
              aria-label="Ver favoritos"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={favorites.length > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {favorites.length > 0 && <span className="nav-badge">{favorites.length}</span>}
            </button>

            {/* WhatsApp Link */}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace('+', '')}`}
                target="_blank"
                rel="noreferrer"
                className="whatsapp-link"
                title="Atención directa por WhatsApp"
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="whatsapp-nav-text">WhatsApp</span>
              </a>
            )}

            {/* Carrito */}
            <button className="cart-toggle" onClick={() => setCartOpen(true)} aria-label="Abrir Carrito">
              <div className="cart-toggle-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </div>
              <span className="cart-label">{cartCount > 0 ? formatPrice(cartTotal) : 'Carrito'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          HERO EDITORIAL DE LUJO
      ═══════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero-glow-sphere" />
        <div className="hero-content">
          <div className="hero-eyebrow-chip">
            <span className="gold-star">✦</span>
            <span>COLECCIÓN EXCLUSIVA & ORIGINAL</span>
            <span className="gold-star">✦</span>
          </div>

          <h1 className="hero-title">
            El Arte De Dejar <br />
            <span className="hero-title-highlight">Una Huella Inolvidable</span>
          </h1>

          <p className="hero-subtitle">
            Fragancias selectas, cremas corporales y esencias que definen tu elegancia. 
            Calidad garantizada y entregas directas a tus manos.
          </p>

          <div className="hero-cta-group">
            <a href="#catalogo" className="hero-cta-primary">
              <span>Explorar Colección</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </a>

            <button className="hero-cta-secondary" onClick={() => { setQuizOpen(true); setQuizStep(1); }}>
              <span className="quiz-icon-badge">✨</span>
              <span>¿No sabes cuál elegir? Haz el Quiz</span>
            </button>
          </div>

          {/* Pilares de confianza (Visual móvil refinado) */}
          <div className="hero-trust-bar">
            <div className="trust-item">
              <span className="trust-icon">💎</span>
              <div className="trust-text">
                <strong>100% Originales</strong>
                <small>Fragancias garantizadas</small>
              </div>
            </div>
            <div className="trust-divider" />
            <div className="trust-item">
              <span className="trust-icon">🚚</span>
              <div className="trust-text">
                <strong>Envíos Seguros</strong>
                <small>Empaque de lujo</small>
              </div>
            </div>
            <div className="trust-divider" />
            <div className="trust-item">
              <span className="trust-icon">💬</span>
              <div className="trust-text">
                <strong>Atención VIP</strong>
                <small>Pedidos por WhatsApp</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CATÁLOGO DE PRODUCTOS (MOBILE FIRST)
      ═══════════════════════════════════════════ */}
      <section id="catalogo" className="catalog-section">
        <div className="container">

          <div className="section-header">
            <span className="section-pretitle">CATÁLOGO EXCLUSIVO</span>
            <h2>Nuestras Fragancias & Cremas</h2>
            <p>Descubre el aroma perfecto para cada ocasión</p>
            <span className="gold-line" />
          </div>

          {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
          <div className="filters-container">
            {/* Input de búsqueda táctil */}
            <div className="search-box-wrap">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar perfume, crema o marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="luxury-search-input"
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => setSearchQuery('')} aria-label="Limpiar búsqueda">
                  ✕
                </button>
              )}
            </div>

            {/* Chips de género y accesos rápidos (Swipe horizontal en móvil) */}
            <div className="chips-scroll-wrap">
              <button
                className={`filter-chip ${selectedGender === 'Todos' && !onlyFavorites && !onlyLowStock ? 'active' : ''}`}
                onClick={() => { setSelectedGender('Todos'); setOnlyFavorites(false); setOnlyLowStock(false); }}
              >
                ✨ Todos
              </button>
              <button
                className={`filter-chip ${selectedGender === 'Damas' ? 'active' : ''}`}
                onClick={() => { setSelectedGender(selectedGender === 'Damas' ? 'Todos' : 'Damas'); setOnlyFavorites(false); }}
              >
                ♀ Damas
              </button>
              <button
                className={`filter-chip ${selectedGender === 'Caballeros' ? 'active' : ''}`}
                onClick={() => { setSelectedGender(selectedGender === 'Caballeros' ? 'Todos' : 'Caballeros'); setOnlyFavorites(false); }}
              >
                ♂ Caballeros
              </button>
              <button
                className={`filter-chip ${selectedGender === 'Unisex' ? 'active' : ''}`}
                onClick={() => { setSelectedGender(selectedGender === 'Unisex' ? 'Todos' : 'Unisex'); setOnlyFavorites(false); }}
              >
                ⚥ Unisex
              </button>
              <button
                className={`filter-chip ${onlyFavorites ? 'active favorite-chip' : ''}`}
                onClick={() => setOnlyFavorites(!onlyFavorites)}
              >
                ❤️ Favoritos {favorites.length > 0 ? `(${favorites.length})` : ''}
              </button>
              <button
                className={`filter-chip ${onlyLowStock ? 'active stock-chip' : ''}`}
                onClick={() => setOnlyLowStock(!onlyLowStock)}
              >
                🔥 Últimas Unidades
              </button>
            </div>

            {/* Desplegables refinados para Categorías y Marcas */}
            <div className="filter-dropdowns-row">
              <div className="select-pill-wrap">
                <label className="select-pill-label">Categoría:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="luxury-select"
                >
                  <option value="Todas">Todas las Categorías</option>
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>

              <div className="select-pill-wrap">
                <label className="select-pill-label">Marca:</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="luxury-select"
                >
                  <option value="Todas">Todas las Marcas</option>
                  {brands.map(brand => <option key={brand.id} value={brand.name}>{brand.name}</option>)}
                </select>
              </div>

              {hasActiveFilters && (
                <button className="reset-filters-btn" onClick={resetFilters} title="Limpiar todos los filtros">
                  <span>Limpiar</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {/* Resumen de resultados */}
            {!loading && (
              <div className="results-status-bar">
                <span>
                  Mostrando <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'producto' : 'productos'}
                </span>
                {onlyFavorites && <span className="active-filter-badge">Filtrando por Favoritos ❤️</span>}
                {onlyLowStock && <span className="active-filter-badge">Filtrando por Stock Bajo 🔥</span>}
              </div>
            )}
          </div>

          {/* ── GRID DE PRODUCTOS (2 COLUMNAS EN SMARTPHONES) ── */}
          {loading ? (
            <div className="luxury-loading-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-img" />
                  <div className="skeleton-text short" />
                  <div className="skeleton-text medium" />
                  <div className="skeleton-text price" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state-luxury">
              <div className="empty-state-icon-wrap">
                <span>🧴</span>
              </div>
              <h3>No encontramos coincidencias</h3>
              <p>Intenta cambiar los filtros seleccionados o realiza una búsqueda diferente.</p>
              <button className="empty-reset-btn" onClick={resetFilters}>
                Ver Todos los Productos
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => {
                const isFav = favorites.includes(product.id);
                return (
                  <article
                    key={product.id}
                    className="product-card"
                    onClick={() => { setQuickViewProduct(product); setQuickViewQty(1); }}
                  >
                    {/* Botón de Favorito Flotante */}
                    <button
                      className={`product-fav-btn ${isFav ? 'active' : ''}`}
                      onClick={(e) => toggleFavorite(product.id, e)}
                      title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
                      aria-label="Guardar favorito"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? "#e74c3c" : "none"} stroke={isFav ? "#e74c3c" : "currentColor"} strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>

                    {/* Imagen con Aspect Ratio Premium */}
                    <div className="product-image-wrap">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="product-image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="no-image">🧴</div>
                      )}

                      {/* Badges superiores */}
                      <div className="product-badges-top">
                        {product.stock <= 3 && product.stock > 0 && (
                          <span className="badge-luxury badge-low">
                            Quedan {product.stock}
                          </span>
                        )}
                        {product.gender && (
                          <span className="badge-luxury badge-gender">
                            {genderLabel(product.gender)}
                          </span>
                        )}
                      </div>

                      {/* Botón flotante para ver detalles rápidos */}
                      <div className="product-quickview-hint">
                        <span>🔍 Vista Rápida</span>
                      </div>
                    </div>

                    {/* Contenido / Información */}
                    <div className="product-body">
                      <div className="product-brand-line">
                        <span className="product-brand-tag">{product.brand?.name || 'Fragancia'}</span>
                        {product.category?.name && (
                          <span className="product-cat-tag">{product.category.name}</span>
                        )}
                      </div>

                      <h3 className="product-name" title={product.name}>
                        {product.name}
                      </h3>

                      <div className="product-pricing-row">
                        <div className="price-stack">
                          <span className="price-current">{formatPrice(product.price)}</span>
                        </div>
                        <span className={`stock-indicator ${product.stock > 5 ? 'ok' : 'low'}`}>
                          {product.stock > 5 ? 'Disponible' : `Stock: ${product.stock}`}
                        </span>
                      </div>

                      {/* Botón de Añadir con respuesta táctil */}
                      <button
                        className="btn-add-luxury"
                        onClick={(e) => addToCart(product, 1, e)}
                        aria-label={`Añadir ${product.name} al carrito`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        <span>Añadir al Carrito</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* ═══════════════════════════════════════════
          MODAL VISTA RÁPIDA (QUICK VIEW)
      ═══════════════════════════════════════════ */}
      {quickViewProduct && (
        <div className="modal-backdrop" onClick={() => setQuickViewProduct(null)}>
          <div className="quickview-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setQuickViewProduct(null)} aria-label="Cerrar ventana">
              ✕
            </button>

            <div className="quickview-content-grid">
              <div className="quickview-media">
                {quickViewProduct.imageUrl ? (
                  <img src={quickViewProduct.imageUrl} alt={quickViewProduct.name} />
                ) : (
                  <div className="quickview-no-img">🧴</div>
                )}
                {quickViewProduct.gender && (
                  <span className="quickview-gender-tag">{genderLabel(quickViewProduct.gender)}</span>
                )}
              </div>

              <div className="quickview-info">
                <div className="quickview-header">
                  <span className="quickview-brand">{quickViewProduct.brand?.name}</span>
                  <h2 className="quickview-title">{quickViewProduct.name}</h2>
                  <div className="quickview-cat-chip">{quickViewProduct.category?.name || 'Perfumería'}</div>
                </div>

                <div className="quickview-price-box">
                  <span className="quickview-price">{formatPrice(quickViewProduct.price)}</span>
                  <span className="quickview-stock-tag">
                    {quickViewProduct.stock > 0 ? `✓ En Existencia (${quickViewProduct.stock} uds)` : 'Agotado'}
                  </span>
                </div>

                {quickViewProduct.description ? (
                  <p className="quickview-desc">{quickViewProduct.description}</p>
                ) : (
                  <p className="quickview-desc default-desc">
                    Fragancia de calidad garantizada para resaltar tu estilo y presencia. 
                    Producto original cuidadosamente conservado para mantener intacta su fijación y aroma.
                  </p>
                )}

                {/* Controles de cantidad */}
                <div className="quickview-qty-row">
                  <span className="qty-label">Cantidad:</span>
                  <div className="qty-selector-luxury">
                    <button
                      onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))}
                      disabled={quickViewQty <= 1}
                    >
                      −
                    </button>
                    <span className="qty-number">{quickViewQty}</span>
                    <button
                      onClick={() => setQuickViewQty(Math.min(quickViewProduct.stock, quickViewQty + 1))}
                      disabled={quickViewQty >= quickViewProduct.stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Acciones principales */}
                <div className="quickview-actions">
                  <button
                    className="quickview-add-btn"
                    onClick={() => {
                      addToCart(quickViewProduct, quickViewQty);
                      setQuickViewProduct(null);
                    }}
                  >
                    <span>Añadir {quickViewQty} al Carrito</span>
                    <strong>• {formatPrice(parseFloat(quickViewProduct.price) * quickViewQty)}</strong>
                  </button>

                  {whatsapp && (
                    <button
                      className="quickview-wa-btn"
                      onClick={() => consultProductWhatsApp(quickViewProduct)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      <span>Consultar por WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MODAL INTERACTIVO: QUIZ OLFATIVO
      ═══════════════════════════════════════════ */}
      {quizOpen && (
        <div className="modal-backdrop" onClick={() => setQuizOpen(false)}>
          <div className="quiz-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setQuizOpen(false)}>✕</button>

            <div className="quiz-header">
              <span className="quiz-sparkle-pill">✨ ASISTENTE OLFATIVO</span>
              <h2>Encuentra Tu Fragancia Ideal</h2>
              <p>Responde 3 preguntas rápidas y te recomendamos las mejores opciones</p>
              
              {/* Barra de progreso */}
              <div className="quiz-progress-bar">
                <div
                  className="quiz-progress-fill"
                  style={{ width: quizStep === 1 ? '33%' : quizStep === 2 ? '66%' : '100%' }}
                />
              </div>
            </div>

            {/* PASO 1: Para quién */}
            {quizStep === 1 && (
              <div className="quiz-step-content">
                <h3>Paso 1: ¿Para quién es el perfume?</h3>
                <div className="quiz-options-grid">
                  {[
                    { key: 'Damas', title: 'Para Dama', icon: '🌸', desc: 'Aromas florales, dulces y envolventes' },
                    { key: 'Caballeros', title: 'Para Caballero', icon: '🎩', desc: 'Maderas, cítricos y toques intensos' },
                    { key: 'Unisex', title: 'Unisex / Compartir', icon: '✨', desc: 'Frescura moderna y versatilidad' }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      className={`quiz-option-btn ${quizAnswers.gender === opt.key ? 'selected' : ''}`}
                      onClick={() => {
                        setQuizAnswers({ ...quizAnswers, gender: opt.key });
                        setQuizStep(2);
                      }}
                    >
                      <span className="quiz-opt-icon">{opt.icon}</span>
                      <div className="quiz-opt-text">
                        <strong>{opt.title}</strong>
                        <small>{opt.desc}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PASO 2: Estilo de aroma */}
            {quizStep === 2 && (
              <div className="quiz-step-content">
                <h3>Paso 2: ¿Qué estilo de aroma prefieres?</h3>
                <div className="quiz-options-grid">
                  {[
                    { key: 'fresco', title: 'Fresco & Cítrico', icon: '🍋', desc: 'Limpio, enérgico y revitalizante' },
                    { key: 'dulce', title: 'Dulce & Gourmand', icon: '🍓', desc: 'Vainilla, frutos rojos y calidez' },
                    { key: 'elegante', title: 'Amaderado & Sofisticado', icon: '🪵', desc: 'Cedro, ámbar y presencia distinguida' }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      className="quiz-option-btn"
                      onClick={() => {
                        setQuizAnswers({ ...quizAnswers, vibe: opt.key });
                        setQuizStep(3);
                      }}
                    >
                      <span className="quiz-opt-icon">{opt.icon}</span>
                      <div className="quiz-opt-text">
                        <strong>{opt.title}</strong>
                        <small>{opt.desc}</small>
                      </div>
                    </button>
                  ))}
                </div>
                <button className="quiz-back-btn" onClick={() => setQuizStep(1)}>
                  ← Volver al paso anterior
                </button>
              </div>
            )}

            {/* PASO 3: Ocasión y Resultados */}
            {quizStep === 3 && (
              <div className="quiz-step-content">
                <div className="quiz-results-header">
                  <span className="congrats-icon">🎉</span>
                  <h3>¡Aquí están tus opciones recomendadas!</h3>
                  <p>Seleccionadas especialmente según tus gustos:</p>
                </div>

                <div className="quiz-results-grid">
                  {quizRecommended.length > 0 ? (
                    quizRecommended.map((p) => (
                      <div key={p.id} className="quiz-rec-item">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} />
                        ) : (
                          <div className="quiz-no-img">🧴</div>
                        )}
                        <div className="quiz-rec-details">
                          <span className="quiz-rec-brand">{p.brand?.name}</span>
                          <strong className="quiz-rec-name">{p.name}</strong>
                          <span className="quiz-rec-price">{formatPrice(p.price)}</span>
                        </div>
                        <button
                          className="quiz-rec-add"
                          onClick={() => {
                            addToCart(p, 1);
                            setQuizOpen(false);
                          }}
                        >
                          Añadir +
                        </button>
                      </div>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', color: '#888' }}>
                      Revisa nuestro catálogo completo para ver todas las fragancias disponibles.
                    </p>
                  )}
                </div>

                <div className="quiz-finish-actions">
                  <button
                    className="quiz-view-all-btn"
                    onClick={() => {
                      if (quizAnswers.gender) setSelectedGender(quizAnswers.gender);
                      setQuizOpen(false);
                      const el = document.getElementById('catalogo');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Ver todas las opciones de {quizAnswers.gender || 'catálogo'}
                  </button>
                  <button className="quiz-restart-btn" onClick={() => setQuizStep(1)}>
                    Reiniciar Quiz
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CARRITO LATERAL / BOTTOM SHEET (MÓVIL)
      ═══════════════════════════════════════════ */}
      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>

            {/* Header del carrito */}
            <div className="cart-header">
              <div className="cart-header-title">
                <h2>Tu Pedido</h2>
                <span className="cart-items-pill">{cartCount} {cartCount === 1 ? 'producto' : 'productos'}</span>
              </div>
              <button className="cart-close" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito">✕</button>
            </div>

            {/* Lista de productos */}
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <span className="cart-empty-icon">🛍️</span>
                  <h3>Tu carrito está vacío</h3>
                  <p>Explora nuestras exclusivas fragancias y añade tus favoritas</p>
                  <button className="cart-explore-btn" onClick={() => setCartOpen(false)}>
                    Ver Perfumes
                  </button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={item.id} className="cart-item" style={{ animationDelay: `${index * 0.04}s` }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="cart-item-image" />
                    ) : (
                      <div className="cart-item-image no-img">🧴</div>
                    )}

                    <div className="cart-item-details">
                      <div className="cart-item-topline">
                        <span className="cart-item-brand">{item.brand?.name || 'Perfume'}</span>
                        <button className="cart-item-remove" onClick={() => removeFromCart(item.id)} title="Eliminar">
                          ✕
                        </button>
                      </div>

                      <p className="cart-item-name">{item.name}</p>

                      <div className="cart-item-bottom">
                        <div className="cart-qty-controls">
                          <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                          <span className="cart-qty-display">{item.quantity}</span>
                          <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                        </div>
                        <span className="cart-item-subtotal">{formatPrice(parseFloat(item.price) * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer con resumen y checkout */}
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-payment-methods">
                  <span className="pay-methods-title">Formas de Pago:</span>
                  <div className="pay-methods-tags">
                    <span>💵 Divisas</span>
                    <span>📲 Pago Móvil</span>
                    <span>🏦 Transferencia BCV</span>
                  </div>
                </div>

                <div className="cart-total-box">
                  <span className="cart-total-label">Total a pagar:</span>
                  <span className="cart-total-amount">{formatPrice(cartTotal)}</span>
                </div>

                <button
                  className={`cart-checkout-btn ${whatsapp ? 'active' : 'disabled'}`}
                  disabled={!whatsapp}
                  onClick={handleCheckout}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span>Pedir por WhatsApp</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          BARRA DE NAVEGACIÓN FLOTANTE MÓVIL (BOTTOM BAR)
      ═══════════════════════════════════════════ */}
      <nav className="mobile-bottom-nav">
        <button
          className="bottom-nav-item"
          onClick={() => {
            resetFilters();
            const el = document.getElementById('catalogo');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span className="bottom-nav-icon">🛍️</span>
          <span className="bottom-nav-label">Tienda</span>
        </button>

        <button
          className="bottom-nav-item"
          onClick={() => { setQuizOpen(true); setQuizStep(1); }}
        >
          <span className="bottom-nav-icon">✨</span>
          <span className="bottom-nav-label">Quiz</span>
        </button>

        <button
          className={`bottom-nav-item ${onlyFavorites ? 'active' : ''}`}
          onClick={() => {
            setOnlyFavorites(!onlyFavorites);
            const el = document.getElementById('catalogo');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <div className="bottom-nav-icon-wrap">
            <span className="bottom-nav-icon">❤️</span>
            {favorites.length > 0 && <span className="bottom-badge">{favorites.length}</span>}
          </div>
          <span className="bottom-nav-label">Deseos</span>
        </button>

        <button
          className="bottom-nav-item primary-cart-item"
          onClick={() => setCartOpen(true)}
        >
          <div className="bottom-nav-icon-wrap">
            <span className="bottom-nav-icon">🛒</span>
            {cartCount > 0 && <span className="bottom-badge cart-color">{cartCount}</span>}
          </div>
          <span className="bottom-nav-label">Carrito</span>
        </button>

        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace('+', '')}`}
            target="_blank"
            rel="noreferrer"
            className="bottom-nav-item wa-item"
          >
            <span className="bottom-nav-icon">💬</span>
            <span className="bottom-nav-label">Chat</span>
          </a>
        )}
      </nav>

      {/* ═══════════════════════════════════════════
          FOOTER EDITORIAL
      ═══════════════════════════════════════════ */}
      <footer className="store-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo-row">
              <img src="/logo2.jpg" alt="Mayra Shop" className="footer-logo" onError={(e) => { e.target.src = '/logo.jpeg'; }} />
              <div>
                <h3>MAYRA SHOP</h3>
                <span className="footer-sub">Haute Parfumerie & Cosmética</span>
              </div>
            </div>
            <p>
              Tu boutique de fragancias exclusivas y cuidado corporal.
              Autenticidad y distinción en cada detalle para hacerte brillar.
            </p>
          </div>

          <div className="footer-section">
            <h4>Atención & Pedidos</h4>
            <ul>
              {whatsapp && (
                <li>
                  <span className="footer-icon">📱</span>
                  WhatsApp: <strong>{whatsapp}</strong>
                </li>
              )}
              <li>
                <span className="footer-icon">💬</span>
                Asesoría personalizada por chat
              </li>
              <li>
                <span className="footer-icon">🚚</span>
                Envíos y entregas coordinadas
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Métodos de Pago</h4>
            <ul>
              <li>
                <span className="footer-icon">💵</span>
                Divisas (Efectivo)
              </li>
              <li>
                <span className="footer-icon">📲</span>
                Pago Móvil
              </li>
              <li>
                <span className="footer-icon">🏦</span>
                Transferencias Bancarias (Tasa BCV)
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} <span>Mayra Shop</span>. Todos los derechos reservados.</p>
          <div className="footer-tags">
            <span>Original 100%</span> • <span>Elegancia</span> • <span>Exclusividad</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
