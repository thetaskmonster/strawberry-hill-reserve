import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Story from "./pages/Story";
import Product from "./pages/Product";
import Gifting from "./pages/Gifting";
import Wholesale from "./pages/Wholesale";
import Faq from "./pages/Faq";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
