import React, { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { IoClose, IoSend } from "react-icons/io5";
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
  const { sendTypingIndicator } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [msg, setMsg] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMicHeld, setIsMicHeld] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const micButtonRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);

  // Add a ref to track if recording was canceled
  const wasCanceledRef = useRef(false);

  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
    useReactMediaRecorder({
      audio: true,
      onStop: (blobUrl, blob) => {
        // Use the ref to check if recording was canceled
        if (!wasCanceledRef.current && blob.size > 0) {
          const audioFile = new File(
            [blob],
            `voice-message-${Date.now()}.webm`,
            {
              type: blob.type,
            }
          );
          onFileSelect(blobUrl, "audio", audioFile);
        }
        // Reset the canceled flag for next recording
        wasCanceledRef.current = false;
      },
    });

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaBlobUrl) {
        clearBlobUrl();
      }
    };
  }, []);

  const sendMessage = () => {
    if (msg.trim() || hasPreview) {
      onSend(msg);
      setMsg("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsg(e.target.value);
    if (e.target.value.trim()) {
      sendTypingIndicator();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {}, 1000);
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
    e.target.value = "";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startVoiceRecording = () => {
    setIsMicHeld(true);
    setIsRecording(true);
    setRecordingTime(0);
    recordingStartTimeRef.current = Date.now();
    wasCanceledRef.current = false; // Reset canceled flag when starting new recording
    startRecording();

    const updateTimer = () => {
      if (isRecording) {
        const elapsed = Math.floor(
          (Date.now() - recordingStartTimeRef.current) / 1000
        );
        setRecordingTime(elapsed);
        requestAnimationFrame(updateTimer);
      }
    };

    requestAnimationFrame(updateTimer);

    recordingTimerRef.current = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - recordingStartTimeRef.current) / 1000
      );
      setRecordingTime(elapsed);
    }, 100);
  };

  const stopVoiceRecording = () => {
    // Set states first
    setIsMicHeld(false);
    setIsRecording(false);
    setIsLocked(false);
    setDragDistance(0);

    // Stop recording - this will trigger onStop callback
    stopRecording();

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingTime(0);
  };

  const cancelRecording = () => {
    // Mark as canceled before stopping
    wasCanceledRef.current = true;

    // Set states
    setIsMicHeld(false);
    setIsRecording(false);
    setIsLocked(false);
    setDragDistance(0);

    // Stop the recording
    if (status === "recording") {
      stopRecording();
    }

    // Clear the blob URL
    clearBlobUrl();

    // Clear timers
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingTime(0);
  };

  const lockRecording = () => {
    setIsLocked(true);
    setIsMicHeld(false);
  };

  // Handle mouse events for drag to lock
  const handleMicMouseDown = (e: React.MouseEvent) => {
    dragStartY.current = e.clientY;
    startVoiceRecording();
  };

  const handleMicMouseUp = () => {
    if (!isLocked && isRecording) {
      stopVoiceRecording();
    }
  };

  const handleMicMouseMove = (e: React.MouseEvent) => {
    if (isRecording && !isLocked) {
      const currentY = e.clientY;
      const distance = dragStartY.current - currentY;
      setDragDistance(Math.max(0, distance));
      if (distance >= 50) {
        lockRecording();
      }
    }
  };

  const handleMicMouseLeave = () => {
    if (!isLocked && isRecording) {
      stopVoiceRecording();
    }
  };

  // Handle touch events for drag to lock
  const handleMicTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    dragStartY.current = e.touches[0].clientY;
    startVoiceRecording();
  };

  const handleMicTouchMove = (e: React.TouchEvent) => {
    if (isRecording && !isLocked) {
      const currentY = e.touches[0].clientY;
      const distance = dragStartY.current - currentY;
      setDragDistance(Math.max(0, distance));
      if (distance >= 50) {
        lockRecording();
      }
    }
  };

  const handleMicTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isLocked && isRecording) {
      stopVoiceRecording();
    }
  };

  // Optimized formatTime function
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-3 border-t flex items-center gap-2 bg-white relative">
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

      <>
        {isRecording ? (
          <div className="flex items-center justify-between w-3/4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-600 font-medium">
                {isLocked ? "Recording (Locked)..." : "Recording..."}
              </span>
              <span className="text-red-600 font-mono text-lg">
                {formatTime(recordingTime)}
              </span>
            </div>

            {isLocked && (
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
            )}
          </div>
        ) : (
          <Input
            type="text"
            variant="default"
            placeholder={
              hasPreview
                ? `Add a caption to your ${previewFileType}...`
                : "Type a message..."
            }
            iconLeft={!hasPreview ? "paperclip" : undefined}
            iconRight={"send"}
            onIconClickRight={sendMessage}
            onIconClickLeft={() => fileInputRef.current?.click()}
            iconHeight={22}
            iconWidth={22}
            height="50px"
            width="460px"
            value={msg}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
        )}

        {!hasPreview && (
          <div
            ref={micButtonRef}
            onMouseDown={handleMicMouseDown}
            onMouseUp={handleMicMouseUp}
            onMouseMove={handleMicMouseMove}
            onMouseLeave={handleMicMouseLeave}
            onTouchStart={handleMicTouchStart}
            onTouchMove={handleMicTouchMove}
            onTouchEnd={handleMicTouchEnd}
            className={`absolute cursor-pointer top-[-18px] right-[20px] flex items-center justify-center w-18 h-18 border-2 rounded-full shadow-md hover:shadow-lg transition duration-300 ${
              isLocked
                ? "bg-green-500 border-green-600"
                : isMicHeld
                  ? "bg-[#0EA5E9] border-[#0EA5E9]"
                  : "bg-white border-[#E4E4E7] hover:bg-gray-50"
            }`}
            style={{
              transform: isRecording
                ? `translateY(-${Math.min(30, dragDistance / 3)}px)`
                : "none",
              transition: "transform 0.2s ease, background-color 0.2s ease",
            }}
          >
            <Icon
              name="Mic"
              width={24}
              height={24}
              color={isLocked || isMicHeld ? "white" : "black"}
            />
          </div>
        )}

        {!hasPreview && (
          <div className="flex justify-center items-center w-12 h-12 bg-white border-2 border-[#E4E4E7] rounded-full hover:bg-gray-50">
            <Icon name="video" width={24} height={24} color="black" />
          </div>
        )}
      </>
    </div>
  );
};

export default ChatInput;
