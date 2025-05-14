
import React from "react";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="border-b px-6 py-3 bg-white flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <div className="flex items-center space-x-4">
        <div className="text-sm">
          <span className="text-gray-500 mr-1">欢迎，</span>
          <span className="font-medium">{user?.username}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
          {user?.username[0].toUpperCase()}
        </div>
      </div>
    </header>
  );
};
