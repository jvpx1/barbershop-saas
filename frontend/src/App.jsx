import { Routes, Route } from "react-router-dom";
import BarbershopPage from "./pages/BarberShopPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/:slug" element={<BarbershopPage />} />
      <Route path="*" element={<p className="p-8 text-center">Página não encontrada</p>} />
    </Routes>
  );
}