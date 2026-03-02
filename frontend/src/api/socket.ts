import { io, type Socket } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function connectPaymentSocket(
  orderId: string,
  onStatus: (data: { orderId: string; status: string; data?: any }) => void,
): () => void {
  socket = io(`${SOCKET_URL}/payments`, {
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
    socket?.emit('subscribePayment', orderId);
  });

  socket.on('paymentStatus', onStatus);

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  return () => {
    socket?.emit('unsubscribePayment', orderId);
    socket?.disconnect();
    socket = null;
  };
}
