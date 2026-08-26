import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t bg-primary text-primary-foreground">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <img
            src="/logo.png"
            alt="Rufino's Furniture"
            className="mb-3 h-20 w-auto object-contain"
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.15))' }}
          />
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
          <a
            href="https://www.facebook.com/rufino.cabasag.furniture"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 flex-shrink-0"
              aria-hidden="true"
            >
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.271h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
            </svg>
            Rufino Cabasag Furniture
          </a>
        </div>
      </div>
      <div className="mt-8 border-t border-primary-foreground/20 pt-6 text-center text-xs opacity-60">
        © 2026 Rufino's Furniture. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
