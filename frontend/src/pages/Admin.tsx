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

  if (!token) return <div className="p-4">Please login as admin first.</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Admin Panel</h1>
      <button className="bg-red-500 text-white px-3 py-1 rounded mb-4" onClick={logout}>
        Logout
      </button>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td>{u.email}</td>
              <td>{u.name || "-"}</td>
              <td>{u.role}</td>
              <td className="flex gap-2">
                <button
                  className="bg-blue-500 text-black px-2 py-1 rounded"
                  onClick={() => changeRole(u.id, "user")}
                >
                  Set User
                </button>
                <button
                  className="bg-green-500 text-black px-2 py-1 rounded"
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
  );
}
