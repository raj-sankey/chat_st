import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";

export interface ChatMessage {
  from: string;
  to?: string;
  room?: string;
  content: string;
  type?: string;
  fileUrl?: string;
  fileName?: string;
  timestamp: Date;
  id?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  currentUser: User | null;
  messages: ChatMessage[];
  sendMessage: (message: Omit<ChatMessage, "timestamp" | "id">) => void;
  sendTypingIndicator: (to?: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  getChatHistory: (username: string, roomId?: string) => ChatMessage[];
  createGroup: (
    name: string,
    members: string[],
    createdBy: string
  ) => Promise<any>;
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  getUserGroups: (username: string) => Promise<any[]>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
  user: User | null;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  user,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    // Initialize socket connection
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server");

      // Join with username
      newSocket.emit("join", { username: user.username });
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from server");
    });

    newSocket.on("online_users", (users: string[]) => {
      setOnlineUsers(users);
    });

    newSocket.on(
      "receive_message",
      (message: Omit<ChatMessage, "timestamp" | "id">) => {
        const newMessage: ChatMessage = {
          ...message,
          timestamp: new Date(),
          id: Math.random().toString(36).substr(2, 9),
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    );

    newSocket.on(
      "message_sent_ack",
      (message: Omit<ChatMessage, "timestamp" | "id">) => {
        // Handle message acknowledgement if needed
        console.log("Message sent successfully:", message);
      }
    );

    newSocket.on("typing", (data: { from: string }) => {
      // Handle typing indicator
      console.log(`${data.from} is typing...`);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const sendMessage = (message: Omit<ChatMessage, "timestamp" | "id">) => {
    if (socket) {
      socket.emit("send_message", message);
      // Add to local messages immediately for optimistic UI update
      const optimisticMessage: ChatMessage = {
        ...message,
        timestamp: new Date(),
        id: `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      setMessages((prev) => [...prev, optimisticMessage]);
    }
  };

  const sendTypingIndicator = (to?: string) => {
    if (socket) {
      socket.emit("typing", { to });
    }
  };

  const joinRoom = (roomId: string) => {
    if (socket) {
      socket.emit("join_room", roomId);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket) {
      socket.emit("leave_room", roomId);
    }
  };

  const getChatHistory = (username: string, roomId?: string): ChatMessage[] => {
    if (roomId) {
      return messages.filter((msg) => msg.room === roomId);
    } else {
      return messages.filter(
        (msg) =>
          (msg.from === user?.username && msg.to === username) ||
          (msg.from === username && msg.to === user?.username)
      );
    }
  };

  const createGroup = async (
    name: string,
    members: string[],
    createdBy: string
  ) => {
    try {
      const response = await fetch(`http://localhost:5000/api/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          createdBy,
          members,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Create group error:", error);
      throw new Error("Failed to create group");
    }
  };

  const joinGroup = (groupId: string) => {
    if (socket) {
      socket.emit("join_group", groupId);
      console.log(`Joining group: ${groupId}`);
    }
  };

  const leaveGroup = (groupId: string) => {
    if (socket) {
      socket.emit("leave_group", groupId);
    }
  };

  const getUserGroups = async (username: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${username}/groups`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user groups");
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch user groups:", error);
      throw error;
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    currentUser: user,
    messages,
    sendMessage,
    sendTypingIndicator,
    joinRoom,
    leaveRoom,
    getChatHistory,
    createGroup,
    joinGroup,
    leaveGroup,
    getUserGroups,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
