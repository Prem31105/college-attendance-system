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

  @SubscribeMessage('join_user')
  handleJoinUser(client: Socket, userId: string) {
    client.join(`user_${userId}`);
    return { event: 'joined_user', userId };
  }

  @SubscribeMessage('join_role')
  handleJoinRole(client: Socket, role: string) {
    client.join(`role_${role}`);
    return { event: 'joined_role', role };
  }

  /**
   * Broadcasts real-time notification to a specific user
   */
  broadcastNotificationToUser(userId: string, notification: any) {
    if (this.server) {
      this.server.to(`user_${userId}`).emit('new_notification', notification);
    }
  }

  /**
   * Broadcasts real-time announcement to all users with a specific role
   */
  broadcastNotificationToRole(role: string, notification: any) {
    if (this.server) {
      this.server.to(`role_${role}`).emit('role_announcement', notification);
    }
  }

  /**
   * Broadcasts global announcement to all connected clients
   */
  broadcastGlobalAnnouncement(notification: any) {
    if (this.server) {
      this.server.emit('global_announcement', notification);
    }
  }
}
