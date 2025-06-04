import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface PurposeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const purposes = [
  { value: '带班', label: '带班' },
  { value: '水军', label: '水军' },
  { value: '测试', label: '测试' },
  { value: '新媒体', label: '新媒体' },
  { value: '其他', label: '其他' },
];

const PurposeSelector: React.FC<PurposeSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "选择用途",
  className = "h-9"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedPurpose = purposes.find(p => p.value === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
      >
        <span className={selectedPurpose ? 'text-gray-900 font-normal' : 'text-gray-500 font-normal'}>
          {selectedPurpose ? selectedPurpose.label : placeholder}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-auto">
          {purposes.map((purpose) => (
            <button
              key={purpose.value}
              type="button"
              onClick={() => {
                onValueChange(purpose.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 font-normal ${
                value === purpose.value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
              }`}
            >
              {purpose.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PurposeSelector; 