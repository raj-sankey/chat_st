import React, { useState, useRef, useEffect } from "react";
import {
  IoChevronBack,
  IoSearch,
  IoEllipsisVertical,
  IoClose,
} from "react-icons/io5";
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
    }[]
  >([{ sender: "Sasha Coen", text: "Hello!", time: "2:59 pm", type: "text" }]);

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

  // Ref for the messages container
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const isPinned =
    selectedChat && pinnedChats.includes(selectedChat.incident_id);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom on initial render and when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Also scroll to bottom when chat changes
  useEffect(() => {
    if (selectedChat) {
      // Small timeout to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [selectedChat]);

  // In your ChatWindow component, update the handleSend function:
  const handleSend = (
    msg: string,
    type = "text",
    fileUrl?: string,
    fileName?: string
  ) => {
    // For audio messages, use the file name as text if no caption is provided
    const messageText =
      type === "audio" && !msg.trim()
        ? `Voice message: ${fileName || "Audio"}`
        : msg;

    setMessages((prev) => [
      ...prev,
      {
        sender: "Me",
        text: messageText,
        time: "now",
        type,
        fileUrl,
        fileName,
      },
    ]);

    // Clear the preview after sending
    setPreviewFile(null);
  };

  const handleFileSelect = (fileUrl: string, type: string, file: File) => {
    // Show preview for all file types
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

    // Scroll to the searched message
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

  // Chat Header Info
  const title =
    selectedChat.type === "single"
      ? selectedChat.responder_name
      : selectedChat.incident_name;

  const subtitle =
    selectedChat.type === "single"
      ? selectedChat.email
      : selectedChat.responder.map((r: any) => r.responder_name).join(", ");

  return (
    <div className="flex flex-col flex-1 relative">
      {/* Header */}
      <div className="p-5 h-20 border-b flex items-center justify-between bg-transparent">
        <div className="flex justify-between items-center gap-5">
          <IoChevronBack
            size={24}
            onClick={() => setView("chat")} // back resets to chat
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

        {/* Hide buttons in Profile view */}
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

      {/* Body with File Preview Overlay */}
      <div
        className={`flex-1 relative ${
          previewFile ? "overflow-hidden" : "overflow-y-auto"
        } p-4 bg-white`}
        ref={messagesContainerRef}
      >
        {previewFile && (
          <div className="absolute inset-0 bg-[#F8FAFC] z-10 flex flex-col overflow-y-auto">
            {/* Preview Header */}
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

            {/* Preview Content */}
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
        )}

        {/* Chat Messages */}
        {!previewFile && view === "chat" && (
          <>
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                id={`message-${i}`}
                sender={msg.sender}
                text={msg.text}
                time={msg.time}
                type={msg.type}
                fileUrl={msg.fileUrl}
                fileName={msg.fileName}
                isHighlighted={
                  searchResults.includes(i) &&
                  currentResultIndex === searchResults.indexOf(i)
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </>
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
