import React, { useState, useRef, useEffect } from "react";
import {
  IoChevronBack,
  IoSearch,
  IoEllipsisVertical,
  IoClose,
} from "react-icons/io5";
import { CiChat1 } from "react-icons/ci";
import ChatMessage from "../ChatMessage/ChatMessage";
import ChatInput from "../ChatInput/ChatInput";
import userIcon from "../../assets/img/default_users.png";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CgProfile } from "react-icons/cg";
import { MdOutlinePushPin } from "react-icons/md";
import { IoIosVolumeMute } from "react-icons/io";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LuPinOff } from "react-icons/lu";

interface ChatWindowProps {
  selectedChat: any | null;
  onTogglePin: (chatId: string) => void;
  pinnedChats: string[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedChat,
  onTogglePin,
  pinnedChats,
}) => {
  const [messages, setMessages] = useState<
    {
      sender: string;
      text: string;
      time: string;
      type: string;
      fileUrl?: string;
      fileName?: string;
      date: string;
    }[]
  >([
    {
      sender: "Sasha Coen",
      text: "Hello!",
      time: "2:59 pm",
      type: "text",
      date: new Date().toISOString(),
    },
  ]);

  const [view, setView] = useState<"chat" | "profile">("chat");
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    type: string;
    file: File;
  } | null>(null);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const isPinned =
    selectedChat && pinnedChats.includes(selectedChat.incident_id);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior });
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, []);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages]);

  useEffect(() => {
    if (view === "chat") {
      requestAnimationFrame(() => scrollToBottom("auto"));
      setTimeout(() => scrollToBottom("auto"), 50);
    }
  }, [view]);

  useEffect(() => {
    if (!previewFile) {
      requestAnimationFrame(() => scrollToBottom("auto"));
      setTimeout(() => scrollToBottom("auto"), 50);
    }
  }, [previewFile]);

  const handleSend = (
    msg: string,
    type = "text",
    fileUrl?: string,
    fileName?: string
  ) => {
    const messageText =
      type === "audio" && !msg.trim()
        ? `Voice message: ${fileName || "Audio"}`
        : msg;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((prev) => [
      ...prev,
      {
        sender: "Me",
        text: messageText,
        time: formattedTime,
        type,
        fileUrl,
        fileName,
        date: now.toISOString(),
      },
    ]);

    setPreviewFile(null);
  };

  const handleFileSelect = (fileUrl: string, type: string, file: File) => {
    setPreviewFile({ url: fileUrl, type, file });
  };

  const cancelPreview = () => {
    setPreviewFile(null);
  };

  const handleSendWithFile = (text: string) => {
    if (previewFile) {
      handleSend(
        text,
        previewFile.type,
        previewFile.url,
        previewFile.file.name
      );
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }

    const results = messages
      .map((msg, index) =>
        msg.text.toLowerCase().includes(query.toLowerCase()) ? index : -1
      )
      .filter((index) => index !== -1);

    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);
  };

  const navigateSearchResults = (direction: "next" | "prev") => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === "next") {
      newIndex = (currentResultIndex + 1) % searchResults.length;
    } else {
      newIndex =
        (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    }

    setCurrentResultIndex(newIndex);

    const messageElement = document.getElementById(
      `message-${searchResults[newIndex]}`
    );
    messageElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    messageElement?.classList.add("bg-yellow-100");
    setTimeout(() => {
      messageElement?.classList.remove("bg-yellow-100");
    }, 1000);
  };

  const exitSearchMode = () => {
    setSearchMode(false);
    setSearchQuery("");
    setSearchResults([]);
    setCurrentResultIndex(-1);
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Select a chat to start messaging
      </div>
    );
  }

  const title =
    selectedChat.type === "single"
      ? selectedChat.responder_name
      : selectedChat.incident_name;

  const subtitle =
    selectedChat.type === "single"
      ? selectedChat.email
      : selectedChat.responder.map((r: any) => r.responder_name).join(", ");

  // Date formatting and grouping
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const groupMessagesByDate = (messages: any[]) => {
    return messages.reduce((groups: any, msg, index) => {
      const dateKey = formatDate(msg.date);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push({ ...msg, index });
      return groups;
    }, {});
  };

  const sortDateKeys = (keys: string[]) => {
    return keys.sort((a, b) => {
      const parseDate = (label: string) => {
        if (label === "Today") return new Date();
        if (label === "Yesterday") {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          return d;
        }
        return new Date(label);
      };
      return parseDate(a).getTime() - parseDate(b).getTime();
    });
  };

  const groupedMessages = groupMessagesByDate(messages);
  console.log("grouped message", groupedMessages);
  const sortedDateKeys = sortDateKeys(Object.keys(groupedMessages));

  return (
    <div className="flex flex-col flex-1 relative">
      {/* Header */}
      <div className="p-5 h-20 border-b flex items-center justify-between bg-transparent">
        <div className="flex justify-between items-center gap-5">
          <IoChevronBack
            size={24}
            onClick={() => setView("chat")}
            className="cursor-pointer"
          />
          <div className="flex items-center">
            {view === "chat" && (
              <div className="w-8 h-8 rounded-full flex justify-center items-center bg-[#F4F4F5] mr-2">
                <img src={userIcon} alt="" height={"20px"} width={"20px"} />
              </div>
            )}
            <div className="flex flex-col items-start">
              <h2 className="font-semibold text-black">
                {view === "chat" ? title : "View Profile"}
              </h2>
              {view === "chat" && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {view === "chat" && (
          <div className="flex gap-5">
            {searchMode ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e: any) => handleSearch(e.target.value)}
                  className="w-40 h-8"
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <button
                      onClick={() => navigateSearchResults("prev")}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      ↑
                    </button>
                    <span>
                      {currentResultIndex + 1}/{searchResults.length}
                    </span>
                    <button
                      onClick={() => navigateSearchResults("next")}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      ↓
                    </button>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={exitSearchMode}
                  className="h-12 w-12"
                >
                  <IoClose size={16} />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchMode(true)}
                className="h-12 w-12"
              >
                <IoSearch size={16} />
              </Button>
            )}

            <Popover>
              <PopoverTrigger className="bg-transparent h-12 w-12">
                <IoEllipsisVertical size={16} />
              </PopoverTrigger>
              <PopoverContent>
                <div className="flex flex-col gap-4">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setView("profile")}
                  >
                    <CgProfile size={20} />
                    <span className="text-lg">View Profile</span>
                  </div>
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => onTogglePin(selectedChat.incident_id)}
                  >
                    {isPinned ? (
                      <LuPinOff size={20} />
                    ) : (
                      <MdOutlinePushPin size={20} />
                    )}

                    <span className="text-lg">
                      {isPinned ? "Unpin Chat" : "Pin Chat"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <IoIosVolumeMute size={20} />
                    <span className="text-lg">Unmute Chat</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Body */}
      <div
        className={`flex-1 relative ${
          previewFile ? "overflow-hidden" : "overflow-y-auto"
        } p-4 bg-white messages-scrollbar`}
        ref={messagesContainerRef}
      >
        {previewFile ? (
          <div className="absolute inset-0 bg-[#F8FAFC] z-10 flex flex-col overflow-y-auto">
            {/* File preview */}
            <div className="p-4 flex justify-between items-center border-b bg-white">
              <Button
                variant="ghost"
                size="icon"
                onClick={cancelPreview}
                className="hover:bg-gray-200"
              >
                <IoClose size={24} />
              </Button>
              <h3 className="font-semibold">File Preview</h3>
              <div className="w-10"></div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              {previewFile.type === "image" ? (
                <img
                  src={previewFile.url}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : previewFile.type === "video" ? (
                <div className="w-full max-w-md">
                  <video
                    controls
                    src={previewFile.url}
                    className="w-full rounded-lg"
                  />
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    {previewFile.file.name}
                  </p>
                </div>
              ) : previewFile.type === "audio" ? (
                <div className="w-full max-w-md">
                  <audio
                    controls
                    src={previewFile.url}
                    className="w-full mt-4"
                  />
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    {previewFile.file.name}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-white">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-lg font-medium text-center">
                    {previewFile.file.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {(previewFile.file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : view === "chat" ? (
          <>
            {messages.length === 0 ? (
              // Empty state fallback
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <CiChat1 size={130} />
                <h2 className="text-xl font-semibold text-gray-700">
                  No chat messages
                </h2>
                <p className="text-sm text-gray-500 mt-2 max-w-xs">
                  Description text for empty state to inform user what they can
                  do
                </p>
              </div>
            ) : (
              // Messages rendering
              <>
                {sortedDateKeys.map((dateKey, idx) => (
                  <div key={idx}>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-4">
                      <span className="bg-gray-200 text-gray-600 px-4 py-1 rounded-full text-sm">
                        {dateKey}
                      </span>
                    </div>

                    {/* Messages */}
                    {groupedMessages[dateKey].map((msg: any) => (
                      <ChatMessage
                        key={`msg-${msg.index}`}
                        id={`message-${msg.index}`}
                        sender={msg.sender}
                        text={msg.text}
                        time={msg.time}
                        type={msg.type}
                        fileUrl={msg.fileUrl}
                        fileName={msg.fileName}
                        isHighlighted={
                          searchResults.includes(msg.index) &&
                          currentResultIndex ===
                            searchResults.indexOf(msg.index)
                        }
                      />
                    ))}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </>
        ) : (
          // Profile view
          <div className="flex flex-col items-center gap-2">
            <img
              src={selectedChat.incident_img_url || userIcon}
              alt="Profile"
              className="w-24 h-24 rounded-full border"
            />
            <h2 className="text-xl font-bold text-gray-800">
              {selectedChat.type === "single"
                ? selectedChat.responder_name
                : selectedChat.incident_name}
            </h2>
            {selectedChat.type === "group" && (
              <p className="text-gray-500">
                {selectedChat.responder.length} members
              </p>
            )}
            {selectedChat.type === "group" ? (
              <div className="w-full mt-4">
                {selectedChat.responder.map((member: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <img
                      src={member.responder_img_url || userIcon}
                      alt={member.responder_name}
                      className="w-10 h-10 rounded-full border"
                    />
                    <div className="flex flex-col items-start">
                      <p className="font-medium text-gray-800">
                        {member.responder_name}
                      </p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full mt-6 px-6 flex flex-col gap-4">
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-black">Username</span>
                  <span className="text-gray-500">{selectedChat.username}</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-black">Email</span>
                  <span className="text-gray-500">{selectedChat.email}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {view === "chat" && (
        <ChatInput
          onSend={previewFile ? handleSendWithFile : handleSend}
          onFileSelect={handleFileSelect}
          hasPreview={!!previewFile}
          onCancelPreview={cancelPreview}
          previewFileType={previewFile?.type}
        />
      )}
    </div>
  );
};

export default ChatWindow;
