import { useEffect, useRef } from 'react';

const useInfiniteScroll = (callback, hasMore) => {
  const observer = useRef(null);
  const loading = useRef(false);

  // Use a callback ref so it gets triggered whenever the sentinel element changes
  const sentinelRef = (node) => {
    if (loading.current) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loading.current = true;
        callback().finally(() => {
          loading.current = false;
        });
      }
    });

    if (node) {
      observer.current.observe(node);
    }
  };

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return sentinelRef;
};

export default useInfiniteScroll;
