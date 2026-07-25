import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import { CartProvider } from "./store/cart";
import Home from "./pages/Home";
import Story from "./pages/Story";
import Product from "./pages/Product";
import Gifting from "./pages/Gifting";
import Wholesale from "./pages/Wholesale";
import Faq from "./pages/Faq";
import OrderSuccess from "./pages/OrderSuccess";
import OrderCancelled from "./pages/OrderCancelled";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <CartProvider>
      <a className="skip-link" href="#main">Skip to content</a>
      <Nav />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/story" element={<Story />} />
          <Route path="/reserve" element={<Product />} />
          <Route path="/gifting" element={<Gifting />} />
          <Route path="/wholesale" element={<Wholesale />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/order/success" element={<OrderSuccess />} />
          <Route path="/order/cancelled" element={<OrderCancelled />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
