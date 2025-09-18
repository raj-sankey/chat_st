import React from "react";
import userIcon from "../../assets/img/default_users.png";

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
  const isMe = sender === "Me";

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
      className={`flex mb-3 ${isMe ? "justify-end" : "justify-start"} ${isHighlighted ? "bg-yellow-100 rounded-lg" : ""}`}
    >
      {!isMe && (
        <>
          <div className="w-8 h-8 rounded-full flex justify-center items-center bg-[#F4F4F5] mr-2">
            <img src={userIcon} alt="" height={"20px"} width={"20px"} />
            <div className="w-2 h-2 rounded-full bg-red-500 relative bottom-[-9px] right-[-3px]"></div>
          </div>
        </>
      )}

      <div className="flex flex-col items-end">
        {/* File message */}
        <div
          className={`p-3 max-w-xs flex flex-col items-start ${
            isMe
              ? "bg-[#0369A1] rounded-t-lg rounded-bl-lg text-white"
              : "bg-[#F4F4F5] rounded-b-lg rounded-tr-lg"
          }`}
        >
          {!isMe && type !== "text" && (
            <p className="font-semibold text-sm">{sender}</p>
          )}

          {/* Render message depending on type */}
          {type === "text" && (
            <>
              {!isMe && <p className="font-semibold text-sm">{sender}</p>}
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
              {fileName && (
                <p className="text-sm text-left p-2 bg-white rounded-b text-gray-300">
                  {fileName}
                </p>
              )}
              {text && (
                <p className="mt-2 text-sm text-left text-gray-300">{text}</p>
              )}
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
          <p className="text-xs text-white mt-1 flex justify-end w-full">
            {time}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
