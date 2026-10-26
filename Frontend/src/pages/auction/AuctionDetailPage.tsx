import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAuction, fetchBidHistory, placeBid, clearCurrent, checkWatchlist, toggleWatchlist } from '../../store/auctionSlice';
import { useLiveAuction } from '../../hooks/useLiveAuction';
import { useCountdown } from '../../hooks/useCountdown';
import { LoadingPage, ErrorMessage, StatusBadge } from '../../components/common';
import { formatCurrency, generateRequestId, addToast } from '../../utils';
import { BiddingPanel } from './BiddingPanel';
import { BidHistory } from './BidHistory';
import { AuctionGallery } from './AuctionGallery';
import { AuctionLotInfo } from './AuctionLotInfo';

const AuctionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);
  const { currentAuction: auction, bids, currentLoading, error, isWatched, livePrice, liveBidCount, lastBid, liveStatus } = useAppSelector(s => s.auctions);

  const [bidAmount, setBidAmount] = useState('');
  const [placing, setPlacing] = useState(false);
  const [bidError, setBidError] = useState('');
  
  const [priceFlash, setPriceFlash] = useState(false);
  const prevPriceRef = useRef<number | null>(null);

  useLiveAuction(id ?? null);

  const effectivePrice = livePrice ?? auction?.currentPrice ?? 0;
  const effectiveBidCount = liveBidCount ?? auction?.bidCount ?? 0;
  const effectiveStatus = liveStatus ?? auction?.status ?? '';

  const countdown = useCountdown(auction?.endTime ?? null);
  const isLive = effectiveStatus === 'LIVE' || effectiveStatus === 'ENDING';
  const canBid = isLive && user && user.role === 'BUYER';
  const minBid = effectivePrice + (auction?.minimumIncrement ?? 1);

  useEffect(() => {
    if (id) {
      dispatch(fetchAuction(id));
      dispatch(fetchBidHistory({ id }));
      if (user) dispatch(checkWatchlist(id));
    }
    return () => { dispatch(clearCurrent()); };
  }, [id, dispatch, user]);

  useEffect(() => {
    if (prevPriceRef.current !== null && effectivePrice > prevPriceRef.current) {
      setPriceFlash(true);
      const t = setTimeout(() => setPriceFlash(false), 800);
      return () => clearTimeout(t);
    }
    prevPriceRef.current = effectivePrice;
  }, [effectivePrice]);

  useEffect(() => {
    if (lastBid && user && lastBid.bidderId !== user.id) {
      addToast('info', `New bid placed: ${formatCurrency(lastBid.amount)}`);
    }
  }, [lastBid, user]);

  const handlePlaceBid = useCallback(async () => {
    if (!id || !user) { navigate('/login'); return; }
    const amount = Number(bidAmount);
    if (!amount || amount < minBid) {
      setBidError(`Minimum bid is ${formatCurrency(minBid)}`);
      return;
    }
    setBidError('');
    setPlacing(true);
    const requestId = generateRequestId();
    const result = await dispatch(placeBid({ auctionId: id, amount, requestId }));
    setPlacing(false);
    if (placeBid.fulfilled.match(result)) {
      addToast('success', `Bid placed successfully`);
      setBidAmount('');
      dispatch(fetchBidHistory({ id }));
    } else {
      const errMsg = result.payload as string;
      if (errMsg?.includes('conflict') || errMsg?.includes('outbid')) {
        setBidError('Outbid. Refresh or enter a higher amount.');
      } else {
        setBidError(errMsg || 'Failed to place bid.');
      }
    }
  }, [id, user, bidAmount, minBid, dispatch, navigate]);

  const handleWatchlist = async () => {
    if (!user) { navigate('/login'); return; }
    if (!id) return;
    dispatch(toggleWatchlist({ auctionId: id, isWatched }));
  };

  if (currentLoading) return <LoadingPage />;

  if (error || !auction) return (
    <div className="container-custom py-12">
      <ErrorMessage message={error || 'Auction not found'} />
    </div>
  );

  const seller = typeof auction.sellerId === 'object' ? auction.sellerId : null;
  const images = auction.images?.length ? auction.images : [];
  const categoryName = typeof auction.categoryId === 'object' && auction.categoryId ? auction.categoryId.name : 'Catalogue';
  
  const getEntityId = (entity: unknown) => {
    if (!entity) return '';
    if (typeof entity === 'object') return (entity as { _id?: string; id?: string })._id || (entity as { _id?: string; id?: string }).id || '';
    return String(entity);
  };

  const currentUserId = user?.id || (user as { _id?: string })?._id;
  const winnerId = getEntityId(auction.winnerId || auction.highestBidderId);
  const isConcluded = !isLive && effectiveStatus !== 'SCHEDULED';
  const isWinner = Boolean(currentUserId && winnerId && winnerId === currentUserId);
  const hasUserBidded = Boolean(
    currentUserId &&
    bids.some((b) => {
      const bId = getEntityId(b.bidderId);
      return bId === currentUserId;
    })
  );

  const isHighestBidder = Boolean(isLive && bids[0] && currentUserId && getEntityId(bids[0].bidderId) === currentUserId);

  return (
    <div className="min-h-[calc(100vh-56px)] py-8">
      <div className="container-custom">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-muted mb-8 font-semibold">
          <Link to="/" className="hover:text-text-primary transition-colors">Home</Link>
          <span className="text-text-secondary font-serif">/</span>
          <Link to="/auctions" className="hover:text-text-primary transition-colors">Auctions</Link>
          <span className="text-text-secondary font-serif">/</span>
          <span className="text-text-primary">{categoryName}</span>
        </div>

        {/* Post-Auction Winner Banner */}
        {isConcluded && isWinner && (
          <div className="mb-8 p-5 border border-success/40 bg-success/10 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004-9.375V4.875A1.875 1.875 0 0012.625 3h-1.25A1.875 1.875 0 009.5 4.875V5.25m6.75 3.75h2.25a2.25 2.25 0 002.25-2.25v-.75a2.25 2.25 0 00-2.25-2.25h-2.25m-6.75 5.25H7.5A2.25 2.25 0 015.25 7V6.25A2.25 2.25 0 017.5 4h2.25m0 5.25a4.5 4.5 0 009 0" />
                </svg>
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-text-primary">
                  You won this lot!
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Winning hammer price: <strong className="text-text-primary">{formatCurrency(effectivePrice)}</strong>. Proceed to your orders to complete payment and arrange shipping.
                </p>
              </div>
            </div>
            <Link
              to="/buyer"
              className="btn btn-primary px-6 h-11 text-xs uppercase tracking-wider font-semibold whitespace-nowrap inline-flex items-center justify-center gap-2"
            >
              View Order & Pay →
            </Link>
          </div>
        )}

        {/* Post-Auction Outbid Participant Banner */}
        {isConcluded && hasUserBidded && !isWinner && (
          <div className="mb-8 p-4 border border-border bg-surface-subtle rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface border border-border text-text-muted flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-serif font-semibold text-sm text-text-primary">
                  Auction Concluded
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  This auction ended at {formatCurrency(effectivePrice)}. Keep bidding on upcoming and live lots!
                </p>
              </div>
            </div>
            <Link
              to="/auctions"
              className="btn btn-secondary px-5 h-10 text-xs uppercase tracking-wider font-semibold whitespace-nowrap inline-flex items-center justify-center"
            >
              Browse Active Auctions
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 w-full min-w-0 flex flex-col gap-8">
            <AuctionGallery images={images} title={auction.title} />

            <div>
              <div className="flex items-center gap-3 mb-4">
                <StatusBadge status={effectiveStatus} />
                <span className="badge badge-neutral">{categoryName}</span>
              </div>
              <h1 className="mb-3 font-serif text-3xl md:text-4xl lg:text-5xl leading-tight text-text-primary">{auction.title}</h1>
              <div className="text-[10px] uppercase tracking-widest text-text-secondary font-semibold">
                Lot #{auction._id.slice(-6).toUpperCase()} <span className="font-serif mx-2 text-text-muted">/</span> {auction.viewCount} views
              </div>
            </div>

            <AuctionLotInfo auction={auction} seller={seller} />

            <div className="border-t border-border pt-8 mb-8">
              <h3 className="text-xl font-serif mb-5 italic text-text-primary">Description</h3>
              <p className="text-base font-serif leading-relaxed whitespace-pre-wrap text-text-secondary">{auction.description}</p>
            </div>
            
          </div>

          <div className="lg:col-span-4 w-full shrink-0 lg:sticky lg:top-24 flex flex-col gap-8">
            <BiddingPanel
              auction={auction}
              user={user}
              effectiveStatus={effectiveStatus}
              effectivePrice={effectivePrice}
              isLive={isLive}
              isHighestBidder={isHighestBidder}
              countdown={countdown}
              priceFlash={priceFlash}
              canBid={canBid}
              minBid={minBid}
              bidAmount={bidAmount}
              setBidAmount={setBidAmount}
              bidError={bidError}
              setBidError={setBidError}
              placing={placing}
              onPlaceBid={handlePlaceBid}
              isWatched={isWatched}
              onWatchlistToggle={handleWatchlist}
              bids={bids}
            />

            {isLive && (
              <BidHistory
                bids={bids}
                effectiveBidCount={effectiveBidCount}
                user={user}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;
