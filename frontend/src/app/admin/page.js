"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || user?.role !== 'admin') {
      router.replace('/login');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch users (requires backend admin endpoint)
        const usersRes = await fetch(`${apiUrl}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = await usersRes.json();

        // Fetch orders (requires backend orders endpoint)
        const ordersRes = await fetch(`${apiUrl}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ordersData = await ordersRes.json();

        if (!usersRes.ok) throw new Error(usersData?.message || 'Failed to load users');
        if (!ordersRes.ok) throw new Error(ordersData?.message || 'Failed to load orders');

        setUsers(usersData.users || usersData || []);
        setOrders(ordersData.orders || ordersData || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const updateUserRole = async (id, role) => {
    try {
      const res = await fetch(`${apiUrl}/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to update user');
      setUsers((prev) => prev.map((u) => (u._id === id ? data.user || { ...u, role } : u)));
      alert('User updated');
    } catch (e) {
      alert(e.message);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const res = await fetch(`${apiUrl}/api/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderStatus: status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to update order');
      setOrders((prev) => prev.map((o) => (o._id === id ? data.order || { ...o, orderStatus: status } : o)));
      alert('Order updated');
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Users</h2>
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2 capitalize">{u.role || (u.isAdmin ? 'admin' : 'customer')}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => updateUserRole(u._id, 'admin')}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Make Admin
                    </button>
                    <button
                      onClick={() => updateUserRole(u._id, 'customer')}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Make Customer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Orders</h2>
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Order ID</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-t">
                  <td className="px-4 py-2">{o._id}</td>
                  <td className="px-4 py-2">{o.user?.name || o.user}</td>
                  <td className="px-4 py-2">���{o.totalPrice}</td>
                  <td className="px-4 py-2 capitalize">{o.orderStatus}</td>
                  <td className="px-4 py-2 space-x-2">
                    {['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateOrderStatus(o._id, s)}
                        className={`px-3 py-1 rounded text-white ${
                          s === 'delivered' ? 'bg-green-600 hover:bg-green-700' :
                          s === 'cancelled' ? 'bg-red-600 hover:bg-red-700' :
                          'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
