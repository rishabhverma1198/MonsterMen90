"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import type { DayPickerSingleProps, DayPickerMultipleProps, DayPickerRangeProps } from "react-day-picker"
import { cn } from "@/lib/utils"

// Extended calendar modes for better type safety
export type CalendarMode = "single" | "multiple" | "range"

// Enhanced props with proper typing and validation
export interface CalendarProps {
  /** Visual mode of the calendar */
  mode?: CalendarMode
  /** Custom className for styling */
  className?: string
  /** Whether the calendar is in loading state */
  loading?: boolean
  /** Whether to show outside days */
  showOutsideDays?: boolean
  /** Custom icon components */
  icons?: {
    /** Navigation left icon component */
    left?: React.ComponentType<React.SVGProps<SVGSVGElement>>
    /** Navigation right icon component */
    right?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  }
  /** Error callback for handling calendar errors */
  onError?: (error: Error) => void
  /** Additional props for the underlying DayPicker */
  dayPickerProps?: DayPickerSingleProps | DayPickerMultipleProps | DayPickerRangeProps
}

/**
 * Custom navigation icons component for better reusability
 */
interface NavigationIconsProps {
  direction: 'left' | 'right'
  className?: string
  iconComponent?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

/**
 * Navigation icon component with proper TypeScript typing
 */
const NavigationIcon: React.FC<NavigationIconsProps> = ({
  direction,
  className,
  iconComponent: Icon
}) => {
  // Default icons based on direction
  const DefaultIcon = direction === "left" ? ChevronLeft : ChevronRight
  const ComponentToRender = Icon || DefaultIcon
  
  return (
    <ComponentToRender 
      className={cn("h-4 w-4", className)} 
      aria-label={`Navigate ${direction}`}
      role="img"
    />
  )
}

/**
 * Loading skeleton component for better UX
 */
const CalendarLoadingSkeleton: React.FC = () => (
  <div className="p-3 space-y-4 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-8 w-8 bg-gray-200 rounded"></div>
      <div className="h-6 w-24 bg-gray-200 rounded"></div>
      <div className="h-8 w-8 bg-gray-200 rounded"></div>
    </div>
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }, (_, i) => (
        <div key={i} className="h-8 w-8 bg-gray-200 rounded"></div>
      ))}
    </div>
  </div>
)

/**
 * Error boundary component for calendar
 */
interface CalendarErrorStateProps {
  error: Error
  onRetry?: () => void
}

const CalendarErrorState: React.FC<CalendarErrorStateProps> = ({ error, onRetry }) => (
  <div className="p-4 text-center text-red-600 border border-red-200 rounded-md">
    <p className="text-sm font-medium">Calendar Error</p>
    <p className="text-xs mt-1 opacity-75">{error.message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded transition-colors"
        type="button"
      >
        Retry
      </button>
    )}
  </div>
)

/**
 * Enhanced Calendar component with improved performance, error handling, and accessibility
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Calendar />
 * 
 * // With custom props
 * <Calendar 
 *   mode="single"
 *   selected={date}
 *   onSelect={setDate}
 *   showOutsideDays={false}
 * />
 * 
 * // With custom styling
 * <Calendar 
 *   className="border-none shadow-lg"
 *   icons={{ 
 *     left: CustomLeftIcon,
 *     right: CustomRightIcon 
 *   }}
 * />
 * ```
 */
const Calendar = React.memo<CalendarProps>(({
  mode = "single",
  className,
  loading = false,
  showOutsideDays = true,
  icons = {},
  onError,
  dayPickerProps = {},
  ...props
}) => {
  // Memoize icon components to prevent unnecessary re-renders
  const memoizedIcons = React.useMemo(() => ({
    IconLeft: (iconProps: React.SVGProps<SVGSVGElement>) => (
      <NavigationIcon
        direction="left"
        className={cn("h-4 w-4", iconProps.className)}
        iconComponent={icons.left}
      />
    ),
    IconRight: (iconProps: React.SVGProps<SVGSVGElement>) => (
      <NavigationIcon
        direction="right"
        className={cn("h-4 w-4", iconProps.className)}
        iconComponent={icons.right}
      />
    ),
  }), [icons.left, icons.right])

  // Memoize the base className to prevent className recalculation
  const baseClassName = React.useMemo(() => 
    cn("p-3", className), 
    [className]
  )

  // Error handling function that will be used in error scenarios
  const handleDayPickerError = React.useCallback((error: Error) => {
    console.error("Calendar rendering error:", error)
    onError?.(error)
  }, [onError])

  // Loading state
  if (loading) {
    return <CalendarLoadingSkeleton />
  }

  try {
    // Validate critical props
    if (mode && !["single", "multiple", "range"].includes(mode)) {
      const error = new Error(`Invalid calendar mode: ${mode}. Must be 'single', 'multiple', or 'range'`)
      handleDayPickerError(error)
      throw error
    }

    // Merge dayPickerProps with proper type safety
    const mergedProps = {
      showOutsideDays,
      ...dayPickerProps,
      mode: mode,
    }

    return (
      <DayPicker
        className={baseClassName}
        components={memoizedIcons as any}
        {...(mergedProps as any)}
        {...props}
      />
    )
  } catch (error) {
    const calendarError = error instanceof Error ? error : new Error("Unknown calendar error")
    return <CalendarErrorState error={calendarError} onRetry={() => window.location.reload()} />
  }
})

// Set display name for better debugging
Calendar.displayName = "Calendar"

// Export component and sub-components
export { Calendar }
export type { NavigationIconsProps }
