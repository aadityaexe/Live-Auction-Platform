import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerUser, clearError } from '../../store/authSlice';
import { ErrorMessage } from '../../components/common';

const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useAppSelector(s => s.auth);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'BUYER' as 'BUYER' | 'SELLER' });

  useEffect(() => {
    if (user) {
      if (!user.isVerified) {
        navigate(`/verify-email?email=${encodeURIComponent(user.email)}`);
      } else if (user.role === 'SELLER') {
        navigate('/seller');
      } else {
        navigate('/buyer');
      }
    }
  }, [user, navigate]);

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(registerUser(form));
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif italic mb-3">Create an account</h1>
          <p className="text-sm font-serif text-text-secondary">Join SothebyDigital to bid or sell</p>
        </div>

        <div className="panel p-8 md:p-10 relative">
          <div className="absolute top-2 left-2 right-2 bottom-2 border border-border pointer-events-none"></div>
          <form onSubmit={handleSubmit} className="relative z-10">
            {error && <div className="mb-6"><ErrorMessage message={error} /></div>}

            <div className="grid grid-cols-2 gap-0 border border-border mb-8">
              {(['BUYER', 'SELLER'] as const).map(r => (
                <button 
                  key={r} 
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={`py-3 text-[10px] uppercase tracking-widest font-semibold transition-colors ${
                    form.role === r 
                      ? 'bg-text-primary text-surface' 
                      : 'bg-transparent text-text-secondary hover:bg-surface-subtle'
                  }`}
                >
                  {r === 'BUYER' ? 'Buyer' : 'Seller'}
                </button>
              ))}
            </div>

            <div className="form-group mb-6 relative">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary mb-1 block">Username</label>
              <input 
                type="text" 
                className="form-input font-serif text-base" 
                placeholder="johndoe" 
                value={form.username} 
                onChange={set('username')} 
                required 
                minLength={3} 
                maxLength={30} 
              />
            </div>
            
            <div className="form-group mb-6 relative">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary mb-1 block">Email address</label>
              <input 
                type="email" 
                className="form-input font-serif text-base" 
                placeholder="email@example.com" 
                value={form.email} 
                onChange={set('email')} 
                required 
              />
            </div>
            
            <div className="form-group mb-10 relative">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary mb-1 block">Password</label>
              <input 
                type="password" 
                className="form-input font-serif text-base" 
                placeholder="Minimum 8 characters" 
                value={form.password} 
                onChange={set('password')} 
                required 
                minLength={8} 
              />
            </div>

            <button type="submit" className="btn btn-primary w-full justify-center h-12 text-sm" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-sm font-serif text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-text-primary italic hover:text-text-secondary transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
