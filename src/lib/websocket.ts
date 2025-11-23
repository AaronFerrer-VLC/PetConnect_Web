// src/lib/websocket.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type MessageType = 
  | "connected"
  | "new_message"
  | "message_sent"
  | "typing"
  | "messages_read"
  | "error";

export interface WebSocketMessage {
  type: MessageType;
  message?: any;
  thread_id?: string;
  sender_id?: string;
  receiver_id?: string;
  is_typing?: boolean;
  user_id?: string;
  [key: string]: any;
}

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private token: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(token: string) {
    this.token = token;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = API_URL.replace("http://", "ws://").replace("https://", "wss://");
        this.ws = new WebSocket(`${wsUrl}/ws/${this.token}`);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("WebSocket disconnected");
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect().catch(console.error);
      }, 1000 * this.reconnectAttempts);
    }
  }

  private handleMessage(data: WebSocketMessage) {
    const listeners = this.listeners.get(data.type);
    if (listeners) {
      listeners.forEach((listener) => listener(data));
    }
  }

  on(event: MessageType, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: MessageType, callback: (data: any) => void) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  sendMessage(threadId: string, receiverId: string, body: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "send_message",
        thread_id: threadId,
        receiver_id: receiverId,
        body,
      }));
    }
  }

  sendTyping(threadId: string, receiverId: string, isTyping: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "typing",
        thread_id: threadId,
        receiver_id: receiverId,
        is_typing: isTyping,
      }));
    }
  }

  markRead(threadId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "mark_read",
        thread_id: threadId,
      }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

