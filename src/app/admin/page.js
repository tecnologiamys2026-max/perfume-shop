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

  // Estados para Configuración
  const [whatsapp, setWhatsapp] = useState('');
  const [currency, setCurrency] = useState('USD');
  
  // Estado para modales personalizados
  const [modal, setModal] = useState({ isOpen: false, mode: '', type: '', id: null, name: '' });

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
      }
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
    setModal({ isOpen: true, mode: 'edit', type, id, name: currentName });
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
    
    // Validación básica
    if (!formData.get('name') || !formData.get('price') || !formData.get('categoryId') || !formData.get('brandId')) {
      toast.error('Por favor, llena los campos obligatorios');
      return;
    }
    
    toast.loading('Guardando producto...', { id: 'saveProduct' });
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Producto guardado correctamente', { id: 'saveProduct' });
      form.reset(); // Limpiar el formulario
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
        body: JSON.stringify({ whatsapp, currency })
      });
      if (!response.ok) throw new Error();
      toast.success('Configuración global actualizada', { id: 'saveConfig' });
    } catch (error) {
      toast.error('Error al guardar', { id: 'saveConfig' });
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
        <h2 style={{ color: '#2C3E50' }}>Panel de Administración - Mayra Shop</h2>
        <button onClick={() => setIsAuthenticated(false)} style={{ background: 'none', border: 'none', color: '#e74c3c', fontWeight: 'bold', cursor: 'pointer' }}>Cerrar Sesión</button>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => setActiveTab('productos')} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === 'productos' ? '#66A5AD' : '#e0e0e0', color: activeTab === 'productos' ? 'white' : 'black' }}>Gestión de Productos</button>
        <button onClick={() => setActiveTab('marcas')} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === 'marcas' ? '#66A5AD' : '#e0e0e0', color: activeTab === 'marcas' ? 'white' : 'black' }}>Categorías y Marcas</button>
        <button onClick={() => setActiveTab('config')} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === 'config' ? '#66A5AD' : '#e0e0e0', color: activeTab === 'config' ? 'white' : 'black' }}>Configuración Global</button>
      </div>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        
        {activeTab === 'productos' && (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Añadir Nuevo Producto</h3>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem', borderBottom: '1px solid #eee', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Nombre del Producto *</label>
                  <input name="name" type="text" placeholder="Ej. Aqua Di Gio" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Imagen (Archivo)</label>
                  <input name="image" type="file" accept="image/*" style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Precio *</label>
                  <input name="price" type="number" step="0.01" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Género</label>
                  <select name="gender" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}>
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
                  <select name="categoryId" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} required>
                    <option value="">Selecciona una categoría...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Marca *</label>
                  <select name="brandId" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }} required>
                    <option value="">Selecciona una marca...</option>
                    {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" style={{ background: '#B2D8D8', padding: '1rem', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Producto</button>
            </form>

            <h3 style={{ marginBottom: '1rem' }}>Lista de Productos</h3>
            {products.length === 0 ? (
               <p style={{ color: '#888', marginBottom: '1rem' }}>Aún no hay productos reales. Al guardar uno, aparecerá aquí.</p>
            ) : (
              <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f9f9f9' }}>
                    <tr>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Foto</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Nombre</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Marca</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Precio</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
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

    </div>
  );
}
