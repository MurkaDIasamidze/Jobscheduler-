import React, { useState, useEffect } from "react";
import ServerCheck from "./components/ServerCheck";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import { checkServerHealth } from "./api/api";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [serverStatus, setServerStatus] = useState<"checking" | "connected" | "error">("checking");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkServer();
  }, []);

  async function checkServer() {
    console.log("[SERVER_CHECK] Checking backend connection...");
    try {
      await checkServerHealth();
      console.log("[SERVER_CHECK] Server is healthy");
      setServerStatus("connected");
    } catch (e: any) {
      console.error("[SERVER_CHECK] Failed:", e.message);
      setErrorMessage(e.message || "Cannot connect to server");
      setServerStatus("error");
    }
  }

  function handleLogin(newToken: string) {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  }

  function handleLogout() {
    setToken(null);
    localStorage.removeItem("token");
  }

  if (serverStatus === "checking") {
    return <ServerCheck status="checking" />;
  }

  if (serverStatus === "error") {
    return <ServerCheck status="error" errorMessage={errorMessage} onRetry={checkServer} />;
  }

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard token={token} onLogout={handleLogout} />;
}
