import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:3001/api';

export default function Admin() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  async function fetchUsers() {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(API + '/users', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setUsers(res.data);
    } catch (e: any) {
      alert('Error fetching users: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  }

  async function changeRole(id: string, role: string) {
    if (!token) return;
    try {
      const res = await axios.put(
        API + '/users',
        { id, role },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      // Update state safely using previous state
      setUsers(prevUsers =>
        prevUsers.map(u => (u.id === id ? { ...u, role: res.data.role } : u))
      );
    } catch (e: any) {
      alert('Error updating role: ' + (e.response?.data?.error || e.message));
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUsers([]);
  }

  if (!token)
    return (
      <div className="container card p-4 border rounded shadow">
        <div>Please login as admin first.</div>
      </div>
    );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin - User Role Management</h1>

      <div className="card p-4 border rounded shadow">
        <div className="flex justify-between mb-2">
          <h2 className="text-lg font-semibold">Users</h2>
          <button
            className="button bg-red-500 text-white p-1 rounded"
            onClick={logout}
          >
            Logout
          </button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-2">Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-gray-300">
                  <td className="py-2">{u.email}</td>
                  <td>{u.name || '-'}</td>
                  <td>{u.role}</td>
                  <td className="flex gap-2 py-1">
                    <button
                      className="button bg-blue-500 text-white p-1 rounded"
                      onClick={() => changeRole(u.id, 'user')}
                    >
                      Set User
                    </button>
                    <button
                      className="button bg-green-500 text-white p-1 rounded"
                      onClick={() => changeRole(u.id, 'admin')}
                    >
                      Set Admin
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
