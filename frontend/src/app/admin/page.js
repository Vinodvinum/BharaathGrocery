"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function emptyProductForm() {
  return {
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    images: '',
    featured: false
  };
}

function normalizeProductPayload(form) {
  return {
    name: form.name,
    description: form.description,
    price: Number(form.price),
    stock: Number(form.stock),
    category: form.category,
    images: form.images.split(',').map((entry) => entry.trim()).filter(Boolean),
    featured: !!form.featured
  };
}

export default function AdminDashboard() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [tab, setTab] = useState('dashboard');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const [metrics, setMetrics] = useState({ totalUsers: 0, totalOrders: 0, totalRevenue: 0, totalProducts: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [editingCategoryId, setEditingCategoryId] = useState('');

  const [productForm, setProductForm] = useState(emptyProductForm());
  const [editingProductId, setEditingProductId] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '' });
    setEditingCategoryId('');
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm());
    setEditingProductId('');
  };

  const boot = useCallback(async (authTokenFromArgs) => {
    const storedToken = authTokenFromArgs || localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!storedToken || user?.role !== 'admin') {
      window.location.href = '/login';
      return;
    }

    setToken(storedToken);
    setLoading(true);
    setError('');

    try {
      const [dashboardRes, categoriesRes, productsRes, ordersRes, usersRes] = await Promise.all([
        axios.get(`${apiUrl}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${storedToken}` } }),
        axios.get(`${apiUrl}/api/categories?includeInactive=true`),
        axios.get(`${apiUrl}/api/products?includeInactive=true&limit=100`, { headers: { Authorization: `Bearer ${storedToken}` } }),
        axios.get(`${apiUrl}/api/orders`, { headers: { Authorization: `Bearer ${storedToken}` } }),
        axios.get(`${apiUrl}/api/users`, { headers: { Authorization: `Bearer ${storedToken}` } })
      ]);

      setMetrics(dashboardRes.data.metrics || {});
      setRecentOrders(dashboardRes.data.recentOrders || []);
      setTopProducts(dashboardRes.data.topProducts || []);
      setCategories(categoriesRes.data.categories || []);
      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
      setUsers(usersRes.data.users || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    boot();
  }, [boot]);

  const withWork = async (runner) => {
    try {
      setWorking(true);
      setError('');
      await runner();
      await boot(token || undefined);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setWorking(false);
    }
  };

  const submitCategory = async (e) => {
    e.preventDefault();
    const payload = { name: categoryForm.name.trim(), description: categoryForm.description.trim() };
    if (!payload.name) return;

    await withWork(async () => {
      if (editingCategoryId) {
        await axios.put(`${apiUrl}/api/categories/${editingCategoryId}`, payload, { headers: authHeaders });
      } else {
        await axios.post(`${apiUrl}/api/categories`, payload, { headers: authHeaders });
      }
      resetCategoryForm();
    });
  };

  const editCategory = (category) => {
    setEditingCategoryId(category._id);
    setCategoryForm({ name: category.name || '', description: category.description || '' });
    setTab('categories');
  };

  const deleteCategory = async (id) => {
    await withWork(async () => {
      await axios.delete(`${apiUrl}/api/categories/${id}`, { headers: authHeaders });
    });
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    const payload = normalizeProductPayload(productForm);

    await withWork(async () => {
      if (editingProductId) {
        await axios.put(`${apiUrl}/api/products/${editingProductId}`, payload, { headers: authHeaders });
      } else {
        await axios.post(`${apiUrl}/api/products`, payload, { headers: authHeaders });
      }
      resetProductForm();
    });
  };

  const editProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      category: product.category?._id || product.category || '',
      images: Array.isArray(product.images) ? product.images.join(', ') : '',
      featured: !!product.featured
    });
    setTab('products');
  };

  const deleteProduct = async (id) => {
    await withWork(async () => {
      await axios.delete(`${apiUrl}/api/products/${id}`, { headers: authHeaders });
    });
  };

  const toggleFeatured = async (product) => {
    await withWork(async () => {
      await axios.put(`${apiUrl}/api/products/${product._id}`, { featured: !product.featured }, { headers: authHeaders });
    });
  };

  const updateOrder = async (orderId, patch) => {
    await withWork(async () => {
      await axios.put(`${apiUrl}/api/orders/${orderId}`, patch, { headers: authHeaders });
    });
  };

  const updateUser = async (userId, patch) => {
    await withWork(async () => {
      await axios.put(`${apiUrl}/api/users/${userId}`, patch, { headers: authHeaders });
      if (selectedUser?._id === userId) {
        const detailsRes = await axios.get(`${apiUrl}/api/users/${userId}`, { headers: authHeaders });
        setUserDetails(detailsRes.data || null);
      }
    });
  };

  const openUserDetails = async (userRow) => {
    setSelectedUser(userRow);
    setDetailsLoading(true);
    setUserDetails(null);
    try {
      const { data } = await axios.get(`${apiUrl}/api/users/${userRow._id}`, { headers: authHeaders });
      setUserDetails(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading admin panel...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6">
        <aside className="bg-white rounded-xl shadow p-4 h-fit">
          <h2 className="text-lg font-bold">Admin Workflow</h2>
          <p className="text-sm text-gray-500 mb-4">Manage dashboard, products, categories, orders, and users.</p>

          {[
            ['dashboard', 'Dashboard'],
            ['products', 'Product Management'],
            ['categories', 'Category Management'],
            ['orders', 'Order Management'],
            ['users', 'User Management']
          ].map(([value, label]) => (
            <button
              key={value}
              className={`w-full text-left px-3 py-2 rounded mb-2 ${tab === value ? 'bg-green-600 text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}

          <div className="border-t pt-4 mt-4 text-sm text-gray-600 space-y-1">
            <p>Users: <span className="font-semibold">{metrics.totalUsers}</span></p>
            <p>Orders: <span className="font-semibold">{metrics.totalOrders}</span></p>
            <p>Revenue: <span className="font-semibold">{money(metrics.totalRevenue)}</span></p>
          </div>
        </aside>

        <section className="space-y-6">
          {!!error && <div className="bg-red-100 text-red-700 rounded-lg px-4 py-3">{error}</div>}
          {working && <div className="bg-blue-100 text-blue-700 rounded-lg px-4 py-3">Updating data...</div>}

          {tab === 'dashboard' && (
            <>
              <h1 className="text-2xl font-bold">Dashboard Overview</h1>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow"><p className="text-sm text-gray-500">Total Users</p><p className="text-2xl font-bold">{metrics.totalUsers}</p></div>
                <div className="bg-white p-4 rounded-xl shadow"><p className="text-sm text-gray-500">Total Orders</p><p className="text-2xl font-bold">{metrics.totalOrders}</p></div>
                <div className="bg-white p-4 rounded-xl shadow"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold">{money(metrics.totalRevenue)}</p></div>
                <div className="bg-white p-4 rounded-xl shadow"><p className="text-sm text-gray-500">Total Products</p><p className="text-2xl font-bold">{metrics.totalProducts}</p></div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow p-4">
                  <h3 className="font-semibold mb-3">Recent Orders</h3>
                  <div className="space-y-2">
                    {recentOrders.map((order) => (
                      <div key={order._id} className="border rounded p-2 text-sm">
                        <div className="font-medium">{order.user?.name || 'Unknown user'}</div>
                        <div className="text-gray-600">{money(order.totalAmount)} | {order.status} | {order.paymentStatus}</div>
                        <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
                      </div>
                    ))}
                    {recentOrders.length === 0 && <p className="text-sm text-gray-500">No orders yet.</p>}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow p-4">
                  <h3 className="font-semibold mb-3">Top Selling Products</h3>
                  <div className="space-y-2">
                    {topProducts.map((product) => (
                      <div key={product._id} className="border rounded p-2 text-sm flex justify-between">
                        <span>{product.name}</span>
                        <span>{product.sold || 0} sold</span>
                      </div>
                    ))}
                    {topProducts.length === 0 && <p className="text-sm text-gray-500">No product sales yet.</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'categories' && (
            <>
              <h1 className="text-2xl font-bold">Category Management</h1>

              <form onSubmit={submitCategory} className="bg-white p-4 rounded-xl shadow grid md:grid-cols-3 gap-3">
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Category name"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((v) => ({ ...v, name: e.target.value }))}
                />
                <input
                  className="border rounded px-3 py-2"
                  placeholder="Description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((v) => ({ ...v, description: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button className="bg-green-600 text-white rounded px-3 py-2 w-full" disabled={working}>
                    {editingCategoryId ? 'Update Category' : 'Add Category'}
                  </button>
                  {editingCategoryId && (
                    <button type="button" className="bg-gray-200 rounded px-3 py-2" onClick={resetCategoryForm}>Cancel</button>
                  )}
                </div>
              </form>

              <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="p-3 text-left">Name</th><th className="p-3 text-left">Description</th><th className="p-3 text-left">Actions</th></tr></thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category._id} className="border-t">
                        <td className="p-3">{category.name}</td>
                        <td className="p-3">{category.description || '-'}</td>
                        <td className="p-3 space-x-2">
                          <button className="px-2 py-1 bg-gray-200 rounded" onClick={() => editCategory(category)}>Edit</button>
                          <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => deleteCategory(category._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'products' && (
            <>
              <h1 className="text-2xl font-bold">Product Management</h1>

              <form onSubmit={submitProduct} className="bg-white p-4 rounded-xl shadow grid md:grid-cols-2 gap-3">
                <input className="border rounded px-3 py-2" placeholder="Product name" required value={productForm.name} onChange={(e) => setProductForm((v) => ({ ...v, name: e.target.value }))} />
                <select className="border rounded px-3 py-2" required value={productForm.category} onChange={(e) => setProductForm((v) => ({ ...v, category: e.target.value }))}>
                  <option value="">Select category</option>
                  {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                </select>
                <input className="border rounded px-3 py-2" placeholder="Price" type="number" min="0" required value={productForm.price} onChange={(e) => setProductForm((v) => ({ ...v, price: e.target.value }))} />
                <input className="border rounded px-3 py-2" placeholder="Stock" type="number" min="0" required value={productForm.stock} onChange={(e) => setProductForm((v) => ({ ...v, stock: e.target.value }))} />
                <textarea className="border rounded px-3 py-2 md:col-span-2" placeholder="Description" required value={productForm.description} onChange={(e) => setProductForm((v) => ({ ...v, description: e.target.value }))} />
                <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Image URLs (comma separated)" value={productForm.images} onChange={(e) => setProductForm((v) => ({ ...v, images: e.target.value }))} />
                <label className="flex items-center gap-2"><input type="checkbox" checked={productForm.featured} onChange={(e) => setProductForm((v) => ({ ...v, featured: e.target.checked }))} /> Featured</label>
                <div className="flex gap-2">
                  <button className="bg-green-600 text-white rounded px-3 py-2 w-full" disabled={working}>
                    {editingProductId ? 'Update Product' : 'Add Product'}
                  </button>
                  {editingProductId && (
                    <button type="button" className="bg-gray-200 rounded px-3 py-2" onClick={resetProductForm}>Cancel</button>
                  )}
                </div>
              </form>

              <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="p-3 text-left">Product</th><th className="p-3 text-left">Category</th><th className="p-3 text-left">Price</th><th className="p-3 text-left">Stock</th><th className="p-3 text-left">Featured</th><th className="p-3 text-left">Actions</th></tr></thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id} className="border-t">
                        <td className="p-3">{product.name}</td>
                        <td className="p-3">{product.category?.name || '-'}</td>
                        <td className="p-3">{money(product.price)}</td>
                        <td className="p-3">{product.stock}</td>
                        <td className="p-3">{product.featured ? 'Yes' : 'No'}</td>
                        <td className="p-3 space-x-2">
                          <button className="px-2 py-1 bg-gray-200 rounded" onClick={() => editProduct(product)}>Edit</button>
                          <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => toggleFeatured(product)}>{product.featured ? 'Unfeature' : 'Feature'}</button>
                          <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => deleteProduct(product._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'orders' && (
            <>
              <h1 className="text-2xl font-bold">Order Management</h1>
              <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="p-3 text-left">User</th><th className="p-3 text-left">Items</th><th className="p-3 text-left">Total</th><th className="p-3 text-left">Payment</th><th className="p-3 text-left">Order Status</th><th className="p-3 text-left">Updated</th></tr></thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id} className="border-t align-top">
                        <td className="p-3">{order.user?.name || 'Unknown'}<br /><span className="text-gray-500">{order.user?.email || '-'}</span></td>
                        <td className="p-3">{order.items?.map((item) => `${item.name} x${item.quantity}`).join(', ')}</td>
                        <td className="p-3">{money(order.totalAmount)}</td>
                        <td className="p-3">
                          <select
                            className="border rounded px-2 py-1"
                            value={order.paymentStatus}
                            onChange={(e) => updateOrder(order._id, { paymentStatus: e.target.value })}
                          >
                            {PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            className="border rounded px-2 py-1"
                            value={order.status}
                            onChange={(e) => updateOrder(order._id, { status: e.target.value })}
                          >
                            {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </td>
                        <td className="p-3 text-gray-600">{formatDate(order.updatedAt || order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'users' && (
            <>
              <h1 className="text-2xl font-bold">User Management</h1>

              <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-4">
                <div className="bg-white rounded-xl shadow overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-3 text-left">User</th><th className="p-3 text-left">Role</th><th className="p-3 text-left">Orders</th><th className="p-3 text-left">Spent</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Actions</th></tr></thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id} className="border-t">
                          <td className="p-3">{user.name}<br /><span className="text-gray-500">{user.email}</span></td>
                          <td className="p-3 capitalize">{user.role}</td>
                          <td className="p-3">{user.totalOrders || 0}</td>
                          <td className="p-3">{money(user.totalSpent || 0)}</td>
                          <td className="p-3">{user.isBlocked ? 'Blocked' : 'Active'}</td>
                          <td className="p-3 space-x-2">
                            <button className="px-2 py-1 bg-gray-200 rounded" onClick={() => openUserDetails(user)}>View</button>
                            <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => updateUser(user._id, { role: user.role === 'admin' ? 'customer' : 'admin' })}>
                              {user.role === 'admin' ? 'Make Customer' : 'Make Admin'}
                            </button>
                            <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => updateUser(user._id, { isBlocked: !user.isBlocked })}>
                              {user.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white rounded-xl shadow p-4">
                  <h3 className="text-lg font-semibold mb-3">User Details</h3>

                  {!selectedUser && <p className="text-gray-500 text-sm">Select a user to view profile, cart, and order history.</p>}
                  {detailsLoading && <p className="text-gray-500 text-sm">Loading user details...</p>}

                  {selectedUser && userDetails && !detailsLoading && (
                    <div className="space-y-4">
                      <div className="text-sm">
                        <p><span className="font-semibold">Name:</span> {userDetails.user?.name}</p>
                        <p><span className="font-semibold">Email:</span> {userDetails.user?.email}</p>
                        <p><span className="font-semibold">Phone:</span> {userDetails.user?.phone || '-'}</p>
                        <p><span className="font-semibold">Role:</span> {userDetails.user?.role}</p>
                      </div>

                      <div>
                        <p className="font-semibold mb-2">Cart</p>
                        {userDetails.cart?.items?.length ? (
                          <ul className="text-sm text-gray-700 space-y-1">
                            {userDetails.cart.items.map((item) => (
                              <li key={item._id}>{item.product?.name || 'Item'} x{item.quantity}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">Cart is empty.</p>
                        )}
                      </div>

                      <div>
                        <p className="font-semibold mb-2">Order History</p>
                        {userDetails.orders?.length ? (
                          <div className="space-y-2 max-h-64 overflow-auto pr-1">
                            {userDetails.orders.map((order) => (
                              <div key={order._id} className="border rounded p-2 text-sm">
                                <p className="font-medium">{money(order.totalAmount)} | {order.status}</p>
                                <p className="text-gray-600">{formatDate(order.createdAt)}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No orders yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
