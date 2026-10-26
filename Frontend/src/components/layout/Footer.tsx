import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="py-16 mt-auto bg-transparent border-t border-border">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-center md:text-left">
          <div className="md:col-span-2">
            <Link to="/" className="text-2xl font-serif font-bold text-text-primary tracking-wide block mb-4">
              Sotheby<span className="text-text-muted italic">Digital</span>
            </Link>
            <p className="text-sm text-text-secondary font-serif italic max-w-sm mx-auto md:mx-0">
              A heritage of trust. Real-time auctions for exclusive items.
            </p>
          </div>
          
          <div>
            <h4 className="text-[10px] font-semibold text-text-primary uppercase tracking-[0.2em] mb-6">Platform</h4>
            <ul className="space-y-3">
              <li><Link to="/auctions?status=LIVE" className="text-sm font-serif text-text-secondary hover:text-text-primary transition-colors">Live Auctions</Link></li>
              <li><Link to="/auctions" className="text-sm font-serif text-text-secondary hover:text-text-primary transition-colors">Browse Directory</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-[10px] font-semibold text-text-primary uppercase tracking-[0.2em] mb-6">Account</h4>
            <ul className="space-y-3">
              <li><Link to="/login" className="text-sm font-serif text-text-secondary hover:text-text-primary transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="text-sm font-serif text-text-secondary hover:text-text-primary transition-colors">Register</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-border">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
            &copy; {new Date().getFullYear()} SothebyDigital. All rights reserved.
          </p>
          <div className="flex gap-6 text-[10px] uppercase tracking-widest text-text-muted font-semibold">
            <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-text-primary transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
