import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAuctions } from '../../store/auctionSlice';
import { AuctionCard } from '../../components/auction/AuctionCard';
import { LoadingPage, Pagination, EmptyState } from '../../components/common';
import { categoryApi } from '../../services/api/other.api';
import type { Category } from '../../types';

const STATUSES = [{ value: '', label: 'All Statuses' }, { value: 'LIVE', label: 'Live' }, { value: 'SCHEDULED', label: 'Scheduled' }, { value: 'ENDED', label: 'Ended' }];
const SORT_OPTIONS = [
  { value: 'endTime', label: 'Ending Soon' },
  { value: 'currentPrice', label: 'Price: Low to High' },
  { value: '-currentPrice', label: 'Price: High to Low' },
  { value: '-bidCount', label: 'Most Active' },
  { value: '-createdAt', label: 'Recently Added' }
];

const AuctionListPage = () => {
  const dispatch = useAppDispatch();
  const { auctions, pagination, loading } = useAppSelector(s => s.auctions);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'endTime';
  const page = Number(searchParams.get('page')) || 1;

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    categoryApi.getCategories().then(res => {
      if (res.data?.success) setCategories(res.data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const params: Record<string, string | number> = { page, limit: 12 };
    if (search) params.search = search;
    if (status) params.status = status;
    if (category) {
      const matched = categories.find(c => c.slug === category.toLowerCase() || c._id === category);
      params.categoryId = matched ? matched._id : category;
    }
    params.sortBy = sortBy;
    
    dispatch(fetchAuctions(params));
  }, [search, status, category, categories, sortBy, page, dispatch]);

  const updateParam = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get('search') as string || '').trim();
    updateParam('search', q);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="min-h-[calc(100vh-56px)] py-8">
      <div className="container-custom">
        
        <div className="mb-12 border-b border-border pb-6">
          <h1 className="text-4xl font-serif italic mb-2">Browse Directory</h1>
          <p className="text-sm font-serif text-text-secondary">Discover exclusive items across multiple categories.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 shrink-0 space-y-6">
            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-semibold mb-4 text-text-primary border-b border-border pb-2">Search</h3>
              <form onSubmit={handleSearch}>
                <input
                  key={search}
                  name="search"
                  defaultValue={search}
                  type="text"
                  className="form-input"
                  placeholder="Keywords..."
                />
              </form>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-semibold mb-4 text-text-primary border-b border-border pb-2">Status</h3>
              <div className="space-y-3">
                {STATUSES.map(s => (
                  <label key={s.value} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="status"
                      checked={status === s.value}
                      onChange={() => updateParam('status', s.value)}
                      className="w-3 h-3 appearance-none border border-border checked:bg-text-primary transition-colors focus:outline-none"
                    />
                    <span className="text-sm font-serif italic text-text-secondary group-hover:text-text-primary transition-colors">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-semibold mb-4 text-text-primary border-b border-border pb-2">Category</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="category"
                    checked={category === ''}
                    onChange={() => updateParam('category', '')}
                    className="w-3 h-3 appearance-none border border-border checked:bg-text-primary transition-colors focus:outline-none"
                  />
                  <span className="text-sm font-serif italic text-text-secondary group-hover:text-text-primary">All Categories</span>
                </label>
                {categories.map(c => (
                  <label key={c._id} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="category"
                      checked={category === c._id || category.toLowerCase() === c.slug}
                      onChange={() => updateParam('category', c._id)}
                      className="w-3 h-3 appearance-none border border-border checked:bg-text-primary transition-colors focus:outline-none"
                    />
                    <span className="text-sm font-serif italic text-text-secondary group-hover:text-text-primary">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {(search || status || category) && (
              <button 
                className="text-sm text-text-muted hover:text-text-primary underline transition-colors"
                onClick={clearFilters}
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-border gap-4">
              <div className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">
                Showing <span className="font-serif text-sm italic text-text-primary tabular-nums">{pagination?.total ?? 0}</span> results
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold whitespace-nowrap">Sort by</label>
                <select
                  className="form-select w-full sm:w-auto min-w-[160px]"
                  value={sortBy}
                  onChange={e => updateParam('sortBy', e.target.value)}
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-20"><LoadingPage /></div>
            ) : auctions.length === 0 ? (
              <EmptyState
                title="No items found"
                message="Adjust your filters or search terms to find what you're looking for."
                action={<button className="btn btn-secondary mt-4" onClick={clearFilters}>Clear Filters</button>}
              />
            ) : (
              <div className="animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {auctions.map(a => <AuctionCard key={a._id} auction={a} />)}
                </div>
                
                {pagination && pagination.pages > 1 && (
                  <Pagination page={pagination.page} pages={pagination.pages} onPage={p => {
                    updateParam('page', String(p));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} />
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionListPage;
