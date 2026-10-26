import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser, clearError } from '../../store/authSlice';
import { ErrorMessage } from '../../components/common';

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useAppSelector(s => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      if (user.role === 'SELLER') navigate('/seller');
      else if (user.role === 'ADMIN') navigate('/admin');
      else navigate('/buyer');
    }
  }, [user, navigate]);

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-[400px]">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif italic mb-3">Sign in</h1>
          <p className="text-sm font-serif text-text-secondary">Welcome back to SothebyDigital</p>
        </div>

        <div className="panel p-8 md:p-10 relative">
          <div className="absolute top-2 left-2 right-2 bottom-2 border border-border pointer-events-none"></div>
          <form onSubmit={handleSubmit} className="relative z-10">
            {error && <div className="mb-6"><ErrorMessage message={error} /></div>}

            <div className="form-group mb-6 relative">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary mb-1 block">Email</label>
              <input
                type="email" 
                className="form-input font-serif text-base" 
                placeholder="email@example.com"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
              />
            </div>

            <div className="form-group mb-8 relative">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary">Password</label>
                <Link to="/forgot-password" className="text-[11px] text-text-muted hover:text-text-primary transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password" 
                className="form-input font-serif text-base" 
                placeholder="Enter your password"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full justify-center h-12 text-sm" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-sm font-serif text-text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="text-text-primary italic hover:text-text-secondary transition-colors">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
