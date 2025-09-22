import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSocket } from "@/contexts/SocketContext";
import type { User } from "@/contexts/SocketContext";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onGroupCreated: (group: any) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  users,
  onGroupCreated,
}) => {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { createGroup, currentUser } = useSocket();

  if (!currentUser) {
    // Handle the case where currentUser is null
    return;
  }

  const handleUserToggle = (
    username: string,
    checked: boolean | "indeterminate"
  ) => {
    console.log("Toggle:", username, checked);
    if (checked === true) {
      setSelectedUsers((prev) => [...prev, username]);
    } else {
      setSelectedUsers((prev) => prev.filter((u) => u !== username));
    }
  };

  const handleCreateGroup = async () => {
    // if (!groupName.trim() || selectedUsers.length === 0 || !currentUser) return;
    console.log("runnnn");

    setIsCreating(true);
    try {
      const newGroup = await createGroup(
        groupName.trim(),
        selectedUsers,
        currentUser.username
      );
      onGroupCreated(newGroup);
      setGroupName("");
      setSelectedUsers([]);
      onClose();
    } catch (error) {
      console.error("Failed to create group:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setGroupName("");
      setSelectedUsers([]);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              type="text"
              id="groupName"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Select Members ({selectedUsers.length} selected)</Label>
            <div className="max-h-60 overflow-y-auto border rounded-md p-2">
              {users
                .filter((user) => user.username !== currentUser?.username)
                .map((user) => (
                  <div
                    key={user.username}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                  >
                    <Checkbox
                      id={`user-${user.username}`}
                      checked={selectedUsers.includes(user.username)}
                      onCheckedChange={(checked) => {
                        console.log(
                          "Checkbox changed:",
                          checked,
                          "for user:",
                          user.username
                        );
                        handleUserToggle(user.username, checked);
                      }}
                    />
                    <label
                      htmlFor={`user-${user.username}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      onClick={() => {
                        const newChecked = !selectedUsers.includes(
                          user.username
                        );
                        handleUserToggle(user.username, newChecked);
                      }}
                    >
                      {user.name} (@{user.username})
                    </label>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <div className="text-sm text-gray-500 sm:mr-auto">
            {selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""}{" "}
            selected
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            // disabled={
            //   !groupName.trim() || selectedUsers.length === 0 || isCreating
            // }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? "Creating..." : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;
