import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserType } from "../../hooks/useUserType";
import type { UserType } from "../../context/UserTypeContextBase";

// Constants for better maintainability
const HERO_CONSTANTS = {
  TITLE: "Welcome to MonsterMen90",
  SUBTITLE: "Choose how you want to shop",
  USER_TYPES: {
    BUYER: "buyer" as UserType,
    WHOLESALER: "wholesaler" as UserType
  },
  ROUTES: {
    BUYER: "/buyer",
    WHOLESALER: "/wholesaler"
  },
  LABELS: {
    BUYER_BUTTON: "Shop as Buyer",
    WHOLESALER_BUTTON: "Shop as Wholesaler"
  }
} as const;

// Reusable button styles
const BUTTON_STYLES = {
  PRIMARY: "px-8 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors",
  SECONDARY: "px-8 py-3 border rounded-xl font-semibold hover:bg-gray-50 transition-colors",
  DISABLED: "px-8 py-3 bg-gray-400 text-gray-600 rounded-xl font-semibold cursor-not-allowed"
} as const;

// User type configuration
interface UserTypeConfig {
  type: UserType;
  route: string;
  label: string;
  buttonStyle: string;
}

const USER_TYPE_CONFIGS: UserTypeConfig[] = [
  {
    type: HERO_CONSTANTS.USER_TYPES.BUYER,
    route: HERO_CONSTANTS.ROUTES.BUYER,
    label: HERO_CONSTANTS.LABELS.BUYER_BUTTON,
    buttonStyle: BUTTON_STYLES.PRIMARY
  },
  {
    type: HERO_CONSTANTS.USER_TYPES.WHOLESALER,
    route: HERO_CONSTANTS.ROUTES.WHOLESALER,
    label: HERO_CONSTANTS.LABELS.WHOLESALER_BUTTON,
    buttonStyle: BUTTON_STYLES.SECONDARY
  }
] as const;

export default function Hero() {
  const navigate = useNavigate();
  const { setUserType } = useUserType();
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optimized navigation handler with error handling
  const handleUserTypeSelection = useCallback(
    async (userType: UserType, route: string) => {
      if (!userType) {
        setError("Invalid user type selected");
        return;
      }

      if (!route) {
        setError("Invalid route specified");
        return;
      }

      try {
        setError(null);
        setIsNavigating(true);

        // Update user type with validation
        setUserType(userType);

        // Simulate async operation to prevent rapid clicks
        await new Promise(resolve => setTimeout(resolve, 100));

        // Navigate with error handling
        navigate(route, { replace: true });
      } catch (err) {
        console.error("Navigation error:", err);
        setError("Failed to navigate. Please try again.");
        setIsNavigating(false);
      }
    },
    [navigate, setUserType]
  );

  // Handle keyboard navigation for accessibility
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, userType: UserType, route: string) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleUserTypeSelection(userType, route);
      }
    },
    [handleUserTypeSelection]
  );

  return (
    <section 
      className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6"
      role="banner"
      aria-labelledby="hero-title"
    >
      {/* Error Display */}
      {error && (
        <div 
          className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-md"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col items-center">
        <h1 
          id="hero-title"
          className="text-4xl font-bold text-gray-900 mb-3"
        >
          {HERO_CONSTANTS.TITLE}
        </h1>

        <p className="text-gray-600 max-w-xl mb-8">
          {HERO_CONSTANTS.SUBTITLE}
        </p>

        {/* Action Buttons */}
        <div 
          className="flex gap-4 flex-wrap justify-center"
          role="group"
          aria-label="User type selection"
        >
          {USER_TYPE_CONFIGS.map((config) => (
            <button
              key={config.type}
              onClick={() => handleUserTypeSelection(config.type, config.route)}
              onKeyDown={(e) => handleKeyDown(e, config.type, config.route)}
              disabled={isNavigating}
              className={isNavigating ? BUTTON_STYLES.DISABLED : config.buttonStyle}
              aria-label={`Navigate to ${config.label}`}
              type="button"
            >
              {isNavigating ? (
                <span className="flex items-center gap-2">
                  <svg 
                    className="animate-spin h-4 w-4" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Loading...
                </span>
              ) : (
                config.label
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading overlay for screen readers */}
      {isNavigating && (
        <div 
          className="sr-only" 
          aria-live="polite" 
          aria-label="Navigation in progress"
        >
          Navigating to selected user type...
        </div>
      )}
    </section>
  );
}