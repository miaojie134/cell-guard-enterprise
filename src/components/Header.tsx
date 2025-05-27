
import React from "react";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="border-b px-4 py-2 bg-white flex items-center justify-between">
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      <div className="flex items-center space-x-3">
        <div className="text-xs">
          <span className="text-gray-500 mr-1">欢迎，</span>
          <span className="font-medium">{user?.username}</span>
        </div>
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-medium text-xs">
          {user?.username[0].toUpperCase()}
        </div>
      </div>
    </header>
  );
};
