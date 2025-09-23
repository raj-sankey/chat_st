import React, { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import userIcon from "../../assets/img/default_users.png";
import { MdOutlinePushPin } from "react-icons/md";
import { IoPeopleOutline, IoAdd } from "react-icons/io5";
import { useSocket } from "@/contexts/SocketContext";
import type { User } from "@/contexts/SocketContext";
import { Button } from "@/components/ui/button";
import CreateGroupModal from "../CreateGroupModal/CreateGroupModal";
import Icon from "@/components/Icons/Icon";

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

interface ChatSidebarProps {
  chats: Chat[];
  onSelectChat: (chat: Chat) => void;
  selectedChat: Chat | null;
  pinnedChats: string[];
  muteChats: string[];
  onlineUsers: string[];
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  onSelectChat,
  selectedChat,
  pinnedChats,
  muteChats,
  onlineUsers,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { getUserGroups, currentUser } = useSocket();
  const [groups, setGroups] = useState<any[]>([]);
  const { messages } = useSocket();

  // Combine individual chats and group chats
  const allChats = useMemo(() => {
    const groupChats = groups.map((group) => ({
      type: "group" as const,
      incident_id: group._id,
      incident_name: group.name,
      incident_img_url: "", // You can add group avatars later
      responder: group.members.map((username: string) => {
        const user = allUsers.find((u) => u.username === username);
        return {
          type: "single" as const,
          incident_id: username,
          responder_name: user?.name || username,
          responder_id: username,
          responder_img_url: "",
          username: username,
          email: `${username}@example.com`, // You might want to store emails in your user model
        };
      }),
    }));

    return [...chats, ...groupChats];
  }, [chats, groups, allUsers]);

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return allChats;

    const query = searchQuery.toLowerCase().trim();
    return chats.filter((chat) => {
      if (chat.type === "single") {
        return (
          chat.responder_name.toLowerCase().includes(query) ||
          chat.username.toLowerCase().includes(query) ||
          chat.email.toLowerCase().includes(query)
        );
      } else {
        return (
          chat.incident_name.toLowerCase().includes(query) ||
          chat.responder.some(
            (r) =>
              r.responder_name.toLowerCase().includes(query) ||
              r.username.toLowerCase().includes(query) ||
              r.email.toLowerCase().includes(query)
          )
        );
      }
    });
  }, [allChats, searchQuery]);

  // Get last message time for a chat
  const getLastMessageTime = (chat: Chat): string | null => {
    let relevantMessages = [];

    if (chat.type === "single") {
      // Get messages between current user and this user
      relevantMessages = messages.filter(
        (msg) =>
          (msg.from === chat.username && msg.to) ||
          (msg.to === chat.username && msg.from)
      );
    } else {
      // Get messages for this group/room
      relevantMessages = messages.filter(
        (msg) => msg.room === chat.incident_id
      );
    }

    if (relevantMessages.length === 0) return null;

    // Sort by timestamp and get the latest message
    const lastMessage = relevantMessages.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    return formatLastMessageTime(lastMessage.timestamp);
  };

  // Format the last message time
  const formatLastMessageTime = (timestamp: Date): string => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours =
      (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      // Less than 1 hour ago
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      // Today
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else if (diffInHours < 48) {
      // Yesterday
      return "Yesterday";
    } else {
      // Older than 2 days
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  };

  // Sort pinned chats to top
  const sortedChats = useMemo(() => {
    return [...filteredChats].sort((a, b) => {
      const aPinned = pinnedChats.includes(a.incident_id);
      const bPinned = pinnedChats.includes(b.incident_id);

      // First sort by pinned status
      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }

      // Then sort by last message time (most recent first)
      const aLastMessageTime = getLastMessageTime(a);
      const bLastMessageTime = getLastMessageTime(b);

      if (!aLastMessageTime && !bLastMessageTime) return 0;
      if (!aLastMessageTime) return 1;
      if (!bLastMessageTime) return -1;

      // For demonstration, we'll sort alphabetically since we can't compare the formatted strings
      // In a real app, you'd store the actual timestamp for sorting
      return 0;
    });
  }, [filteredChats, pinnedChats, messages]);

  // Check if a user is online
  const isUserOnline = (username: string) => {
    return onlineUsers.includes(username);
  };

  // Fetch all users and groups on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users
        const usersResponse = await fetch("http://localhost:5000/api/users");
        const usersData = await usersResponse.json();
        setAllUsers(usersData);

        // Fetch user's groups if logged in
        if (currentUser) {
          const userGroups = await getUserGroups(currentUser.username);
          setGroups(userGroups);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [currentUser, getUserGroups]);

  const handleGroupCreated = (newGroup: any) => {
    setGroups((prev) => [...prev, newGroup]);
  };

  return (
    <div className="w-80 border-r flex flex-col">
      {/* Header with Create Group button */}
      <div className="p-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">Chats</h2>
        <h2 className="font-semibold text-lg">{currentUser?.name}</h2>
        {/* Display User here */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowCreateGroupModal(true)}
          title="Create Group"
        >
          <IoAdd size={20} />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b h-20 flex items-center">
        <Input
          type="text"
          variant="default"
          placeholder="Search users..."
          iconLeft={"Search"}
          width="300px"
          height="40px"
          iconHeight={22}
          iconWidth={22}
          value={searchQuery}
          onChange={(e: any) => setSearchQuery(e.target.value)}
        />
        {/* <div className="flex gap-4 p-4">
          <Icon name="Search" width={32} height={32} color="red" />
          {/* <Icon name="User" width={40} height={40} color="blue" /> */}
        {/* </div> */}
      </div>

      {/* Online Users Count */}
      <div className="p-3 border-b bg-gray-50">
        <p className="text-sm text-gray-600">
          {onlineUsers.length} user{onlineUsers.length !== 1 ? "s" : ""} online
        </p>
      </div>

      {/* Chats */}
      <div className="flex flex-col overflow-y-auto">
        {sortedChats.length > 0 ? (
          sortedChats.map((chat, idx) => {
            const isSelected =
              selectedChat &&
              selectedChat.incident_id === chat.incident_id &&
              selectedChat.type === chat.type;

            const chatName =
              chat.type === "single"
                ? chat.responder_name
                : chat.incident_name || "Group Chat";

            const chatMembers =
              chat.type === "group"
                ? chat.responder.length > 2
                  ? `${chat.responder
                      .slice(0, 2)
                      .map((r: any) => r.responder_name)
                      .join(", ")}...`
                  : chat.responder.map((r: any) => r.responder_name).join(", ")
                : chat.email;

            const isPinned = pinnedChats.includes(chat.incident_id);
            const isMuted = muteChats.includes(chat.incident_id);
            const lastMessageTime = getLastMessageTime(chat);
            const isOnline =
              chat.type === "single" && isUserOnline(chat.username);

            return (
              <div
                key={idx}
                onClick={() => onSelectChat(chat)}
                className={`p-3 cursor-pointer flex justify-between items-center border-b ${
                  isSelected ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex justify-center items-center bg-[#F4F4F5] mr-2 relative">
                      <img src={userIcon} alt="" height="20" width="20" />
                      <div
                        className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}  absolute bottom-0 right-0 border border-white`}
                      ></div>
                    </div>
                    <div className="flex flex-col items-start">
                      <p className="font-medium">{chatName}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {chatMembers}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start flex-col gap-2">
                    {lastMessageTime && (
                      <span className="text-xs text-right w-full text-gray-400 whitespace-nowrap">
                        {lastMessageTime}
                      </span>
                    )}
                    {isPinned && (
                      // <MdOutlinePushPin
                      //   size={18}
                      //   className="text-blue-500"
                      //   title="Pinned"
                      // />
                      <Icon name="pin" width={18} height={18} color="red" />
                    )}
                    {isMuted && (
                      <Icon name="unmute" width={18} height={18} color="red" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-gray-500">
            No users found{" "}
            {searchQuery ? `matching "${searchQuery}"` : "to chat with"}
          </div>
        )}
      </div>

      {/* Add the CreateGroupModal component here */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        users={allUsers}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
};

export default ChatSidebar;
