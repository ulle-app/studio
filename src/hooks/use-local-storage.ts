// @ts-nocheck
// TODO: Fix this file
'use client';
import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize state with initialValue. It will be updated from localStorage once client loads.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Effect to load from localStorage when client is ready
  useEffect(() => {
    if (isClient) {
      let valueFromStorage: T;
      try {
        const item = window.localStorage.getItem(key);
        valueFromStorage = item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error(`Error reading localStorage key “${key}” on client mount:`, error);
        valueFromStorage = initialValue;
      }
      setStoredValue(valueFromStorage); // setStoredValue is stable and handles diffing
    }
  }, [isClient, key, initialValue]); // Removed storedValue from dependencies


  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (!isClient) return;
      try {
        // Use setStoredValue's functional update form to ensure we operate on the latest state
        // and to avoid needing storedValue in this useCallback's dependency array.
        setStoredValue(prevStoredValue => {
          const valueToStore = value instanceof Function ? value(prevStoredValue) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, isClient] // setStoredValue from useState is stable and not needed in deps
  );

  // Effect to listen for storage changes from other tabs/windows
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        if (event.newValue) {
          try {
            setStoredValue(JSON.parse(event.newValue));
          } catch (error) {
             console.error(`Error parsing storage change for key “${key}”:`, error);
             setStoredValue(initialValue); // Fallback on error
          }
        } else { // Item was removed from localStorage (newValue is null)
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, isClient, initialValue]); // setStoredValue is stable


  return [storedValue, setValue];
}

export default useLocalStorage;
