import "./App.css";
import ChatLayout from "./layouts/ChatLayout/ChatLayout";
import { SocketProvider } from "./contexts/SocketContext";
import { useState } from "react";
import LoginModal from "./layouts/LoginModal/LoginModal";

interface User {
  id: string;
  username: string;
  name: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(true);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setShowLogin(false);
  };

  if (showLogin) {
    return (
      <LoginModal isOpen={showLogin} onLoginSuccess={handleLoginSuccess} />
    );
  }

  return (
    <SocketProvider user={user}>
      <div className="flex items-center justify-center h-[90vh] w-[100vh]">
        <ChatLayout />
      </div>
    </SocketProvider>
  );
}

export default App;
