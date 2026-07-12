"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      theme="light"
      toastOptions={{
        style: {
          background: 'var(--paper)',
          border: '1px solid var(--rule)',
          borderRadius: '12px',
          color: 'var(--ink)',
          boxShadow: '0 4px 12px rgba(9, 9, 11, 0.08)'
        }
      }}
    />
  );
}