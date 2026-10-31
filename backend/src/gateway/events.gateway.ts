import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // Client connected
  }

  handleDisconnect(client: Socket) {
    // Client disconnected
  }

  @SubscribeMessage('join_session')
  handleJoinSession(client: Socket, sessionId: string) {
    client.join(`session_${sessionId}`);
    return { event: 'joined', sessionId };
  }

  @SubscribeMessage('leave_session')
  handleLeaveSession(client: Socket, sessionId: string) {
    client.leave(`session_${sessionId}`);
    return { event: 'left', sessionId };
  }

  /**
   * Broadcasts new attendance record event to the teacher session room
   */
  broadcastAttendanceUpdate(sessionId: string, record: any) {
    if (this.server) {
      this.server.to(`session_${sessionId}`).emit('attendance_update', record);
    }
  }

  /**
   * Broadcasts dynamic QR refreshed token to the teacher dashboard
   */
  broadcastQrRefresh(sessionId: string, qrData: any) {
    if (this.server) {
      this.server.to(`session_${sessionId}`).emit('qr_refreshed', qrData);
    }
  }

  /**
   * Broadcasts random physical verification challenge to selected student and teacher
   */
  broadcastRandomVerification(sessionId: string, challenge: any) {
    if (this.server) {
      this.server.to(`session_${sessionId}`).emit('random_verification_triggered', challenge);
    }
  }
}
