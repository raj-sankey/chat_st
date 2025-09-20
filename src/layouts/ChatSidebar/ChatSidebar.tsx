import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { IoSearchOutline } from "react-icons/io5";
import userIcon from "../../assets/img/default_users.png";
import { MdOutlinePushPin } from "react-icons/md";

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
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  onSelectChat,
  selectedChat,
  pinnedChats,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;

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
  }, [chats, searchQuery]);

  // Sort pinned chats to top
  const sortedChats = useMemo(() => {
    return [...filteredChats].sort((a, b) => {
      const aPinned = pinnedChats.includes(a.incident_id);
      const bPinned = pinnedChats.includes(b.incident_id);
      return aPinned === bPinned ? 0 : aPinned ? -1 : 1;
    });
  }, [filteredChats, pinnedChats]);

  return (
    <div className="w-80 border-r flex flex-col">
      {/* Search */}
      <div className="p-3 border-b h-20 flex items-center">
        <Input
          type="text"
          variant="default"
          placeholder="Search..."
          iconLeft={<IoSearchOutline />}
          width="300px"
          height="40px"
          value={searchQuery}
          onChange={(e: any) => setSearchQuery(e.target.value)}
        />
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
                      .map((r) => r.responder_name)
                      .join(", ")}...`
                  : chat.responder.map((r) => r.responder_name).join(", ")
                : chat.email;

            const isPinned = pinnedChats.includes(chat.incident_id);

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
                    <div className="w-8 h-8 rounded-full flex justify-center items-center bg-[#F4F4F5] mr-2">
                      <img src={userIcon} alt="" height="20" width="20" />
                      <div className="w-2 h-2 rounded-full bg-green-500 relative bottom-[-9px] right-[-3px]"></div>
                    </div>
                    <div className="flex flex-col items-start">
                      <p className="font-medium">{chatName}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {chatMembers}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start flex-col gap-2">
                    <span className="text-xs text-right w-full">18:00</span>
                    {isPinned && (
                      <MdOutlinePushPin
                        size={18}
                        className="text-blue-500"
                        title="Pinned"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-gray-500">
            No chats found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
