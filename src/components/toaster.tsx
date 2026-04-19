"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner 
      position="bottom-center" 
      theme="dark" 
      toastOptions={{
        style: { 
          background: 'var(--surface-2)', 
          border: '1px solid var(--border)', 
          color: 'var(--text)' 
        }
      }} 
    />
  );
}