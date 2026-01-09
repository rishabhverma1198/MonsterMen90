import './RealtimeStatus.css';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface RealtimeStatusProps {
  healthy: boolean;
  className?: string;
  showText?: boolean;
  customText?: {
    connected: string;
    disconnected: string;
  };
  onStatusChange?: (healthy: boolean) => void;
}

export default function RealtimeStatus({ 
  healthy, 
  className = '', 
  showText = true,
  customText,
  onStatusChange
}: RealtimeStatusProps) {
  // Track previous status for change detection
  const [prevHealthy, setPrevHealthy] = useState(healthy);
  
  useEffect(() => {
    if (prevHealthy !== healthy) {
      // Status changed - show toast notification
      if (healthy) {
        toast({
          title: "Realtime Connected",
          description: customText?.connected || "Real-time sync is now active",
          variant: "default"
        });
      } else {
        toast({
          title: "Realtime Disconnected",
          description: customText?.disconnected || "Attempting to reconnect...",
          variant: "destructive"
        });
      }
      
      // Call callback if provided
      if (onStatusChange) {
        onStatusChange(healthy);
      }
      
      setPrevHealthy(healthy);
    }
  }, [healthy, prevHealthy, customText, onStatusChange]);
  
  // Destructure with fallbacks to handle partial customText safely
  const { 
    connected = "Realtime Connected", 
    disconnected = "Realtime Disconnected" 
  } = customText || {};
  
  const statusText = healthy ? connected : disconnected;
  const indicatorClass = healthy ? 'realtime-status-indicator healthy' : 'realtime-status-indicator unhealthy';
  const containerClass = `realtime-status-container ${className}`.trim();

  return (
    <div className={containerClass} role="status" aria-live="polite">
      <span
        className={indicatorClass}
        aria-label={healthy ? 'Realtime connection healthy' : 'Realtime connection unhealthy'}
      />
      {showText && (
        <span className="realtime-status-text">
          {statusText}
        </span>
      )}
    </div>
  );
}
