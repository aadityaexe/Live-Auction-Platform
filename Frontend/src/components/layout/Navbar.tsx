import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/authSlice';
import { NotificationDropdown } from '../notification/NotificationDropdown';

export const Navbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutUser());
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border">
      <div className="container-custom h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-serif font-bold text-text-primary tracking-wide" onClick={() => setMobileMenuOpen(false)}>
            Sotheby<span className="text-text-muted italic">Digital</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link to="/auctions?status=LIVE" className="text-xs uppercase tracking-widest font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5 relative group">
              <span className="w-1.5 h-1.5 bg-live"></span>
              Live Auctions
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-text-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link to="/auctions" className="text-xs uppercase tracking-widest font-medium text-text-secondary hover:text-text-primary transition-colors relative group">
              Browse
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-text-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="relative group">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-b border-border pl-8 pr-3 py-1.5 text-sm w-64 outline-none focus:border-text-primary transition-colors placeholder:font-serif placeholder:italic placeholder:text-text-muted"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/auctions?search=${encodeURIComponent(e.currentTarget.value)}`);
                }
              }}
            />
          </div>

          {!user ? (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Create Account</Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {user.role === 'SELLER' && (
                <Link to="/seller/create" className="btn btn-secondary btn-sm">Create Listing</Link>
              )}
              
              <NotificationDropdown />
              
              <div className="relative">
                <button 
                  className="w-8 h-8 bg-transparent border border-border flex items-center justify-center text-sm font-serif hover:border-text-primary transition-colors focus-visible:outline-accent"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  {user.username.charAt(0).toUpperCase()}
                </button>
                
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-1 w-48 panel py-1 z-50 animate-slide-down">
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-sm font-medium text-text-primary">{user.username}</p>
                        <p className="text-xs text-text-muted">{user.role}</p>
                      </div>
                      {!user.isVerified && (
                        <Link
                          to="/verify-email"
                          className="flex items-center justify-between px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-b border-amber-500/20 mb-1"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <span>Verify Email (OTP)</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        </Link>
                      )}
                      <Link to={`/${user.role.toLowerCase()}`} className="block px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-subtle hover:text-text-primary" onClick={() => setUserDropdownOpen(false)}>Dashboard</Link>
                      <Link to="/profile" className="block px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-subtle hover:text-text-primary" onClick={() => setUserDropdownOpen(false)}>Profile</Link>
                      <Link to="/wallet" className="block px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-subtle hover:text-text-primary" onClick={() => setUserDropdownOpen(false)}>Wallet & Ledger</Link>
                      <Link to="/orders" className="block px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-subtle hover:text-text-primary" onClick={() => setUserDropdownOpen(false)}>My Orders</Link>
                      <button onClick={handleLogout} className="w-full text-left px-3 py-1.5 text-sm text-danger hover:bg-danger-subtle mt-1 border-t border-border">Sign Out</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <button className="md:hidden p-2 -mr-2 text-text-secondary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            {mobileMenuOpen ? (
              <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>
            ) : (
              <><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></>
            )}
          </svg>
        </button>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-6 py-4 flex flex-col gap-4 absolute w-full left-0 animate-slide-down">
           <input 
              type="text" 
              placeholder="Search..." 
              className="form-input w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/auctions?search=${encodeURIComponent(e.currentTarget.value)}`);
                  setMobileMenuOpen(false);
                }
              }}
            />
          <div className="flex flex-col gap-2">
            <Link to="/auctions?status=LIVE" className="text-sm font-medium text-text-primary py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>Live Auctions</Link>
            <Link to="/auctions" className="text-sm font-medium text-text-primary py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>Browse All</Link>
            
            {!user ? (
              <div className="flex flex-col gap-2 mt-2">
                <Link to="/login" className="btn btn-secondary w-full justify-center" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn btn-primary w-full justify-center" onClick={() => setMobileMenuOpen(false)}>Create Account</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <Link to={`/${user.role.toLowerCase()}`} className="text-sm font-medium text-text-primary py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <Link to="/profile" className="text-sm font-medium text-text-primary py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                <Link to="/wallet" className="text-sm font-medium text-text-primary py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>Wallet & Ledger</Link>
                <Link to="/orders" className="text-sm font-medium text-text-primary py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>
                {user.role === 'SELLER' && (
                  <Link to="/seller/create" className="text-sm font-medium text-text-primary py-2 border-b border-border" onClick={() => setMobileMenuOpen(false)}>Create Listing</Link>
                )}
                <button onClick={handleLogout} className="text-left text-sm font-medium text-danger py-2">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
