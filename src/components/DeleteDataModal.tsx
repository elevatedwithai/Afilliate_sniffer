import { useState } from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { clearAllData } from '../utils/dataManagement';
import { toast } from 'react-hot-toast';

interface DeleteDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteDataModal({ isOpen, onClose, onSuccess }: DeleteDataModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  if (!isOpen) return null;
  
  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      return;
    }
    
    setIsDeleting(true);
    toast.loading('Deleting all data...', { id: 'delete-all' });
    
    try {
      const result = await clearAllData();
      
      if (result.success) {
        toast.success(`Successfully deleted ${result.count} records`, { id: 'delete-all' });
        onSuccess();
        onClose();
        setConfirmText('');
      } else {
        console.error('Error deleting data:', result.error);
        toast.error(`Failed to delete data: ${result.error}`, { id: 'delete-all' });
      }
    } catch (error) {
      console.error('Error in delete operation:', error);
      toast.error('An unexpected error occurred', { id: 'delete-all' });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-red-500 w-6 h-6 mr-2" />
          <h2 className="text-xl font-bold text-gray-800">Delete All Data</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            This action will permanently delete <span className="font-bold">ALL</span> tools and affiliate data from the database. This cannot be undone.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm text-red-700">
              To confirm, type <span className="font-bold">DELETE</span> in the field below:
            </p>
          </div>
          
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Type DELETE to confirm"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          
          <button
            onClick={handleDelete}
            disabled={confirmText !== 'DELETE' || isDeleting}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
