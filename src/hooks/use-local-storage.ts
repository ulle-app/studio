// @ts-nocheck
// TODO: Fix this file
'use client';
import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    // This effect runs when isClient becomes true,
    // re-initializing storedValue with the actual localStorage data.
    if (isClient) {
      try {
        const item = window.localStorage.getItem(key);
        const newValue = item ? JSON.parse(item) : initialValue;
        // Only update if the value is different to avoid unnecessary re-renders.
        // This comparison might be tricky for complex objects.
        if (JSON.stringify(newValue) !== JSON.stringify(storedValue)) {
            setStoredValue(newValue);
        }
      } catch (error) {
        console.error(`Error reading localStorage key “${key}” on client mount:`, error);
        // setStoredValue(initialValue); // Already handled by initial useState
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, key, initialValue]);


  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (!isClient) return;
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue, isClient]
  );
  
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (error) {
           console.error(`Error parsing storage change for key “${key}”:`, error);
        }
      } else if (event.key === key && !event.newValue) { // Handle item removal
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, isClient, initialValue]);


  return [storedValue, setValue];
}

export default useLocalStorage;
