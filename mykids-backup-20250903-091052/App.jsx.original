import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import "./index.css";

function App() {
  // เปลี่ยนหน้า admin ได้จาก query string หรือเงื่อนไขอื่น ๆ
  const isAdmin = window.location.search.includes("admin");
  return isAdmin ? <AdminPage /> : <HomePage />;
}

export default App;
