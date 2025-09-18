import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { RiTelegram2Line } from "react-icons/ri";
import { GrAttachment } from "react-icons/gr";
import { IoMicOutline, IoVideocamOutline, IoClose } from "react-icons/io5";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (
    msg: string,
    type?: string,
    fileUrl?: string,
    fileName?: string
  ) => void;
  onFileSelect: (fileUrl: string, type: string, file: File) => void;
  hasPreview?: boolean;
  onCancelPreview?: () => void;
  previewFileType?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onFileSelect,
  hasPreview = false,
  onCancelPreview,
  previewFileType,
}) => {
  const [msg, setMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = () => {
    if (msg.trim() || hasPreview) {
      onSend(msg);
      setMsg("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    let type = "file";

    if (file.type.startsWith("image/")) type = "image";
    else if (file.type.startsWith("video/")) type = "video";
    else if (file.type.startsWith("audio/")) type = "audio";

    onFileSelect(fileUrl, type, file);
    e.target.value = ""; // reset
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="p-3 border-t flex items-center gap-2 bg-white relative">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />

      {hasPreview && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancelPreview}
          className="hover:bg-gray-200"
        >
          <IoClose size={24} />
        </Button>
      )}

      <Input
        type="text"
        variant="chat"
        placeholder={
          hasPreview
            ? `Add a caption to your ${previewFileType}...`
            : "Type a message..."
        }
        iconLeft={
          !hasPreview ? (
            <GrAttachment
              size={24}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer"
            />
          ) : undefined
        }
        iconRight={<RiTelegram2Line size={24} />}
        onIconClickRight={sendMessage}
        height="40px"
        width="460px"
        value={msg}
        onChange={(e: any) => setMsg(e.target.value)}
        onKeyPress={handleKeyPress}
      />

      {/* Video Button */}
      {!hasPreview && (
        <div className="flex items-center justify-center w-12 h-12 bg-white border-2 border-[#E4E4E7] rounded-full shadow-md hover:shadow-lg transition duration-300">
          <IoVideocamOutline className="text-black" size={24} />
        </div>
      )}

      {/* Mic Button */}
      {!hasPreview && (
        <div className="absolute top-[-18px] right-[20px] flex items-center justify-center w-18 h-18 bg-white border-2 border-[#E4E4E7] rounded-full shadow-md hover:shadow-lg transition duration-300">
          <IoMicOutline className="text-black" size={38} />
        </div>
      )}
    </div>
  );
};

export default ChatInput;
