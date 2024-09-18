import { useContext, type Context } from 'react';

export function useSafeContext<T>(Context: Context<T>) {
  const context = useContext(Context);
  if (context === undefined) throw new Error('Context Provider not found');
  return context as T;
}
