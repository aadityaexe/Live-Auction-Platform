import React from 'react';
import type { Category } from '../../types';
import { FormField } from '../../components/common';

interface AuctionBasicInfoFieldsProps {
  title: string;
  description: string;
  categoryId: string;
  categories: Category[];
  errors: Record<string, string>;
  onChange: (key: 'title' | 'description' | 'categoryId') => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
}

export const AuctionBasicInfoFields = ({
  title,
  description,
  categoryId,
  categories,
  errors,
  onChange,
}: AuctionBasicInfoFieldsProps) => {
  return (
    <div className="panel p-6">
      <h3 className="text-base font-semibold mb-6 pb-4 border-b border-border">Basic Information</h3>
      <div className="space-y-5">
        <FormField
          label="Item Title"
          name="title"
          value={title}
          onChange={onChange('title')}
          error={errors.title}
          required
        />
        <FormField
          label="Description"
          name="description"
          value={description}
          onChange={onChange('description')}
          error={errors.description}
          as="textarea"
          required
        />
        <div className="form-group mb-0">
          <label className="form-label">Category<span className="text-danger ml-1">*</span></label>
          <select
            className="form-select w-full"
            value={categoryId}
            onChange={onChange('categoryId')}
            required
          >
            <option value="" disabled>Select a category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <div className="form-error">{errors.categoryId}</div>}
        </div>
      </div>
    </div>
  );
};
