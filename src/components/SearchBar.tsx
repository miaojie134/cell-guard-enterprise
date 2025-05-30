import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch,
  placeholder = "搜索..."
}) => {
  const [searchValue, setSearchValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const handleClear = () => {
    setSearchValue("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm items-center space-x-2">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pr-8 h-10"
        />
        {searchValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full w-8 px-0 hover:bg-transparent"
            onClick={handleClear}
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>
      <Button type="submit" size="icon" className="h-10 w-10">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default SearchBar;
