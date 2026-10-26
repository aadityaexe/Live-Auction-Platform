
interface AuctionFormSidebarProps {
  formId: string;
  status: string;
  statusLabel?: string;
  showListingFee?: boolean;
  submitText: string;
  submittingText: string;
  isSubmitting: boolean;
  cancelText: string;
  onCancel: () => void;
}

export const AuctionFormSidebar = ({
  formId,
  status,
  statusLabel = 'Status',
  showListingFee = false,
  submitText,
  submittingText,
  isSubmitting,
  cancelText,
  onCancel,
}: AuctionFormSidebarProps) => {
  return (
    <div className="w-full lg:w-72 shrink-0">
      <div className="sticky top-20">
        <div className="panel p-6 mb-6">
          <h3 className="text-sm font-semibold mb-4">Summary</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-text-secondary">Type</span>
              <span className="font-medium">Live Auction</span>
            </li>
            {showListingFee && (
              <li className="flex justify-between">
                <span className="text-text-secondary">Listing Fee</span>
                <span className="font-medium">Free</span>
              </li>
            )}
            <li className="flex justify-between pt-3 border-t border-border">
              <span className="text-text-secondary">{statusLabel}</span>
              <span className="text-warning font-medium">{status}</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            form={formId}
            className="btn btn-primary w-full h-10"
            disabled={isSubmitting}
          >
            {isSubmitting ? submittingText : submitText}
          </button>
          <button
            type="button"
            className="btn btn-ghost w-full"
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};
