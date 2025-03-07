import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { 
  BarChart, 
  PieChart, 
  Download, 
  RefreshCw, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Database,
  Upload,
  Play,
  Shield,
  Trash2,
  RotateCcw,
  Zap,
  Pause,
  Image,
  Link,
  Filter,
  AlertTriangle
} from 'lucide-react';
import CSVUploader from './components/CSVUploader';
import { processCsvData } from './utils/processCsvData';
import { startScrapingTools, getPendingTools, autoContinueScraping, checkDuplicateTool } from './utils/scrapeTools';
import { fixRlsPolicies } from './utils/fixRlsPolicies';
import { deleteToolById, resetToolStatus, resetToolsByStatus, fixDuplicates, checkForDuplicates } from './utils/dataManagement';
import DeleteDataModal from './components/DeleteDataModal';
import ErrorBoundary from './components/ErrorBoundary';
import ResetStatusModal from './components/ResetStatusModal';

// Dashboard component
function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [showUploader, setShowUploader] = useState(false);
  const [isScrapingRunning, setIsScrapingRunning] = useState(false);
  const [isAutoScrapingRunning, setIsAutoScrapingRunning] = useState(false);
  const [isFixingRls, setIsFixingRls] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fetchingPendingTools, setFetchingPendingTools] = useState(false);
  const [batchSize, setBatchSize] = useState(25);
  const [pauseDuration, setPauseDuration] = useState(60);
  const [showEnhancedFields, setShowEnhancedFields] = useState(false);
  const [isFixingDuplicates, setIsFixingDuplicates] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStatus, setResetStatus] = useState('Not Found');

  // Fetch affiliate links
  const { 
    data: affiliateLinks, 
    isLoading: linksLoading, 
    refetch: refetchLinks 
  } = useQuery(
    ['affiliateLinks', page, pageSize, searchTerm, statusFilter],
    async () => {
      try {
        let query = supabase
          .from('affiliate_links')
          .select('*', { count: 'exact' })
          .range((page - 1) * pageSize, page * pageSize - 1);
        
        if (searchTerm) {
          query = query.or(`tool_name.ilike.%${searchTerm}%,website_url.ilike.%${searchTerm}%`);
        }
        
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        return {
          data: data || [],
          count: count || 0
        };
      } catch (error) {
        console.error('Error fetching affiliate links:', error);
        return { data: [], count: 0 };
      }
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  );

  // Fetch stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery(
    'stats',
    async () => {
      try {
        const { data: found, error: foundError } = await supabase
          .from('affiliate_links')
          .select('id', { count: 'exact' })
          .eq('status', 'Found');
        
        if (foundError) throw foundError;
        
        const { data: total, count: totalCount } = await supabase
          .from('affiliate_links')
          .select('id', { count: 'exact' });
        
        const { data: notFound } = await supabase
          .from('affiliate_links')
          .select('id', { count: 'exact' })
          .eq('status', 'Not Found');
        
        const { data: pending } = await supabase
          .from('affiliate_links')
          .select('id', { count: 'exact' })
          .eq('status', 'Pending');
        
        return {
          total: totalCount || 0,
          found: found?.length || 0,
          notFound: notFound?.length || 0,
          pending: pending?.length || 0,
          percentComplete: totalCount ? Math.round(((found?.length || 0) / totalCount) * 100) : 0
        };
      } catch (error) {
        console.error('Error fetching stats:', error);
        return { total: 0, found: 0, notFound: 0, pending: 0, percentComplete: 0 };
      }
    },
    {
      refetchOnWindowFocus: false
    }
  );

  // Check for duplicates on initial load
  useEffect(() => {
    const checkDuplicates = async () => {
      try {
        const result = await checkForDuplicates();
        if (result.success) {
          setDuplicateCount(result.count || 0);
        }
      } catch (error) {
        console.error('Error checking for duplicates:', error);
      }
    };
    
    checkDuplicates();
  }, []);

  const handleRefresh = () => {
    refetchStats();
    refetchLinks();
    toast.success('Data refreshed');
  };

  const handleCsvDataLoaded = async (data) => {
    await processCsvData(data);
    refetchStats();
    refetchLinks();
    setShowUploader(false);
  };

  const handleStartScraping = async () => {
    if (isScrapingRunning || isAutoScrapingRunning) {
      toast.error('Scraping is already running');
      return;
    }
    
    setIsScrapingRunning(true);
    setFetchingPendingTools(true);
    
    const fetchToastId = toast.loading('Fetching pending tools...');
    
    try {
      const pendingTools = await getPendingTools(batchSize);
      
      // Clear the fetching toast regardless of outcome
      toast.dismiss(fetchToastId);
      setFetchingPendingTools(false);
      
      if (pendingTools.length === 0) {
        toast.error('No pending tools found to process');
        setIsScrapingRunning(false);
        return;
      }
      
      toast.success(`Found ${pendingTools.length} pending tools to process`);
      
      // Start the scraping process
      await startScrapingTools(pendingTools);
      
      // Refresh data after scraping
      refetchStats();
      refetchLinks();
      
    } catch (error) {
      console.error('Error during scraping:', error);
      toast.error('An error occurred during scraping');
      // Clear the fetching toast in case of error
      toast.dismiss(fetchToastId);
      setFetchingPendingTools(false);
    } finally {
      setIsScrapingRunning(false);
    }
  };

  const handleStartAutoScraping = async () => {
    if (isScrapingRunning || isAutoScrapingRunning) {
      toast.error('Scraping is already running');
      return;
    }
    
    setIsAutoScrapingRunning(true);
    
    try {
      // Start the auto-continuation scraping process
      await autoContinueScraping(batchSize, pauseDuration * 1000);
      
      // Refresh data after scraping
      refetchStats();
      refetchLinks();
    } catch (error) {
      console.error('Error during auto scraping:', error);
      toast.error('An error occurred during auto scraping');
    } finally {
      setIsAutoScrapingRunning(false);
    }
  };

  const handleFixRlsPolicies = async () => {
    if (isFixingRls) return;
    
    setIsFixingRls(true);
    toast.loading('Fixing RLS policies...', { id: 'fix-rls' });
    
    try {
      const result = await fixRlsPolicies();
      
      if (result.success) {
        toast.success('Successfully fixed RLS policies!', { id: 'fix-rls' });
        // Refresh data to verify the fix worked
        refetchStats();
        refetchLinks();
      } else {
        toast.error(`Failed to fix RLS policies: ${result.error}`, { id: 'fix-rls' });
      }
    } catch (error) {
      console.error('Error fixing RLS policies:', error);
      toast.error('An error occurred while fixing RLS policies', { id: 'fix-rls' });
    } finally {
      setIsFixingRls(false);
    }
  };

  const handleFixDuplicates = async () => {
    if (isFixingDuplicates) return;
    
    setIsFixingDuplicates(true);
    toast.loading('Fixing duplicate tools...', { id: 'fix-duplicates' });
    
    try {
      const result = await fixDuplicates();
      
      if (result.success) {
        toast.success(`Successfully fixed ${result.count} duplicate tools!`, { id: 'fix-duplicates' });
        setDuplicateCount(0);
        // Refresh data to verify the fix worked
        refetchStats();
        refetchLinks();
      } else {
        toast.error(`Failed to fix duplicates: ${result.error}`, { id: 'fix-duplicates' });
      }
    } catch (error) {
      console.error('Error fixing duplicates:', error);
      toast.error('An error occurred while fixing duplicates', { id: 'fix-duplicates' });
    } finally {
      setIsFixingDuplicates(false);
    }
  };

  const handleResetToolsByStatus = async (status: string) => {
    toast.loading(`Resetting all tools with status: ${status}...`, { id: 'reset-status' });
    
    try {
      const result = await resetToolsByStatus(status);
      
      if (result.success) {
        toast.success(`Successfully reset ${result.count} tools with status: ${status}`, { id: 'reset-status' });
        // Refresh data
        refetchStats();
        refetchLinks();
      } else {
        toast.error(`Failed to reset tools: ${result.error}`, { id: 'reset-status' });
      }
    } catch (error) {
      console.error('Error resetting tools by status:', error);
      toast.error('An error occurred while resetting tools', { id: 'reset-status' });
    } finally {
      setShowResetModal(false);
    }
  };

  const handleDeleteTool = async (id) => {
    if (!confirm('Are you sure you want to delete this tool?')) {
      return;
    }
    
    toast.loading('Deleting tool...', { id: `delete-${id}` });
    
    try {
      const result = await deleteToolById(id);
      
      if (result.success) {
        toast.success('Tool deleted successfully', { id: `delete-${id}` });
        refetchStats();
        refetchLinks();
      } else {
        toast.error(`Failed to delete tool: ${result.error}`, { id: `delete-${id}` });
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
      toast.error('An error occurred while deleting the tool', { id: `delete-${id}` });
    }
  };

  const handleResetTool = async (id) => {
    if (!confirm('Reset this tool to Pending status? This will clear all affiliate data.')) {
      return;
    }
    
    toast.loading('Resetting tool...', { id: `reset-${id}` });
    
    try {
      const result = await resetToolStatus(id);
      
      if (result.success) {
        toast.success('Tool reset successfully', { id: `reset-${id}` });
        refetchStats();
        refetchLinks();
      } else {
        toast.error(`Failed to reset tool: ${result.error}`, { id: `reset-${id}` });
      }
    } catch (error) {
      console.error('Error resetting tool:', error);
      toast.error('An error occurred while resetting the tool', { id: `reset-${id}` });
    }
  };

  const exportToCSV = () => {
    const fetchAllData = async () => {
      try {
        const { data, error } = await supabase
          .from('affiliate_links')
          .select('*');
        
        if (error) {
          toast.error('Error exporting data');
          return;
        }
        
        if (!data || data.length === 0) {
          toast.error('No data to export');
          return;
        }
        
        // Format data for CSV
        const csvData = data.map(link => ({
          'Tool Name': link.tool_name || '',
          'Website': link.website_url || '',
          'Affiliate Program URL': link.affiliate_url || '',
          'Commission Rate': link.commission || '',
          'Cookie Duration': link.cookie_duration || '',
          'Payout Type': link.payout_type || '',
          'Contact Email': link.contact_email || '',
          'Contact Page': link.contact_page_url || '',
          'Outreach Status': link.outreach_status || '',
          'Category': link.category || '',
          'Status': link.status || '',
          'Notes': link.notes || '',
          'Tags': link.tags ? link.tags.join(', ') : '',
          'Use Cases': link.use_cases ? link.use_cases.join(', ') : '',
          'Features': link.features ? link.features.join(', ') : ''
        }));
        
        // Convert to CSV
        const headers = Object.keys(csvData[0]);
        const csvContent = [
          headers.join(','),
          ...csvData.map(row => headers.map(header => `"${(row[header] || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'affiliate_links.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Data exported successfully');
      } catch (error) {
        console.error('Error exporting data:', error);
        toast.error('Error exporting data');
      }
    };
    
    fetchAllData();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Found':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Not Found':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'Pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  // Function to safely extract hostname from URL
  const getHostname = (url) => {
    try {
      if (!url || url === '') return 'N/A';
      
      // Make sure we have a valid URL format
      let validUrl = url;
      if (!validUrl.match(/^https?:\/\//i)) {
        validUrl = 'https://' + validUrl;
      }
      
      // Try to create a URL object
      const urlObj = new URL(validUrl);
      return urlObj.hostname;
    } catch (e) {
      // Return a safe string that won't cause rendering issues
      return String(url).replace(/https?:\/\//i, '') || 'N/A';
    }
  };

  // Function to render tags
  const renderTags = (tags) => {
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return <span className="text-sm text-gray-500">No tags</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {tags.slice(0, 5).map((tag, index) => (
          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {tag}
          </span>
        ))}
        {tags.length > 5 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            +{tags.length - 5} more
          </span>
        )}
      </div>
    );
  };

  // Function to render social links
  const renderSocialLinks = (links) => {
    if (!links || !Array.isArray(links) || links.length === 0) {
      return <span className="text-sm text-gray-500">No social links</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-2">
        {links.map((link, index) => (
          <a 
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center"
          >
            <span className="w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full text-xs mr-1">
              {link.platform.charAt(0).toUpperCase()}
            </span>
          </a>
        ))}
      </div>
    );
  };

  // Function to render image preview
  const renderImagePreview = (url, type) => {
    if (!url) return null;
    
    return (
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-xs text-blue-600 hover:underline"
      >
        <Image className="w-3 h-3 mr-1" />
        {type}
      </a>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <DeleteDataModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onSuccess={() => {
          refetchStats();
          refetchLinks();
          toast.success('All data has been deleted');
        }}
      />
      
      {showResetModal && (
        <ResetStatusModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          onReset={handleResetToolsByStatus}
          selectedStatus={resetStatus}
          onStatusChange={setResetStatus}
        />
      )}
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">AI Tool Affiliate Program Finder</h1>
        <div className="flex space-x-2">
          {showUploader ? (
            <CSVUploader onDataLoaded={handleCsvDataLoaded} />
          ) : (
            <button 
              onClick={() => setShowUploader(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV
            </button>
          )}
          <button 
            onClick={handleStartScraping}
            disabled={isScrapingRunning || isAutoScrapingRunning}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScrapingRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {fetchingPendingTools ? 'Fetching tools...' : 'Scraping...'}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Batch
              </>
            )}
          </button>
          <button 
            onClick={handleStartAutoScraping}
            disabled={isScrapingRunning || isAutoScrapingRunning}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAutoScrapingRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Auto Scraping...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Auto Scrape All
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Scraping Configuration */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Scraping Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="batchSize" className="block text-sm font-medium text-gray-700 mb-1">
              Batch Size
            </label>
            <div className="flex items-center">
              <input
                id="batchSize"
                type="number"
                min="5"
                max="100"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 25)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-500">tools per batch</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Number of tools to process in each batch (5-100)
            </p>
          </div>
          <div>
            <label htmlFor="pauseDuration" className="block text-sm font-medium text-gray-700 mb-1">
              Pause Between Batches
            </label>
            <div className="flex items-center">
              <input
                id="pauseDuration"
                type="number"
                min="10"
                max="300"
                value={pauseDuration}
                onChange={(e) => setPauseDuration(parseInt(e.target.value) || 60)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-500">seconds</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Time to wait between processing batches (10-300 seconds)
            </p>
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Tools</h2>
          <p className="text-3xl font-bold text-blue-600">{statsLoading ? '...' : stats?.total || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Affiliate Programs Found</h2>
          <p className="text-3xl font-bold text-green-600">{statsLoading ? '...' : stats?.found || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No Affiliate Program</h2>
          <p className="text-3xl font-bold text-red-600">{statsLoading ? '...' : stats?.notFound || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Pending</h2>
          <p className="text-3xl font-bold text-yellow-600">{statsLoading ? '...' : stats?.pending || 0}</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-700">Progress</h2>
          <span className="text-sm font-medium text-gray-600">
            {statsLoading ? '...' : `${stats?.percentComplete || 0}%`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${statsLoading ? 0 : stats?.percentComplete || 0}%` }}
          ></div>
        </div>
      </div>
      
      {duplicateCount > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-700">
                <span className="font-bold">Warning:</span> Found {duplicateCount} duplicate tools in the database.
              </p>
              <button
                onClick={handleFixDuplicates}
                disabled={isFixingDuplicates}
                className="mt-2 flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm"
              >
                {isFixingDuplicates ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Filter className="w-3 h-3 mr-1" />
                )}
                Fix Duplicates
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tools and Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-800">Affiliate Links</h2>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Found">Found</option>
              <option value="Not Found">Not Found</option>
              <option value="Pending">Pending</option>
            </select>
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={() => setShowEnhancedFields(!showEnhancedFields)}
              className={`flex items-center px-4 py-2 ${showEnhancedFields ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'} rounded-md hover:bg-indigo-700 hover:text-white transition-colors`}
            >
              <Image className="w-4 h-4 mr-2" />
              {showEnhancedFields ? 'Hide Enhanced Fields' : 'Show Enhanced Fields'}
            </button>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tool
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Website
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affiliate URL
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                {showEnhancedFields && (
                  <>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Social Links
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Images
                    </th>
                  </>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {linksLoading ? (
                <tr>
                  <td colSpan={showEnhancedFields ? 8 : 5} className="px-6 py-4 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : affiliateLinks?.data.length === 0 ? (
                <tr>
                  <td colSpan={showEnhancedFields ? 8 : 5} className="px-6 py-4 text-center text-gray-500">
                    No affiliate links found. Upload a CSV or add tools manually.
                  </td>
                </tr>
              ) : (
                affiliateLinks?.data.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{link.tool_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a 
                        href={link.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {getHostname(link.website_url)}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {link.affiliate_url ? (
                        <a 
                          href={link.affiliate_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Program
                        </a>
                      ) : (
                        <span className="text-sm text-gray-500">Not found</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{link.commission || 'N/A'}</div>
                    </td>
                    {showEnhancedFields && (
                      <>
                        <td className="px-6 py-4">
                          {renderTags(link.tags)}
                        </td>
                        <td className="px-6 py-4">
                          {renderSocialLinks(link.social_links)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1">
                            {link.logo_url && renderImagePreview(link.logo_url, 'Logo')}
                            {link.favicon_url && renderImagePreview(link.favicon_url, 'Favicon')}
                            {link.image_url && renderImagePreview(link.image_url, 'Image')}
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(link.status)}
                        <span className="ml-2 text-sm text-gray-900">{link.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleResetTool(link.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Reset to Pending"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTool(link.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Tool"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {affiliateLinks && affiliateLinks.count > pageSize && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(page * pageSize, affiliateLinks.count)}
              </span>{' '}
              of <span className="font-medium">{affiliateLinks.count}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * pageSize >= affiliateLinks.count}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Admin Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleFixRlsPolicies}
            disabled={isFixingRls}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFixingRls ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Fix RLS Policies
              </>
            )}
          </button>
          
          <button
            onClick={handleFixDuplicates}
            disabled={isFixingDuplicates}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFixingDuplicates ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <Filter className="w-4 h-4 mr-2" />
                Fix Duplicates
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Tools by Status
          </button>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
