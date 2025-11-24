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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
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
              setMessages((prev) => {
                // Evitar duplicados
                const exists = prev.find(m => m.id === data.message.id);
                if (exists) return prev;
                // Añadir el nuevo mensaje
                const updated = [...prev, data.message];
                // Ordenar por fecha
                return updated.sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              });
              // Actualizar threads
              loadThreads();
            }
          });

          websocket.on("message_sent", (data) => {
            if (data.message) {
              setMessages((prev) => {
                // Remover todos los mensajes temporales del mismo thread
                const filtered = prev.filter(m => {
                  // Mantener mensajes que no son temporales
                  if (!m.id.startsWith("temp-")) return true;
                  // Remover temporales del mismo thread
                  return m.thread_id !== data.message.thread_id;
                });
                // Evitar duplicados
                const exists = filtered.find(m => m.id === data.message.id);
                if (exists) {
                  // Si ya existe, mantener el orden correcto
                  return filtered;
                }
                // Añadir el mensaje real
                const updated = [...filtered, data.message];
                // Ordenar por fecha para asegurar orden correcto
                return updated.sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              });
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
    } else {
      setMessages([]);
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
    if (!threadId) return;
    try {
      const data = await MessagesAPI.list(threadId);
      // Ordenar por fecha de creación
      const sorted = data.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sorted);
      // Scroll al final después de cargar
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread || !me || !ws) return;

    const otherUser = selectedThread.other_user;
    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Optimistic update: añadir el mensaje inmediatamente al estado local
    const tempMessage: Message = {
      id: tempId,
      thread_id: selectedThread.thread_id,
      sender_id: me.id,
      receiver_id: otherUser.id,
      body: messageText,
      created_at: new Date().toISOString(),
      read: false,
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");
    setTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    try {
      // Enviar vía WebSocket
      ws.sendMessage(selectedThread.thread_id, otherUser.id, messageText);
      
      // Timeout de seguridad: si después de 5 segundos no llega la confirmación, recargar mensajes
      setTimeout(() => {
        setMessages((prev) => {
          // Si aún existe el mensaje temporal, significa que no llegó la confirmación
          const stillHasTemp = prev.find(m => m.id === tempId);
          if (stillHasTemp) {
            console.warn("Mensaje temporal aún presente después de 5s, recargando...");
            // Recargar mensajes para obtener el estado real
            if (selectedThread) {
              loadMessages(selectedThread.thread_id);
            }
          }
          return prev;
        });
      }, 5000);
    } catch (error) {
      console.error("Error sending message:", error);
      // Si hay error, remover el mensaje temporal
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      alert("No se pudo enviar el mensaje. Por favor, inténtalo de nuevo.");
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

  const handleUpdateMessage = async (messageId: string) => {
    if (!editText.trim()) {
      setEditingId(null);
      return;
    }
    try {
      const updated = await MessagesAPI.update(messageId, editText.trim());
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
      setEditingId(null);
      setEditText("");
      loadThreads();
    } catch (error) {
      console.error("Error updating message:", error);
      alert("No se pudo editar el mensaje.");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("¿Eliminar este mensaje?")) return;
    try {
      await MessagesAPI.delete(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      loadThreads();
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("No se pudo eliminar el mensaje.");
    }
  };

  if (!me) {
    return <div className="max-w-6xl mx-auto p-4">Cargando...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4" style={{ minHeight: "calc(100vh - 8rem)", paddingBottom: "2rem" }}>
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

              {/* Mensajes - Estilo WhatsApp */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#0b141a]">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === me.id;
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                  const showTime = idx === messages.length - 1 || 
                    (messages[idx + 1] && messages[idx + 1].sender_id !== msg.sender_id);
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 mb-1 ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      {!isMe && (
                        <div className="w-8 h-8 flex-shrink-0">
                          {showAvatar ? (
                            <img
                              src={selectedThread.other_user.photo || "/placeholder-avatar.png"}
                              alt={selectedThread.other_user.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8" />
                          )}
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          isMe
                            ? "bg-[#005c4b] text-white rounded-tr-none"
                            : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
                        }`}
                      >
                        {editingId === msg.id ? (
                          <div className="flex gap-2">
                            <input
                              className="flex-1 bg-[#202c33] text-white px-2 py-1 rounded text-sm"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleUpdateMessage(msg.id);
                                }
                                if (e.key === "Escape") {
                                  setEditingId(null);
                                  setEditText("");
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateMessage(msg.id)}
                              className="px-2 py-1 bg-[#005c4b] rounded text-xs"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditText(""); }}
                              className="px-2 py-1 bg-[#202c33] rounded text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm leading-relaxed break-words">{msg.body}</p>
                            {isMe && (
                              <div className="flex gap-2 mt-1 justify-end">
                                <button
                                  onClick={() => {
                                    setEditingId(msg.id);
                                    setEditText(msg.body);
                                  }}
                                  className="text-xs opacity-60 hover:opacity-100"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="text-xs opacity-60 hover:opacity-100"
                                  title="Eliminar"
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                            {showTime && (
                              <p
                                className={`text-xs mt-1 ${
                                  isMe ? "text-[#99beb7]" : "text-[#8696a0]"
                                }`}
                              >
                                {new Date(msg.created_at).toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input - Estilo WhatsApp */}
              <form onSubmit={handleSend} className="p-3 bg-[#202c33] border-t border-[#313d45]">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-[#2a3942] text-[#e9edef] px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#005c4b]"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-10 h-10 rounded-full bg-[#005c4b] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#006d5b] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
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
