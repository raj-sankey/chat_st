import React, { useState, useEffect } from "react";
import ChatSidebar from "../ChatSidebar/ChatSidebar";
import ChatWindow from "../ChatWindow/ChatWindow";
import { useSocket } from "../../contexts/SocketContext";

interface SingleChat {
  type: "single";
  incident_id: string;
  responder_name: string;
  responder_id: string;
  responder_img_url: string;
  username: string;
  email: string;
}

interface GroupChat {
  type: "group";
  incident_id: string;
  incident_name: string;
  incident_img_url: string;
  responder: SingleChat[];
}

type Chat = SingleChat | GroupChat;

const ChatLayout: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [availableChats, setAvailableChats] = useState<Chat[]>([]);
  const { onlineUsers, currentUser } = useSocket();

  const handleTogglePin = (chatId: string) => {
    setPinnedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    );
  };

  // Fetch available users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users");
        if (response.ok) {
          const users = await response.json();

          // Filter out current user and format as SingleChat objects
          const chatUsers = users
            .filter((user: any) => user.username !== currentUser?.username)
            .map((user: any) => ({
              type: "single" as const,
              incident_id: user._id || user.id,
              responder_name: user.name,
              responder_id: user._id || user.id,
              responder_img_url: "",
              username: user.username,
              email: user.username + "@example.com", // Default email
            }));

          setAvailableChats(chatUsers);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  // Create group chats from online users (optional - you can modify this logic)
  useEffect(() => {
    if (onlineUsers.length > 0 && currentUser) {
      // Create a group with all online users (excluding current user)
      const onlineUsernames = onlineUsers.filter(
        (username) => username !== currentUser.username
      );

      if (onlineUsernames.length > 1) {
        // For demo purposes, create a group with online users
        // In a real app, you'd have a proper group creation mechanism
        const groupChat: GroupChat = {
          type: "group",
          incident_id: "online-users-group",
          incident_name: "Online Users",
          incident_img_url: "",
          responder: availableChats.filter(
            (chat) =>
              chat.type === "single" && onlineUsernames.includes(chat.username)
          ) as SingleChat[],
        };

        // Add group chat if it doesn't exist
        setAvailableChats((prev) => {
          const hasGroup = prev.some(
            (chat) => chat.incident_id === "online-users-group"
          );
          if (!hasGroup && groupChat.responder.length > 1) {
            return [...prev, groupChat];
          }
          return prev;
        });
      }
    }
  }, [onlineUsers, availableChats, currentUser]);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white border-2 rounded-xl border-[#E4E4E7]">
      <ChatSidebar
        chats={availableChats}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
        pinnedChats={pinnedChats}
        onlineUsers={onlineUsers}
      />
      <ChatWindow
        selectedChat={selectedChat}
        onTogglePin={handleTogglePin}
        pinnedChats={pinnedChats}
      />
    </div>
  );
};

export default ChatLayout;
