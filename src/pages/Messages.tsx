// src/pages/Messages.tsx
import { useEffect, useState, useRef } from "react";
import { MessagesAPI, getMe, type Message, type Thread } from "../lib/api";
import { ChatWebSocket } from "../lib/websocket";
import Button from "../components/Button";

export default function Messages() {
  const [me, setMe] = useState<any>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [ws, setWs] = useState<ChatWebSocket | null>(null);
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let websocket: ChatWebSocket | null = null;
    
    (async () => {
      const user = await getMe();
      if (user) {
        setMe(user);
        const token = localStorage.getItem("token");
        if (token) {
          websocket = new ChatWebSocket(token);
          await websocket.connect();
          setWs(websocket);

          // Listeners
          websocket.on("new_message", (data) => {
            if (data.message) {
              setMessages((prev) => [...prev, data.message]);
              // Actualizar threads
              loadThreads();
            }
          });

          websocket.on("message_sent", (data) => {
            if (data.message) {
              setMessages((prev) => [...prev, data.message]);
            }
          });

          websocket.on("typing", (data) => {
            if (data.thread_id === selectedThread?.thread_id) {
              setOtherTyping(data.is_typing || false);
            }
          });
        }
      }
      await loadThreads();
    })();

    return () => {
      if (websocket) {
        websocket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.thread_id);
      // Marcar como leído
      MessagesAPI.markThreadRead(selectedThread.thread_id).then(() => {
        // Actualizar threads para quitar el badge de no leídos
        loadThreads();
      });
    }
  }, [selectedThread?.thread_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadThreads = async () => {
    try {
      const data = await MessagesAPI.listThreads();
      setThreads(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const data = await MessagesAPI.list(threadId);
      setMessages(data);
    } catch (error) {
      console.error(error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread || !me || !ws) return;

    const otherUser = selectedThread.other_user;
    ws.sendMessage(selectedThread.thread_id, otherUser.id, newMessage.trim());
    setNewMessage("");
    setTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (!selectedThread || !ws) return;

    if (!typing) {
      setTyping(true);
      ws.sendTyping(selectedThread.thread_id, selectedThread.other_user.id, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      if (ws) {
        ws.sendTyping(selectedThread.thread_id, selectedThread.other_user.id, false);
      }
    }, 1000);
  };

  if (!me) {
    return <div className="max-w-6xl mx-auto p-4">Cargando...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-semibold mb-4">Mensajes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* Lista de conversaciones */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-semibold">Conversaciones</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">
                No tienes conversaciones
              </div>
            ) : (
              threads.map((thread) => {
                const otherUser = thread.other_user;
                const isSelected = selectedThread?.thread_id === thread.thread_id;
                return (
                  <button
                    key={thread.thread_id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full p-4 text-left border-b border-slate-700 hover:bg-slate-700/50 transition ${
                      isSelected ? "bg-slate-700" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={otherUser.photo || "/placeholder-avatar.png"}
                        alt={otherUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">{otherUser.name}</p>
                          {thread.unread_count > 0 && (
                            <span className="bg-emerald-500 text-white text-xs rounded-full px-2 py-0.5">
                              {thread.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 truncate">
                          {thread.last_message.body}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(thread.last_message.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="md:col-span-2 bg-slate-800 rounded-lg border border-slate-700 flex flex-col">
          {selectedThread ? (
            <>
              {/* Header del chat */}
              <div className="p-4 border-b border-slate-700 flex items-center gap-3">
                <img
                  src={selectedThread.other_user.photo || "/placeholder-avatar.png"}
                  alt={selectedThread.other_user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">{selectedThread.other_user.name}</p>
                  {otherTyping && (
                    <p className="text-xs text-slate-400">Escribiendo...</p>
                  )}
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === me.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isMe
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-700 text-slate-100"
                        }`}
                      >
                        <p className="text-sm">{msg.body}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isMe ? "text-emerald-100" : "text-slate-400"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="input flex-1"
                  />
                  <Button type="submit" variant="brand" disabled={!newMessage.trim()}>
                    Enviar
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <p className="text-lg mb-2">Selecciona una conversación</p>
                <p className="text-sm">O inicia una nueva desde un perfil de cuidador</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
