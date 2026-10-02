'use client';
import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';

export default function Home() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [whatsapp, setWhatsapp] = useState('');
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [selectedGender, setSelectedGender] = useState('Todos');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    // Al cargar la página, buscamos los productos reales de la base de datos
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
        }
        
        // Cargar también las categorías reales para los botones
        const resCat = await fetch('/api/categories');
        const dataCat = await resCat.json();
        if (Array.isArray(dataCat)) {
          setCategories(dataCat);
        }

        // Cargar marcas
        const resBrand = await fetch('/api/brands');
        const dataBrand = await resBrand.json();
        if (Array.isArray(dataBrand)) {
          setBrands(dataBrand);
        }

        // Cargar configuraciones de WhatsApp y moneda
        const resConfig = await fetch('/api/settings');
        const dataConfig = await resConfig.json();
        if (dataConfig && typeof dataConfig === 'object') {
          if (dataConfig.whatsapp) setWhatsapp(dataConfig.whatsapp);
          if (dataConfig.currency) setCurrency(dataConfig.currency);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    fetchProducts();
  }, []);

  const formatPrice = (price) => {
    const symbol = currency === 'VES' ? 'Bs' : currency === 'DOP' ? 'RD$' : currency === 'EUR' ? '€' : '$';
    return `${symbol}${parseFloat(price).toFixed(2)} ${currency}`;
  };

  const addToCart = (product) => {
    const countInCart = cart.filter(p => p.id === product.id).length;
    if (countInCart >= product.stock) {
      toast.error(`Solo quedan ${product.stock} unidades disponibles`, { style: { background: '#e74c3c', color: 'white' } });
      return;
    }
    setCart([...cart, product]);
    toast.success(`${product.name} añadido al carrito!`, {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  // Lógica de filtrado
  const filteredProducts = products.filter(product => {
    if (!product.isAvailable || product.stock <= 0) return false;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.brand?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || product.category?.name === selectedCategory;
    const matchesBrand = selectedBrand === 'Todas' || product.brand?.name === selectedBrand;
    const matchesGender = selectedGender === 'Todos' || product.gender === selectedGender;
    return matchesSearch && matchesCategory && matchesBrand && matchesGender;
  });

  return (
    <main>
      <nav className="navbar" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
        <h1 style={{ color: '#1a1a1a', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Mayra Shop</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp.replace('+', '')}`} target="_blank" rel="noreferrer" style={{ background: '#25D366', color: 'white', padding: '0.5rem 1rem', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontWeight: 'bold', transition: 'transform 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} title="Contáctanos">
              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" style={{ width: '28px', height: '28px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                <span style={{ fontSize: '0.9rem' }}>Contáctanos</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>{whatsapp}</span>
              </div>
            </a>
          )}
          <button onClick={() => setCartOpen(true)} style={{ background: '#1a1a1a', color: '#d4af37', padding: '0.8rem 1.5rem', borderRadius: '4px', border: '1px solid #d4af37', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            🛒 Carrito
            {cart.length > 0 && (
              <span style={{ background: '#d4af37', color: '#1a1a1a', padding: '0.2rem 0.6rem', borderRadius: '50%', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Alertas modernas */}
      <Toaster position="top-right" />

      <section className="hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '300' }}>Bienvenidos a</h2>
        <img src="/logo.jpeg" alt="Mayra Shop Logo" style={{ width: '180px', height: '180px', objectFit: 'contain', borderRadius: '50%', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', border: '4px solid #d4af37' }} />
        <p style={{ marginTop: '0.5rem' }}>Tu esencia, tu estilo. Descubre nuestra colección exclusiva.</p>
      </section>

      <div className="container">
        
        {/* Barra de Filtros */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <input 
            type="text" 
            placeholder="🔍 Buscar por nombre o marca..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', maxWidth: '400px', padding: '1rem', borderRadius: '30px', border: '1px solid #ccc', fontSize: '1rem', margin: '0 auto', display: 'block' }}
          />

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '0.8rem', borderRadius: '20px', border: '1px solid #ccc', outline: 'none', background: 'white', color: '#333' }}
            >
              <option value="Todas">Todas las Categorías</option>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>

            <select 
              value={selectedBrand} 
              onChange={(e) => setSelectedBrand(e.target.value)}
              style={{ padding: '0.8rem', borderRadius: '20px', border: '1px solid #ccc', outline: 'none', background: 'white', color: '#333' }}
            >
              <option value="Todas">Todas las Marcas</option>
              {brands.map(brand => <option key={brand.id} value={brand.name}>{brand.name}</option>)}
            </select>

            <select 
              value={selectedGender} 
              onChange={(e) => setSelectedGender(e.target.value)}
              style={{ padding: '0.8rem', borderRadius: '20px', border: '1px solid #ccc', outline: 'none', background: 'white', color: '#333' }}
            >
              <option value="Todos">Todos los Géneros</option>
              <option value="Damas">Damas</option>
              <option value="Caballeros">Caballeros</option>
              <option value="Unisex">Unisex</option>
              <option value="Infantil">Infantil</option>
            </select>
          </div>

        </div>

        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#7F8C8D' }}>
            <h4>No encontramos productos que coincidan con tu búsqueda.</h4>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <img src={product.imageUrl} alt={product.name} className="product-img" />
                <span className="product-brand">{product.brand?.name}</span>
                <h4 className="product-name">{product.name}</h4>
                <p className="product-price">{formatPrice(product.price)}</p>
                <button 
                  className="add-to-cart"
                  onClick={() => addToCart(product)}
                >
                  Añadir al carrito
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal / Sidebar del Carrito */}
      {cartOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '400px', height: '100vh', padding: '2rem', display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 15px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '1px' }}>Tu Carrito</h2>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888', marginTop: '2rem' }}>Tu carrito está vacío.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {cart.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{item.name}</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{formatPrice(item.price)}</p>
                      </div>
                      <button onClick={() => setCart(cart.filter((_, i) => i !== index))} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}>
              <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fff', borderRadius: '4px', border: '1px solid #d4af37' }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#1a1a1a', fontSize: '0.95rem' }}>Métodos de pago aceptados:</p>
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#333' }}>
                  <li>Divisas (Efectivo)</li>
                  <li>Transferencia o Pago Móvil (Tasa BCV)</li>
                </ul>
              </div>
              <h3 style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#1a1a1a', textTransform: 'uppercase' }}>
                <span>Total:</span>
                <span style={{ color: '#d4af37' }}>{formatPrice(cart.reduce((sum, item) => sum + parseFloat(item.price), 0))}</span>
              </h3>
              <button 
                disabled={cart.length === 0 || !whatsapp}
                onClick={async () => {
                  toast.loading('Registrando pedido...', { id: 'order' });
                  
                  // Agrupar items por id y contar cantidad
                  const groupedItemsMap = new Map();
                  cart.forEach(item => {
                    if (groupedItemsMap.has(item.id)) {
                      groupedItemsMap.get(item.id).quantity += 1;
                    } else {
                      groupedItemsMap.set(item.id, { productId: item.id, name: item.name, price: parseFloat(item.price), quantity: 1 });
                    }
                  });
                  const groupedItems = Array.from(groupedItemsMap.values());

                  try {
                    await fetch('/api/orders', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        customerName: "Cliente WhatsApp",
                        customerPhone: "",
                        paymentMethod: "POR ACORDAR",
                        status: "PENDING",
                        items: groupedItems
                      })
                    });
                    toast.success('Pedido registrado', { id: 'order' });

                    const text = `Hola, quiero hacer un pedido:\n\n${groupedItems.map(i => `- ${i.name} x${i.quantity} (${formatPrice(i.price * i.quantity)})`).join('\n')}\n\nTotal a Pagar: ${formatPrice(cart.reduce((sum, item) => sum + parseFloat(item.price), 0))}`;
                    window.open(`https://wa.me/${whatsapp.replace('+', '')}?text=${encodeURIComponent(text)}`, '_blank');
                    
                    setCart([]);
                    setCartOpen(false);
                  } catch (e) {
                    toast.error('Error al enviar el pedido', { id: 'order' });
                  }
                }}
                style={{ width: '100%', padding: '1rem', background: cart.length === 0 || !whatsapp ? '#ccc' : '#66A5AD', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: cart.length === 0 || !whatsapp ? 'not-allowed' : 'pointer', fontSize: '1.1rem' }}
              >
                {whatsapp ? 'Enviar Pedido por WhatsApp' : 'Falta configurar WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
