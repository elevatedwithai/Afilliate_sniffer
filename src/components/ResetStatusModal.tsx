import { useState } from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';

interface ResetStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: (status: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export default function ResetStatusModal({ 
  isOpen, 
  onClose, 
  onReset, 
  selectedStatus, 
  onStatusChange 
}: ResetStatusModalProps) {
  const [isResetting, setIsResetting] = useState(false);
  
  if (!isOpen) return null;
  
  const handleReset = async () => {
    setIsResetting(true);
    await onReset(selectedStatus);
    setIsResetting(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          <RotateCcw className="text-yellow-500 w-6 h-6 mr-2" />
          <h2 className="text-xl font-bold text-gray-800">Reset Tools by Status</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            This action will reset all tools with the selected status back to "Pending" status. 
            This will clear all affiliate data for these tools and allow them to be re-scraped.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <p className="text-sm text-yellow-700">
              <span className="font-bold">Warning:</span> This action cannot be undone.
            </p>
          </div>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select status to reset:
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="Not Found">Not Found</option>
            <option value="Found">Found</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            disabled={isResetting}
          >
            Cancel
          </button>
          
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResetting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All {selectedStatus} Tools
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
