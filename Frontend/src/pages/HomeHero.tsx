import { Link } from 'react-router-dom';
import type { Auction } from '../types';

interface HomeHeroProps {
  featuredLive: Auction | null;
  loading: boolean;
}

export const HomeHero = ({ featuredLive, loading }: HomeHeroProps) => {
  return (
    <section className="py-20 md:py-32 border-b border-border relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-border opacity-50 hidden lg:block"></div>
      <div className="container-custom flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
        
        <div className="flex-1 max-w-2xl text-center lg:text-left z-10">
          <h1 className="mb-8 font-serif italic text-5xl md:text-7xl leading-tight">
            Bid live. <br /><span className="not-italic">Win fair.</span>
          </h1>
          <p className="text-lg md:text-xl mb-10 text-text-secondary max-w-lg mx-auto lg:mx-0 font-serif">
            Access curated auctions for premium items. Real-time bidding with verified sellers and transparent history.
          </p>
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <Link to="/auctions?status=LIVE" className="btn btn-primary btn-lg">View Live Auctions</Link>
            <Link to="/auctions" className="btn btn-secondary btn-lg">Browse All</Link>
          </div>
          
          <div className="flex items-center gap-6 mt-12 text-sm text-text-secondary border-t border-border pt-6 justify-center lg:justify-start">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-text-muted rounded-full"></div>
              Verified Sellers
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-text-muted rounded-full"></div>
              Secure Payments
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-text-muted rounded-full"></div>
              Real-Time Updates
            </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-md z-10">
          <div className="panel p-6 bg-surface relative">
            <div className="absolute top-2 left-2 right-2 bottom-2 border border-border pointer-events-none"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-xs uppercase tracking-widest font-semibold text-text-secondary">Featured Live</h3>
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-live bg-transparent px-2 py-1 border border-live/30">
                <span className="w-1.5 h-1.5 bg-live animate-pulse-fast"></span>
                Live
              </span>
            </div>
            
            {featuredLive ? (
              <div className="relative z-10">
                <div className="aspect-[4/3] bg-surface-subtle mb-6 border border-border overflow-hidden relative">
                  <div className="absolute inset-0 bg-text-primary/5 mix-blend-multiply pointer-events-none z-10"></div>
                  {featuredLive.images?.[0] ? (
                    <img
                      src={featuredLive.images[0]}
                      alt="Featured"
                      className="w-full h-full object-cover grayscale-[20%] contrast-[1.1] transition-transform duration-700 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted text-sm font-serif italic">
                      Image Unavailable
                    </div>
                  )}
                </div>
                <h4 className="font-serif text-2xl mb-2 line-clamp-1">{featuredLive.title}</h4>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Current Bid</div>
                    <div className="text-2xl font-serif tabular-nums tracking-tight text-text-primary">
                      ₹{featuredLive.currentPrice.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <Link to={`/auctions/${featuredLive._id}`} className="btn btn-primary w-full">Join Auction</Link>
              </div>
            ) : (
              <div className="aspect-[4/3] bg-surface-subtle flex flex-col items-center justify-center gap-2 border border-border text-sm text-text-muted font-serif italic relative z-10">
                {loading ? 'Loading...' : 'No featured auctions'}
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
