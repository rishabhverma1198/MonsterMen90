import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface BackButtonProps {
  to?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  children?: React.ReactNode;
  showText?: boolean; // Whether to show text or just icon
}

export default function BackButton({ 
  to, 
  onClick, 
  variant = 'ghost', 
  size = 'sm',
  className = '',
  children = 'Back',
  showText = true
}: BackButtonProps) {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  // Theme-aware styling
  const themeClasses = resolvedTheme === 'dark' 
    ? 'text-gray-200 hover:text-white hover:bg-gray-800' 
    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`flex items-center gap-2 ${themeClasses} ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {showText && (
        <span className="font-medium">{children}</span>
      )}
    </Button>
  );
}