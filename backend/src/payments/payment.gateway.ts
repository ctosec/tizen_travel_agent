import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/payments',
})
export class PaymentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PaymentGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribePayment')
  handleSubscribe(client: Socket, orderId: string) {
    const room = `payment:${orderId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { orderId } };
  }

  @SubscribeMessage('unsubscribePayment')
  handleUnsubscribe(client: Socket, orderId: string) {
    const room = `payment:${orderId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
  }

  notifyPaymentUpdate(
    orderId: string,
    status: string,
    data?: Record<string, unknown>,
  ) {
    const room = `payment:${orderId}`;
    this.server.to(room).emit('paymentStatus', { orderId, status, data });
    this.logger.log(`Notified ${room}: status=${status}`);
  }
}
