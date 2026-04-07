import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t bg-primary text-primary-foreground">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="mb-3 font-display text-lg font-semibold">Rufino's Furniture</h3>
          <p className="text-sm opacity-80">Making quality furniture accessible. Crafted with care, delivered with love.</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm uppercase tracking-wider opacity-70">Quick Links</h4>
          <div className="flex flex-col gap-1.5">
            <Link to="/shop" className="text-sm opacity-80 hover:opacity-100 transition-opacity">Shop</Link>
            <Link to="/cart" className="text-sm opacity-80 hover:opacity-100 transition-opacity">Cart</Link>
            <Link to="/orders" className="text-sm opacity-80 hover:opacity-100 transition-opacity">Orders</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-sm uppercase tracking-wider opacity-70">Contact</h4>
          <p className="text-sm opacity-80">rufinos.furniture@email.com</p>
          <p className="text-sm opacity-80">+63 917 123 4567</p>
        </div>
      </div>
      <div className="mt-8 border-t border-primary-foreground/20 pt-6 text-center text-xs opacity-60">
        © 2026 Rufino's Furniture. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
