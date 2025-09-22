import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (userData: {
    username: string;
    name: string;
    id: string;
  }) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim()) {
      setError("Please enter both username and name");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Check if user exists or create new user
      const response = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, name }),
      });

      if (response.ok) {
        const userData = await response.json();
        onLoginSuccess(userData);
      } else if (response.status === 409) {
        // User already exists, just proceed with login
        onLoginSuccess({ username, name, id: `temp-${username}` });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md"  >
        <DialogHeader>
          <DialogTitle className="text-center">Join Chat</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e: any) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <Input
              type="text"
              placeholder="Display Name"
              value={name}
              onChange={(e: any) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Joining..." : "Join Chat"}
          </Button>
        </form>

        <p className="text-sm text-gray-500 text-center">
          Enter your username and display name to start chatting
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
