import React, { useState } from "react";
import ChatSidebar from "../ChatSidebar/ChatSidebar";
import ChatWindow from "../ChatWindow/ChatWindow";

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

const ChatLayout: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]); // store incident_id of pinned

  const handleTogglePin = (chatId: string) => {
    setPinnedChats(
      (prev) =>
        prev.includes(chatId)
          ? prev.filter((id) => id !== chatId) // unpin
          : [...prev, chatId] // pin
    );
  };

  const chats: Chat[] = [
    {
      type: "single",
      incident_id: "1232231341",
      responder_name: "Raj Mhatre",
      responder_id: "2361851723",
      responder_img_url: "",
      username: "deflo",
      email: "raj@.com",
    },
    {
      type: "group",
      incident_id: "63178492134691",
      incident_name: "Accident",
      incident_img_url: "",
      responder: [
        {
          type: "single",
          incident_id: "1232231341",
          responder_name: "Raj Mhatre",
          responder_id: "2361851723",
          responder_img_url: "",
          username: "deflo",
          email: "raj@.com",
        },
        {
          type: "single",
          incident_id: "7258934",
          responder_name: "Mhatre",
          responder_id: "7427832838",
          responder_img_url: "",
          username: "abcc",
          email: "rashjj@.com",
        },
      ],
    },
    {
      type: "single",
      incident_id: "7561239841",
      responder_name: "Aditi Sharma",
      responder_id: "1537294832",
      responder_img_url: "",
      username: "aditi123",
      email: "aditi.sharma@.com",
    },
    {
      type: "group",
      incident_id: "8492731825",
      incident_name: "Fire Outbreak",
      incident_img_url: "",
      responder: [
        {
          type: "single",
          incident_id: "7561239841",
          responder_name: "Aditi Sharma",
          responder_id: "1537294832",
          responder_img_url: "",
          username: "aditi123",
          email: "aditi.sharma@.com",
        },
        {
          type: "single",
          incident_id: "8932341845",
          responder_name: "Vinay Kumar",
          responder_id: "1847391829",
          responder_img_url: "",
          username: "vinay.k",
          email: "vinay.kumar@.com",
        },
        {
          type: "single",
          incident_id: "8723419123",
          responder_name: "Anita Patel",
          responder_id: "7489123476",
          responder_img_url: "",
          username: "anitap",
          email: "anita.patel@.com",
        },
      ],
    },
    {
      type: "single",
      incident_id: "8743217329",
      responder_name: "Kunal Deshmukh",
      responder_id: "9234729283",
      responder_img_url: "",
      username: "kunal_d",
      email: "kunal.deshmukh@.com",
    },
    {
      type: "group",
      incident_id: "9572389375",
      incident_name: "Flooding",
      incident_img_url: "",
      responder: [
        {
          type: "single",
          incident_id: "8743217329",
          responder_name: "Kunal Deshmukh",
          responder_id: "9234729283",
          responder_img_url: "",
          username: "kunal_d",
          email: "kunal.deshmukh@.com",
        },
        {
          type: "single",
          incident_id: "1289834729",
          responder_name: "Shruti Verma",
          responder_id: "2398471923",
          responder_img_url: "",
          username: "shruti_v",
          email: "shruti.verma@.com",
        },
      ],
    },
    {
      type: "group",
      incident_id: "8620193749",
      incident_name: "Tornado",
      incident_img_url: "",
      responder: [
        {
          type: "single",
          incident_id: "8472039845",
          responder_name: "Ravi Singh",
          responder_id: "2847539201",
          responder_img_url: "",
          username: "ravi_s",
          email: "ravi.singh@.com",
        },
        {
          type: "single",
          incident_id: "9872348432",
          responder_name: "Neha Gupta",
          responder_id: "5637284920",
          responder_img_url: "",
          username: "neha.gupta",
          email: "neha.gupta@.com",
        },
      ],
    },
  ];

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white border-2 rounded-xl border-[#E4E4E7]">
      <ChatSidebar
        chats={chats}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
        pinnedChats={pinnedChats}
      />
      <ChatWindow
        selectedChat={selectedChat}
        onTogglePin={handleTogglePin}
        pinnedChats={pinnedChats}
      />
    </div>
  );
};

export default ChatLayout;
