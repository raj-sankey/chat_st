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

          {/* Mic Button - Push to Talk */}
          {!hasPreview && (
            // <Button
            //   variant="ghost"
            //   size="icon"
            //   onMouseDown={startVoiceRecording}
            //   onMouseUp={stopVoiceRecording}
            //   onTouchStart={startVoiceRecording}
            //   onTouchEnd={stopVoiceRecording}
            //   className={`w-12 h-12 rounded-full ${
            //     status === "recording"
            //       ? "bg-red-100 text-red-600 animate-pulse"
            //       : "bg-white border-2 border-[#E4E4E7] hover:bg-gray-50"
            //   }`}
            // >
            //   <IoMicOutline size={24} />
            // </Button>
            <div
              onMouseDown={startVoiceRecording}
              onMouseUp={stopVoiceRecording}
              onTouchStart={startVoiceRecording}
              onTouchEnd={stopVoiceRecording}
              className="absolute top-[-18px] right-[20px] flex items-center justify-center w-18 h-18 bg-white border-2 border-[#E4E4E7] rounded-full shadow-md hover:shadow-lg transition duration-300"
            >
              <IoMicOutline className="text-black" size={38} />
            </div>
          )}

          {/* Video Button */}
          {!hasPreview && (
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 bg-white border-2 border-[#E4E4E7] rounded-full hover:bg-gray-50"
            >
              <IoVideocamOutline size={24} />
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default ChatInput;
