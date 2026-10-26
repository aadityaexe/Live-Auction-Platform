import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { auctionApi } from '../../services/api/auction.api';
import { categoryApi } from '../../services/api/other.api';
import type { Category, Auction } from '../../types';
import { Spinner, ErrorMessage } from '../../components/common';
import { addToast } from '../../utils';
import { AuctionFormSidebar } from './AuctionFormSidebar';
import { ImageUploader } from './ImageUploader';
import { AuctionPricingScheduleFields } from './AuctionPricingScheduleFields';
import { AuctionBasicInfoFields } from './AuctionBasicInfoFields';

const EditAuctionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [auction, setAuction] = useState<Auction | null>(null);
  const [images, setImages] = useState<string[]>([]);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    startingPrice: '',
    minimumIncrement: '',
    reservePrice: '',
    startTime: '',
    endTime: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user || user.role === 'BUYER') { navigate('/'); return; }
    categoryApi.getCategories().then(({ data }) => setCategories(data.data)).catch(() => {});
  }, [user, navigate]);

  useEffect(() => {
    if (!id) return;
    auctionApi.getAuction(id)
      .then(({ data }) => {
        const a = data.data;
        if (a.status !== 'DRAFT' && a.status !== 'SCHEDULED') {
          setError('Only Draft or Scheduled auctions can be edited.');
        } else {
          setAuction(a);
          setImages(a.images || []);
          setForm({
            title: a.title,
            description: a.description,
            categoryId: typeof a.categoryId === 'string' ? a.categoryId : (a.categoryId as Category)?._id || '',
            startingPrice: a.startingPrice.toString(),
            minimumIncrement: a.minimumIncrement.toString(),
            reservePrice: a.reservePrice ? a.reservePrice.toString() : '',
            startTime: new Date(a.startTime).toISOString().slice(0, 16),
            endTime: new Date(a.endTime).toISOString().slice(0, 16),
          });
        }
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load auction'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(errs => ({ ...errs, [k]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim() || form.title.length < 3) e.title = 'Title must be at least 3 characters';
    if (!form.description.trim() || form.description.length < 10) e.description = 'Description must be at least 10 characters';
    if (!form.startingPrice || Number(form.startingPrice) <= 0) e.startingPrice = 'Must be a positive number';
    if (!form.minimumIncrement || Number(form.minimumIncrement) <= 0) e.minimumIncrement = 'Must be a positive number';
    if (!form.startTime) e.startTime = 'Start time is required';
    if (!form.endTime) e.endTime = 'End time is required';
    if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) e.endTime = 'End time must be after start time';
    if (form.reservePrice && Number(form.reservePrice) < Number(form.startingPrice)) e.reservePrice = 'Reserve price must be at least the starting price';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!validate()) {
      addToast('error', 'Please correct the errors in the form.');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        images,
        categoryId: form.categoryId || undefined,
        startingPrice: Number(form.startingPrice),
        minimumIncrement: Number(form.minimumIncrement),
        reservePrice: form.reservePrice ? Number(form.reservePrice) : undefined,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      };
      
      await auctionApi.updateAuction(id, payload);
      addToast('success', 'Auction updated successfully.');
      navigate(`/auctions/${id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update auction';
      addToast('error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex justify-center py-20"><Spinner size={40} /></div>;
  if (error || !auction) return <div className="container-custom py-12"><ErrorMessage message={error || 'Failed to load auction'} /></div>;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-base py-12">
      <div className="container-custom max-w-4xl">
        
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Edit Listing</h1>
          <p className="text-sm text-text-secondary">Update details for "{auction.title}"</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1 min-w-0">
            <form id="edit-auction-form" onSubmit={handleSubmit} className="space-y-6">
              
              <AuctionBasicInfoFields
                title={form.title}
                description={form.description}
                categoryId={form.categoryId}
                categories={categories}
                errors={errors}
                onChange={set}
              />

              <div className="panel p-6">
                <h3 className="text-base font-semibold mb-6 pb-4 border-b border-border">Media</h3>
                <ImageUploader
                  images={images}
                  onChange={setImages}
                  error={errors.images}
                />
              </div>

              <AuctionPricingScheduleFields
                form={form}
                errors={errors}
                onChange={set}
              />

            </form>
          </div>

          <AuctionFormSidebar
            formId="edit-auction-form"
            status={auction.status}
            statusLabel="Current Status"
            showListingFee={false}
            submitText="Save Changes"
            submittingText="Saving..."
            isSubmitting={saving}
            cancelText="Cancel"
            onCancel={() => navigate(-1)}
          />

        </div>
      </div>
    </div>
  );
};

export default EditAuctionPage;
