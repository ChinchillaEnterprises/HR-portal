"use client";

import { Suspense, lazy, ComponentType, ReactNode, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Intersection Observer based lazy loading wrapper
 */
export function LazyLoad({ 
  children, 
  fallback,
  threshold = 0.1,
  rootMargin = '50px'
}: LazyLoadProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref}>
      {isIntersecting ? (
        children
      ) : (
        fallback || <DefaultFallback />
      )}
    </div>
  );
}

/**
 * Default loading fallback
 */
function DefaultFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );
}

/**
 * Enhanced Suspense with loading animation
 */
export function SuspenseWithLoader({ 
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        fallback || (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center p-8"
          >
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          </motion.div>
        )
      }
    >
      {children}
    </Suspense>
  );
}

/**
 * Create a lazy-loaded component with automatic loading state
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    fallback?: ReactNode;
    preload?: boolean;
  }
) {
  const LazyComponent = lazy(importFn);

  // Preload option
  if (options?.preload) {
    importFn();
  }

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <SuspenseWithLoader fallback={options?.fallback}>
        <LazyComponent {...props} />
      </SuspenseWithLoader>
    );
  };
}

/**
 * Image lazy loading with blur placeholder
 */
export function LazyImage({
  src,
  alt,
  className,
  placeholder,
  onLoad,
}: {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {placeholder && !loaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm"
        />
      )}
      
      {/* Main image */}
      <motion.img
        src={src}
        alt={alt}
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
        onError={() => setError(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className={`w-full h-full object-cover ${!loaded ? 'invisible' : ''}`}
      />
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-sm text-gray-500">Failed to load image</p>
        </div>
      )}
    </div>
  );
}

