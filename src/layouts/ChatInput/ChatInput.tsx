import React, { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { RiTelegram2Line } from "react-icons/ri";
import { GrAttachment } from "react-icons/gr";
import {
  IoMicOutline,
  IoVideocamOutline,
  IoClose,
  IoSend,
} from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { useReactMediaRecorder } from "react-media-recorder";
import { useSocket } from "@/contexts/SocketContext";
import Icon from "@/components/Icons/Icon";

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
  const { sendTypingIndicator, currentUser } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [msg, setMsg] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
    useReactMediaRecorder({
      audio: true,
      onStop: (blobUrl, blob) => {
        // Create a file from the blob
        const audioFile = new File([blob], `voice-message-${Date.now()}.webm`, {
          type: blob.type,
        });

        // Send the audio file
        onFileSelect(blobUrl, "audio", audioFile);
      },
    });

  const sendMessage = () => {
    if (msg.trim() || hasPreview) {
      onSend(msg);
      setMsg("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsg(e.target.value);

    // Send typing indicator
    if (e.target.value.trim()) {
      sendTypingIndicator(); // You might want to pass the recipient here

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        // You might want to implement a "stop typing" event
      }, 1000);
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

  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    startRecording();

    // Start timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);
    stopRecording();

    // Clear timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setRecordingTime(0);
  };

  const cancelRecording = () => {
    setIsRecording(false);
    if (status === "recording") {
      stopRecording();
    }
    clearBlobUrl();

    // Clear timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setRecordingTime(0);
  };

  // Format recording time (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

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

      {isRecording ? (
        // Recording UI
        <div className="flex items-center justify-between w-full bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-600 font-medium">Recording...</span>
            <span className="text-red-600">{formatTime(recordingTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelRecording}
              className="text-gray-500 hover:text-gray-700"
            >
              <IoClose size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={stopVoiceRecording}
              className="text-green-600 hover:text-green-800"
            >
              <IoSend size={20} />
            </Button>
          </div>
        </div>
      ) : (
        // Regular Input UI
        <>
          <Input
            type="text"
            variant="default "
            placeholder={
              hasPreview
                ? `Add a caption to your ${previewFileType}...`
                : "Type a message..."
            }
            iconLeft={!hasPreview ? "paperclip" : undefined}
            iconRight={"send"}
            onIconClickRight={sendMessage}
            iconHeight={22}
            iconWidth={22}
            height="50px"
            width="460px"
            value={msg}
            // onChange={(e: any) => setMsg(e.target.value)}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />

          {/* Mic Button - Push to Talk */}
          {!hasPreview && (
            <div
              onMouseDown={startVoiceRecording}
              onMouseUp={stopVoiceRecording}
              onTouchStart={startVoiceRecording}
              onTouchEnd={stopVoiceRecording}
              className="absolute cursor-pointer top-[-18px] right-[20px] flex items-center justify-center w-18 h-18 bg-white border-2 border-[#E4E4E7] rounded-full shadow-md hover:shadow-lg transition duration-300"
            >
              <Icon
                // onClick={() => setSearchMode(true)}
                name="Mic"
                width={24}
                height={24}
                color="black"
              />
            </div>
          )}

          {/* Video Button */}
          {!hasPreview && (
            // <Button
            //   variant="ghost"
            //   size="icon"
            //   className="w-12 h-12 bg-white border-2 border-[#E4E4E7] rounded-full hover:bg-gray-50"
            // >
            <div className="flex justify-center items-center w-12 h-12 bg-white border-2 border-[#E4E4E7] rounded-full hover:bg-gray-50">
              <Icon
                // onClick={() => setSearchMode(true)}
                name="video"
                width={24}
                height={24}
                color="black"
              />
            </div>
            // </Button>
          )}
        </>
      )}
    </div>
  );
};

export default ChatInput;
