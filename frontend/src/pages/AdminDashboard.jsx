import { useEffect, useState } from "react";
import { api } from "../services/api";
import Signup from "./Signup";

export default function AdminDashboard() {
  const [looms, setLooms] = useState([]);
  const [loomId, setLoomId] = useState("");

  useEffect(() => {
    api.get("/looms").then(res => setLooms(res.data));
  }, []);

  const createLoom = async () => {
    await api.post("/looms", { loomId });
    alert("Loom created");
    window.location.reload();
  };

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <h3>Create Loom</h3>
      <input placeholder="Loom ID" onChange={e => setLoomId(e.target.value)} />
      <button onClick={createLoom}>Add Loom</button>

      <h3>All Looms</h3>
      <ul>
        {looms.map(l => (
          <li key={l._id}>{l.loomId} – {l.status}</li>
        ))}
      </ul>

      <Signup />

      <button onClick={logout}>Logout</button>
    </div>
  );
}
