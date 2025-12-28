import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useState } from "react";

export function AnimatedThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleTheme = () => {
    setIsAnimating(true);
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Reset animation state after animation completes
    setTimeout(() => setIsAnimating(false), 400);
  };

  const isDark = theme === 'dark';

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className={`
        relative h-9 w-9 transition-all duration-400 ease-in-out
        hover:bg-accent/50 hover:scale-110 active:scale-95
        ${isAnimating ? 'animate-pulse' : ''}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <Sun 
          className={`
            absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-400 ease-in-out
            ${isDark 
              ? 'rotate-180 scale-0 opacity-0' 
              : 'rotate-0 scale-100 opacity-100'
            }
          `}
        />
        
        {/* Moon Icon */}
        <Moon 
          className={`
            absolute inset-0 w-5 h-5 text-blue-300 transition-all duration-400 ease-in-out
            ${isDark 
              ? 'rotate-0 scale-100 opacity-100' 
              : 'rotate-180 scale-0 opacity-0'
            }
          `}
        />
      </div>
    </Button>
  );
}