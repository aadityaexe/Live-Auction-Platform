import React from 'react';
import { FormField } from '../../components/common';

interface AuctionPricingScheduleFieldsProps {
  form: {
    startingPrice: string;
    minimumIncrement: string;
    reservePrice: string;
    startTime: string;
    endTime: string;
  };
  errors: Record<string, string>;
  onChange: (key: 'startingPrice' | 'minimumIncrement' | 'reservePrice' | 'startTime' | 'endTime') => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
}

export const AuctionPricingScheduleFields = ({
  form,
  errors,
  onChange,
}: AuctionPricingScheduleFieldsProps) => {
  return (
    <>
      <div className="panel p-6">
        <h3 className="text-base font-semibold mb-6 pb-4 border-b border-border">Pricing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            label="Starting Bid"
            name="startingPrice"
            type="number"
            value={form.startingPrice}
            onChange={onChange('startingPrice')}
            error={errors.startingPrice}
            placeholder="1000"
            min="1"
            required
            prefix="₹"
          />
          <FormField
            label="Minimum Increment"
            name="minimumIncrement"
            type="number"
            value={form.minimumIncrement}
            onChange={onChange('minimumIncrement')}
            error={errors.minimumIncrement}
            placeholder="100"
            min="1"
            required
            prefix="₹"
          />
          <div className="sm:col-span-2">
            <FormField
              label="Reserve Price"
              name="reservePrice"
              type="number"
              value={form.reservePrice}
              onChange={onChange('reservePrice')}
              error={errors.reservePrice}
              placeholder="Optional"
              min="0"
              hint="The item will not sell unless this hidden minimum is met."
              prefix="₹"
            />
          </div>
        </div>
      </div>

      <div className="panel p-6">
        <h3 className="text-base font-semibold mb-6 pb-4 border-b border-border">Schedule</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            label="Start Time"
            name="startTime"
            type="datetime-local"
            value={form.startTime}
            onChange={onChange('startTime')}
            error={errors.startTime}
            required
          />
          <FormField
            label="End Time"
            name="endTime"
            type="datetime-local"
            value={form.endTime}
            onChange={onChange('endTime')}
            error={errors.endTime}
            required
          />
        </div>
      </div>
    </>
  );
};
