import React from "react";
import userIcon from "../../assets/img/default_users.png";
import { useSocket } from "@/contexts/SocketContext";

interface ChatMessageProps {
  id?: string;
  sender: string;
  text: string;
  time: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  isHighlighted?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  sender,
  text,
  time,
  type,
  fileUrl,
  fileName,
  isHighlighted = false,
}) => {
  const { currentUser } = useSocket();
  const isMe = sender === currentUser?.username || sender === "Me";

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "video":
        return "🎬";
      case "audio":
        return "🎵";
      default:
        return "📄";
    }
  };

  return (
    <div
      id={id}
      className={`flex mb-3 ${isMe ? "justify-end" : "justify-start"} ${isHighlighted ? "bg-yellow-100 rounded-lg p-1" : ""}`}
    >
      {!isMe && (
        <div className="w-8 h-8 rounded-full flex justify-center items-center bg-[#F4F4F5] mr-2 flex-shrink-0">
          <img src={userIcon} alt="" height={"20px"} width={"20px"} />
          <div className="w-2 h-2 rounded-full bg-green-500 absolute bottom-0 right-0 border border-white"></div>
        </div>
      )}

      <div
        className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-xs`}
      >
        {/* Sender name for received messages */}
        {/* {!isMe && <p className="text-xs text-gray-500 mb-1 ml-1">{sender}</p>} */}

        {/* Message bubble */}
        <div
          className={`p-3 rounded-lg ${
            isMe
              ? "bg-[#0369A1] text-white rounded-tr-none"
              : "bg-[#F4F4F5] text-gray-800 rounded-tl-none"
          }`}
        >
          {/* Render message depending on type */}
          {type === "text" && (
            <>
              {!isMe && (
                <p className="font-semibold text-sm text-left">{sender}</p>
              )}
              <p className="text-left">{text}</p>
            </>
          )}

          {type === "image" && fileUrl && (
            <div className="flex flex-col">
              <img
                src={fileUrl}
                alt="sent-img"
                className="rounded-lg max-h-48 object-cover mt-1"
              />
              {text && <p className="mt-2 text-sm text-left">{text}</p>}
            </div>
          )}

          {type === "video" && fileUrl && (
            <div className="rounded-lg">
              <div className=" rounded-lg flex flex-col bg-white">
                <video
                  controls
                  src={fileUrl}
                  className="rounded-t-lg max-h-48"
                />
                {fileName && (
                  <p className="text-sm mt-1 bg-white text-left p-2 text-black">
                    {fileName}
                  </p>
                )}
              </div>
              {text && (
                <p className="mt-2 text-sm text-left rounded-b-lg">{text}</p>
              )}
            </div>
          )}

          {type === "audio" && fileUrl && (
            <div className="w-full flex flex-col">
              <div className="flex items-center gap-2 p-2 bg-white bg-opacity-20 rounded-t">
                <audio controls src={fileUrl} className="flex-1" />
              </div>
              {text ? (
                <p className="mt-2 text-sm text-left text-gray-300">{text}</p>
              ) : (
                <p className="text-sm text-left p-2 bg-white rounded-b text-gray-300">
                  {fileName}
                </p>
              )}
              {/* {fileName && <p className="text-sm text-left p-1">{fileName}</p>}
              {text && <p className="mt-2 text-sm text-left">{text}</p>} */}
            </div>
          )}

          {type === "file" && fileUrl && (
            <div className="flex flex-col">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-white bg-opacity-20 rounded mt-1"
              >
                <span className="text-xl">{getFileIcon(type)}</span>
                <span className="text-sm underline">{fileName}</span>
              </a>
              {text && <p className="mt-2 text-sm text-left">{text}</p>}
            </div>
          )}
          {/* Time */}
          {/* Time inside bubble */}
          <p
            className={`text-xs mt-1 flex justify-end w-full ${isMe ? "text-blue-100" : "text-gray-500"}`}
          >
            {time}
          </p>
        </div>
      </div>

      {/* {isMe && (
        <div className="w-8 h-8 rounded-full flex justify-center items-center bg-[#0369A1] ml-2 flex-shrink-0">
          <img
            src={userIcon}
            alt=""
            height={"20px"}
            width={"20px"}
            className="invert"
          />
        </div>
      )} */}
    </div>
  );
};

export default ChatMessage;
