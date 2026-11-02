import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers?.authorization;
      const token =
        client.handshake.auth?.token ||
        (authHeader && authHeader.startsWith('Bearer ')
          ? authHeader.substring(7)
          : authHeader);

      if (!token) {
        client.emit('auth_error', { message: 'Authentication token required' });
        client.disconnect(true);
        return;
      }

      const secret =
        process.env.JWT_ACCESS_SECRET ||
        'dev_jwt_access_secret_for_docker_testing_only_change_in_prod_64char_string';
      const decoded = jwt.verify(token, secret) as {
        sub: string;
        email: string;
        role: string;
      };

      client.data.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };

      // Auto-join the authenticated user's private room and role room
      client.join(`user_${decoded.sub}`);
      client.join(`role_${decoded.role}`);
    } catch {
      client.emit('auth_error', { message: 'Invalid or expired token' });
      client.disconnect(true);
    }
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
    const user = client.data?.user;
    if (!user) {
      return { event: 'error', message: 'Unauthorized: client not authenticated' };
    }
    // Only allow joining own user room unless user is ADMIN
    if (user.id !== userId && user.role !== 'ADMIN') {
      return { event: 'error', message: 'Forbidden: Cannot join another user room' };
    }
    client.join(`user_${userId}`);
    return { event: 'joined_user', userId };
  }

  @SubscribeMessage('join_role')
  handleJoinRole(client: Socket, role: string) {
    const user = client.data?.user;
    if (!user) {
      return { event: 'error', message: 'Unauthorized: client not authenticated' };
    }
    // Only allow joining own role room unless user is ADMIN
    if (user.role !== role && user.role !== 'ADMIN') {
      return { event: 'error', message: 'Forbidden: Cannot join unassigned role room' };
    }
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
