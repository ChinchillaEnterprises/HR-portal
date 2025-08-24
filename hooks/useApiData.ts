"use client";

import { useState, useEffect, useCallback } from 'react';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

interface UseApiDataResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

interface ApiCall<T> {
  name: string;
  call: () => Promise<{ data: T[] }>;
  defaultValue: T[];
}

/**
 * Custom hook for fetching data from AWS Amplify with error handling
 * Supports multiple API calls with Promise.allSettled
 */
export function useApiData<T extends Record<string, any[]>>(
  apiCalls: ApiCall<any>[],
  deps: any[] = []
): UseApiDataResult<T> {
  const [data, setData] = useState<T>(() => {
    const initial: any = {};
    apiCalls.forEach(({ name, defaultValue }) => {
      initial[name] = defaultValue;
    });
    return initial;
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Execute all API calls with Promise.allSettled
      const results = await Promise.allSettled(
        apiCalls.map(({ call }) => call())
      );

      // Process results and build data object
      const newData: any = {};
      let hasError = false;

      results.forEach((result, index) => {
        const { name, defaultValue } = apiCalls[index];
        
        if (result.status === 'fulfilled' && result.value?.data) {
          newData[name] = result.value.data;
        } else {
          // Log error for debugging
          console.error(`Failed to load ${name}:`, result.status === 'rejected' ? result.reason : 'No data');
          newData[name] = defaultValue;
          hasError = true;
        }
      });

      setData(newData);
      
      if (hasError) {
        setError('Some data could not be loaded. Using cached or default values.');
      }
    } catch (err) {
      console.error('Unexpected error loading data:', err);
      setError('Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [apiCalls]);

  useEffect(() => {
    loadData();
  }, deps);

  return {
    data,
    loading,
    error,
    reload: loadData,
  };
}

/**
 * Specific hook for loading users
 */
export function useUsers() {
  return useApiData<{ users: Schema["User"]["type"][] }>([
    {
      name: 'users',
      call: () => client.models.User.list(),
      defaultValue: [],
    }
  ]);
}

/**
 * Specific hook for loading documents
 */
export function useDocuments() {
  return useApiData<{ documents: Schema["Document"]["type"][] }>([
    {
      name: 'documents',
      call: () => client.models.Document.list(),
      defaultValue: [],
    }
  ]);
}

/**
 * Specific hook for loading applicants
 */
export function useApplicants() {
  return useApiData<{ applicants: Schema["Applicant"]["type"][] }>([
    {
      name: 'applicants',
      call: () => client.models.Applicant.list(),
      defaultValue: [],
    }
  ]);
}

/**
 * Specific hook for loading dashboard data
 */
export function useDashboardData() {
  return useApiData<{
    users: Schema["User"]["type"][];
    documents: Schema["Document"]["type"][];
    applicants: Schema["Applicant"]["type"][];
    communications: Schema["Communication"]["type"][];
  }>([
    {
      name: 'users',
      call: () => client.models.User.list(),
      defaultValue: [],
    },
    {
      name: 'documents',
      call: () => client.models.Document.list(),
      defaultValue: [],
    },
    {
      name: 'applicants',
      call: () => client.models.Applicant.list(),
      defaultValue: [],
    },
    {
      name: 'communications',
      call: () => client.models.Communication.list(),
      defaultValue: [],
    },
  ]);
}