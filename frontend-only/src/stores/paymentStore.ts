import { create } from 'zustand';
import { api, fetchServerBaseUrl } from '../api/client';

interface CreateSessionInput {
  amount: number;
  orderName: string;
  bookingType: string;
  bookingData: Record<string, unknown>;
  selectedMethod?: string;
}

// Map payment method IDs to Toss easyPay values
export const EASY_PAY_MAP: Record<string, string> = {
  tosspay: 'TOSSPAY',
  kakaopay: 'KAKAOPAY',
  samsungpay: 'SAMSUNGPAY',
  card: 'card',
};

export const PAYMENT_METHODS = [
  { id: 'kakaopay', label: '카카오페이', icon: '🟡' },
  { id: 'tosspay', label: '토스페이', icon: '🟦' },
  { id: 'samsungpay', label: '삼성페이', icon: '📱' },
] as const;

interface PaymentState {
  orderId: string | null;
  status: string;
  resultData: Record<string, unknown> | null;
  qrUrl: string | null;
  isCreating: boolean;
  selectedMethod: string | null;
  createSession: (data: CreateSessionInput) => Promise<string>;
  setStatus: (status: string, data?: Record<string, unknown>) => void;
  setSelectedMethod: (method: string | null) => void;
  reset: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  orderId: null,
  status: 'IDLE',
  resultData: null,
  qrUrl: null,
  isCreating: false,
  selectedMethod: null,
  createSession: async (data) => {
    set({ isCreating: true });
    const orderId = `QR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const selectedMethod = data.selectedMethod || 'card';

    try {
      await api.createPaymentSession({
        orderId,
        amount: data.amount,
        orderName: data.orderName,
        bookingType: data.bookingType,
        bookingData: data.bookingData,
        selectedMethod,
      });

      const serverBase = await fetchServerBaseUrl();
      const easyPay = EASY_PAY_MAP[selectedMethod.toLowerCase()] || selectedMethod;
      const checkoutUrl = `${serverBase}/api/checkout?orderId=${encodeURIComponent(orderId)}&amount=${data.amount}&orderName=${encodeURIComponent(data.orderName)}&method=${encodeURIComponent(easyPay)}`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkoutUrl)}`;

      set({ orderId, status: 'PENDING', qrUrl: qrImageUrl, isCreating: false });
      return orderId;
    } catch {
      set({ isCreating: false });
      throw new Error('Failed to create payment session');
    }
  },
  setStatus: (status, data) => set({ status, resultData: data ?? null }),
  setSelectedMethod: (method) => set({ selectedMethod: method }),
  reset: () => set({ orderId: null, status: 'IDLE', resultData: null, qrUrl: null, isCreating: false, selectedMethod: null }),
}));
