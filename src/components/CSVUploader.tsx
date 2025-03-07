import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CSVUploaderProps {
  onDataLoaded: (data: any[]) => void;
}

export default function CSVUploader({ onDataLoaded }: CSVUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [fileInfo, setFileInfo] = useState<{name: string, size: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setError(null);
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size)
    });

    setUploading(true);
    toast.loading('Parsing CSV file...', { id: 'csv-upload' });

    // Configure Papa Parse for large files
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep everything as strings
      worker: true, // Use a worker thread for large files
      complete: (results) => {
        console.log('CSV Parse Results:', {
          rows: results.data.length,
          fields: results.meta.fields,
          errors: results.errors.length
        });
        
        // Validate the CSV data
        if (results.data.length === 0) {
          setError('The CSV file is empty');
          toast.error('The CSV file is empty', { id: 'csv-upload' });
          setUploading(false);
          return;
        }

        // Check if the CSV has the required columns
        const firstRow = results.data[0];
        if (!firstRow.name || !firstRow.website) {
          setError('CSV must contain "name" and "website" columns');
          toast.error('CSV must contain "name" and "website" columns', { id: 'csv-upload' });
          setUploading(false);
          return;
        }

        // Check for parse errors
        if (results.errors.length > 0) {
          console.warn('CSV Parse Errors:', results.errors);
          toast.warning(`CSV parsed with ${results.errors.length} errors. Some rows may be skipped.`, { id: 'csv-upload' });
        }

        // Process the data
        onDataLoaded(results.data);
        toast.success(`Successfully loaded ${results.data.length} tools from CSV`, { id: 'csv-upload' });
        setUploading(false);
      },
      error: (err) => {
        console.error('CSV Parse Error:', err);
        setError(`Error parsing CSV: ${err.message}`);
        toast.error(`Error parsing CSV: ${err.message}`, { id: 'csv-upload' });
        setUploading(false);
      },
    });
  };

  return (
    <div className="w-full max-w-md">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {fileInfo && !uploading && !error && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <span className="font-medium">{fileInfo.name}</span> ({fileInfo.size}) ready to upload
          </p>
          <p className="text-xs text-blue-600 mt-1">Duplicate checking is disabled - all tools will be imported</p>
        </div>
      )}
      
      <label className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors cursor-pointer">
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing CSV...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {fileInfo ? 'Choose Another File' : 'Upload CSV'}
          </>
        )}
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          disabled={uploading}
          className="hidden" 
        />
      </label>
      
      <p className="mt-2 text-xs text-gray-500">
        CSV must include "name" and "website" columns. Optional: category, description, tags, use_cases, features
      </p>
    </div>
  );
}
