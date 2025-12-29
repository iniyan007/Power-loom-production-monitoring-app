// ...existing code...
import { useState } from "react";
import { api } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async (e) => {
    e?.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      window.location.reload();
    } catch {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={login} className="w-full max-w-sm bg-white shadow rounded-lg p-6 space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">Login</h2>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
          <input
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Email"
            onChange={e => setEmail(e.target.value)}
            value={email}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
          <input
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Password"
            type="password"
            onChange={e => setPassword(e.target.value)}
            value={password}
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}
// ...existing code...