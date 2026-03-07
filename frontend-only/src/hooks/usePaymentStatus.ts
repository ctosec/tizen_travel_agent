import { useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { usePaymentStore } from '../stores/paymentStore';

/**
 * Polls the payment Worker for status updates.
 * Replaces the original WebSocket + polling approach.
 */
export function usePaymentStatus(
  orderId: string | null,
  onStatusChange?: (status: string, data?: Record<string, unknown>) => void,
) {
  const setStatus = usePaymentStore((s) => s.setStatus);
  const pollingRef = useRef<number | null>(null);

  const handleStatusChange = useCallback(
    (status: string, data?: Record<string, unknown>) => {
      setStatus(status, data);
      if (onStatusChange) onStatusChange(status, data);
    },
    [setStatus, onStatusChange],
  );

  useEffect(() => {
    if (!orderId) return;

    pollingRef.current = window.setInterval(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await api.getPaymentStatus(orderId);
        if (res.status !== 'PENDING') {
          handleStatusChange(res.status, res.data);
        }
      } catch {
        /* ignore polling errors */
      }
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [orderId, handleStatusChange]);
}
