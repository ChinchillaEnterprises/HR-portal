"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  ChevronDown,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  MapPin,
  Loader2
} from "lucide-react";
import { usePaginatedData, useDebouncedSearch } from "@/hooks/useOptimizedData";
import { LazyLoad, LazyImage } from "@/components/LazyLoad";
import { CacheService } from "@/lib/performance/cacheService";
import { PerformanceMonitor } from "@/lib/performance/performanceMonitor";

interface Applicant {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  position?: string;
  status: string;
  appliedDate: string;
  profileImageUrl?: string;
  resumeUrl?: string;
  location?: string;
  experience?: string;
}

export default function OptimizedApplicantsList() {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(new Set());

  // Use optimized pagination hook
  const {
    data: applicants,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  } = usePaginatedData<Applicant>('Applicant', {
    cache: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    batchSize: 20,
  });

  // Debounced search
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    searching
  } = useDebouncedSearch(async (query: string) => {
    // Simulate search - in real app, this would query the API
    return applicants.filter(applicant => 
      applicant.fullName.toLowerCase().includes(query.toLowerCase()) ||
      applicant.email.toLowerCase().includes(query.toLowerCase()) ||
      applicant.position?.toLowerCase().includes(query.toLowerCase())
    );
  }, 300);

  // Memoized filtered applicants
  const filteredApplicants = useMemo(() => {
    PerformanceMonitor.startTimer('filter.applicants');
    
    let filtered = searchQuery ? searchResults : applicants;
    
    if (selectedStatus !== "all") {
      filtered = filtered.filter(a => a.status === selectedStatus);
    }
    
    PerformanceMonitor.endTimer('filter.applicants', {
      count: filtered.length,
      status: selectedStatus,
      hasSearch: !!searchQuery
    });
    
    return filtered;
  }, [applicants, searchResults, searchQuery, selectedStatus]);

  // Status counts with caching
  const statusCounts = useMemo(() => {
    const cacheKey = 'status_counts';
    const cached = CacheService.get<Record<string, number>>(cacheKey);
    
    if (cached) return cached;
    
    const counts = applicants.reduce((acc, applicant) => {
      acc[applicant.status] = (acc[applicant.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    CacheService.set(cacheKey, counts, 60000); // 1 minute
    return counts;
  }, [applicants]);

  // Batch operations
  const handleBatchOperation = useCallback(async (operation: 'email' | 'export' | 'delete') => {
    const selected = Array.from(selectedApplicants);
    if (selected.length === 0) return;

    PerformanceMonitor.startTimer(`batch.${operation}`);
    
    try {
      // Simulate batch operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear selection after operation
      setSelectedApplicants(new Set());
      
      PerformanceMonitor.endTimer(`batch.${operation}`, {
        count: selected.length
      });
    } catch (error) {
      console.error(`Batch ${operation} failed:`, error);
    }
  }, [selectedApplicants]);

  // Intersection observer for infinite scroll
  const observerTarget = useCallback((node: HTMLDivElement | null) => {
    if (!node || loading || !hasMore) return;
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, hasMore, loadMore]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: 'bg-blue-100 text-blue-700',
      screening: 'bg-yellow-100 text-yellow-700',
      interview: 'bg-purple-100 text-purple-700',
      offer: 'bg-green-100 text-green-700',
      hired: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-red-600">Failed to load applicants</p>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Applicants ({applicants.length})
            </h2>
            {selectedApplicants.size > 0 && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {selectedApplicants.size} selected
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search applicants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={refresh}
                disabled={loading}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {selectedApplicants.size > 0 && (
                <>
                  <button
                    onClick={() => handleBatchOperation('email')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Email Selected
                  </button>
                  <button
                    onClick={() => handleBatchOperation('export')}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedStatus === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({applicants.length})
                </button>
                {Object.entries(statusCounts).map(([status, count]) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedStatus === status
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status} ({count})
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Applicants List */}
      <div className="space-y-4">
        {loading && applicants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Loading applicants...</p>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No applicants found</p>
          </div>
        ) : (
          <>
            {filteredApplicants.map((applicant, index) => (
              <LazyLoad key={applicant.id} threshold={0.1} rootMargin="100px">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedApplicants.has(applicant.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedApplicants);
                        if (e.target.checked) {
                          newSelected.add(applicant.id);
                        } else {
                          newSelected.delete(applicant.id);
                        }
                        setSelectedApplicants(newSelected);
                      }}
                      className="mt-1"
                    />

                    {/* Profile Image */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {applicant.profileImageUrl ? (
                        <LazyImage
                          src={applicant.profileImageUrl}
                          alt={applicant.fullName}
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <Users className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Applicant Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {applicant.fullName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {applicant.position || 'No position specified'}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(applicant.status)}`}>
                          {applicant.status}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {applicant.email}
                        </div>
                        {applicant.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {applicant.phone}
                          </div>
                        )}
                        {applicant.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {applicant.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Applied {new Date(applicant.appliedDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </LazyLoad>
            ))}

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={observerTarget} className="py-4 text-center">
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                ) : (
                  <button
                    onClick={loadMore}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Load more
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}