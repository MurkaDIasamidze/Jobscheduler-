import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  async function fetchUsers() {
    try {
      const res = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (e: any) {
      alert("Fetch users failed: " + (e.response?.data?.error || e.message));
    }
  }

  async function changeRole(id: string, role: string) {
    try {
      const res = await axios.put(
        `${API}/users`,
        { id, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: res.data.role } : u))
      );
    } catch (e: any) {
      alert("Update role failed: " + (e.response?.data?.error || e.message));
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUsers([]);
  }

  if (!token)
    return <div className="p-6 text-center text-white">Please login as admin first.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4 text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button className="button bg-red-600 hover:bg-red-500" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full table-auto text-left">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="py-2">Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-700">
                <td className="py-2">{u.email}</td>
                <td>{u.name || "-"}</td>
                <td>{u.role}</td>
                <td className="flex gap-2 py-1">
                  <button
                    className="button bg-blue-500 hover:bg-blue-400 text-black"
                    onClick={() => changeRole(u.id, "user")}
                  >
                    Set User
                  </button>
                  <button
                    className="button bg-green-500 hover:bg-green-400 text-black"
                    onClick={() => changeRole(u.id, "admin")}
                  >
                    Set Admin
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
