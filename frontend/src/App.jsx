import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import WeaverDashboard from "./pages/WeaverDashboard";

function App() {
  const role = localStorage.getItem("role");

  if (!role) return <Login />;

  if (role === "admin") return <AdminDashboard />;
  if (role === "weaver") return <WeaverDashboard />;

  return <Signup />;
}

export default App;
