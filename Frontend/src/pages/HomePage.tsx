import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAuctions } from '../store/auctionSlice';
import { AuctionCard } from '../components/auction/AuctionCard';
import { LoadingPage, EmptyState } from '../components/common';
import { Footer } from '../components/layout/Footer';
import { HomeHero } from './HomeHero';
import { categoryApi } from '../services/api/other.api';
import type { Category } from '../types';

const HomePage = () => {
  const dispatch = useAppDispatch();
  const { auctions, loading } = useAppSelector(s => s.auctions);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchAuctions({ status: 'LIVE', limit: 8 }));
    categoryApi.getCategories()
      .then(res => {
        if (res.data?.success) setCategories(res.data.data);
      })
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, [dispatch]);

  const liveAuctions = auctions.filter(a => a.status === 'LIVE' || a.status === 'ENDING');
  const featuredLive = liveAuctions[0] || null;

  return (
    <div className="flex flex-col min-h-screen">
      <HomeHero featuredLive={featuredLive} loading={loading} />

      <section className="py-20 border-b border-border bg-transparent">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-12 border-b border-border pb-4">
            <h2 className="flex items-center gap-3 text-2xl font-serif">
              <span className="w-2 h-2 bg-live animate-pulse"></span>
              Live Now
            </h2>
            <Link to="/auctions?status=LIVE" className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary hover:text-text-primary transition-colors">View All →</Link>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><LoadingPage /></div>
          ) : liveAuctions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {liveAuctions.slice(0, 4).map(a => <AuctionCard key={a._id} auction={a} />)}
            </div>
          ) : (
             <EmptyState 
                title="No Live Auctions" 
                message="Check back soon for upcoming events."
             />
          )}
        </div>
      </section>

      <section className="py-16 border-b border-border text-center">
        <div className="container-custom">
          <div className="flex flex-col items-center gap-6">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.2em]">Explore By Category</span>
            {catLoading ? (
              <span className="text-sm font-serif italic text-text-muted">Loading categories...</span>
            ) : categories.length > 0 ? (
              <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
                {categories.map((cat, i) => (
                  <React.Fragment key={cat.slug || cat._id}>
                    <Link 
                      to={`/auctions?category=${cat.slug}`}
                      className="text-sm font-serif italic text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {cat.name}
                    </Link>
                    {i < categories.length - 1 && <span className="text-text-muted text-xs">◆</span>}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <span className="text-sm font-serif italic text-text-muted">No categories available</span>
            )}
            <Link to="/auctions" className="text-[10px] uppercase tracking-widest font-semibold text-text-primary mt-4 border-b border-text-primary pb-1 hover:text-text-secondary hover:border-text-secondary transition-colors">View Directory</Link>
          </div>
        </div>
      </section>

      <section className="py-24 border-b border-border relative">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif italic mb-4">How it works</h2>
            <div className="w-12 h-px bg-border mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20 text-center relative z-10">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px bg-border -z-10"></div>
            
            <div className="bg-base px-4">
              <div className="text-3xl font-serif text-text-muted mb-6 mx-auto w-16 h-16 flex items-center justify-center border border-border bg-surface">I</div>
              <h3 className="text-sm uppercase tracking-widest font-semibold mb-4">Create Account</h3>
              <p className="text-sm text-text-secondary font-serif">Register as a buyer or seller. Identity verification ensures a trusted bidding environment for everyone.</p>
            </div>
            <div className="bg-base px-4">
              <div className="text-3xl font-serif text-text-muted mb-6 mx-auto w-16 h-16 flex items-center justify-center border border-border bg-surface">II</div>
              <h3 className="text-sm uppercase tracking-widest font-semibold mb-4">Bid Live</h3>
              <p className="text-sm text-text-secondary font-serif">Place bids in real-time. Our system instantly updates prices, ensuring you never miss an outbid.</p>
            </div>
            <div className="bg-base px-4">
              <div className="text-3xl font-serif text-text-muted mb-6 mx-auto w-16 h-16 flex items-center justify-center border border-border bg-surface">III</div>
              <h3 className="text-sm uppercase tracking-widest font-semibold mb-4">Win & Pay</h3>
              <p className="text-sm text-text-secondary font-serif">Secure the highest bid at close. Complete payment seamlessly and coordinate directly with the seller.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
