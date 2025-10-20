import React, { useState } from "react";
import { login, register } from "../api/api";

interface LoginPageProps {
  onLogin: (token: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function handleLogin() {
    console.log("[LOGIN] Attempting login for:", email);
    try {
      const token = await login(email, password);
      console.log("[LOGIN] Success");
      onLogin(token);
    } catch (e: any) {
      console.error("[LOGIN] Failed:", e.message);
      alert("Login failed: " + e.message);
    }
  }

  async function handleRegister() {
    console.log("[REGISTER] Attempting registration for:", email);
    try {
      await register(email, password, name);
      console.log("[REGISTER] Success");
      alert("Registered! Now login.");
    } catch (e: any) {
      console.error("[REGISTER] Failed:", e.message);
      alert("Registration failed: " + e.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-6 bg-slate-800 rounded-lg text-white space-y-3">
        <h2 className="text-2xl font-bold text-center">Job Scheduler</h2>
        <input
          className="w-full px-4 py-2 bg-slate-700 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full px-4 py-2 bg-slate-700 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="w-full px-4 py-2 bg-slate-700 rounded"
          placeholder="Name (for register)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded" onClick={handleLogin}>
            Login
          </button>
          <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded" onClick={handleRegister}>
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
