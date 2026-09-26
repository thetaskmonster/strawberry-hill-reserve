import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { usePageMeta } from "./lib/seo";
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
import Policy from "./pages/Policy";
import Contact from "./pages/Contact";
import ScrollManager from "./components/ScrollManager";

export default function App() {
  // Per-route title/description/canonical/OG/JSON-LD, applied on every
  // navigation and captured by the build-time prerender.
  usePageMeta(useLocation().pathname);
  return (
    <CartProvider>
      <ScrollManager />
      <a className="skip-link" href="#main">Skip to content</a>
      <Nav />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/story" element={<Story />} />
          {/* Path kept as /reserve on purpose. The PRODUCT was renamed to
              "Strawberry Hill" on 2026-09-08, but seo.ts keys its page meta and
              product structured data off this literal string, and internal
              links across the site point here. Count them rather than trusting
              a number in a comment: grep -rn '/reserve' src
              Renaming the slug is a separate change. */}
          <Route path="/reserve" element={<Product />} />
          <Route path="/gifting" element={<Gifting />} />
          <Route path="/wholesale" element={<Wholesale />} />
          <Route path="/faq" element={<Faq />} />
          {/* Policy pages. Copy: src/content/legal.ts. /returns is the word
              people type; /refunds is the page. */}
          <Route path="/terms" element={<Policy id="terms" />} />
          <Route path="/privacy" element={<Policy id="privacy" />} />
          <Route path="/shipping" element={<Policy id="shipping" />} />
          <Route path="/refunds" element={<Policy id="refunds" />} />
          <Route path="/returns" element={<Navigate to="/refunds" replace />} />
          <Route path="/contact" element={<Contact />} />
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
