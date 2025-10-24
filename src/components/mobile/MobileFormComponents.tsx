import React, { forwardRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMobileInfo } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Search,
  Mic,
  Camera,
  X,
  ChevronDown,
  Calendar,
  Clock,
} from "lucide-react";

// Mobile-optimized input field
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  voiceInput?: boolean;
  onVoiceInput?: () => void;
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ 
    className, 
    label, 
    error, 
    success, 
    helperText, 
    leftIcon, 
    rightIcon, 
    clearable,
    onClear,
    voiceInput,
    onVoiceInput,
    type = "text",
    ...props 
  }, ref) => {
    const { isMobile, touchSupported } = useMobileInfo();
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Mobile-specific input optimizations
    const getMobileInputMode = (inputType: string) => {
      switch (inputType) {
        case "email": return "email";
        case "tel": return "tel";
        case "url": return "url";
        case "search": return "search";
        case "number": return "numeric";
        default: return "text";
      }
    };

    return (
      <div className={cn("mobile-input-group", className)}>
        {label && (
          <Label
            className={cn(
              "text-sm font-medium mb-2 block",
              error ? "text-red-600" : "text-gray-700 dark:text-slate-300",
              isMobile && "text-base" // Larger text on mobile
            )}
          >
            {label}
          </Label>
        )}
        
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <Input
            ref={ref}
            type={type === "password" && showPassword ? "text" : type}
            inputMode={isMobile ? getMobileInputMode(type) : undefined}
            className={cn(
              "transition-all duration-200",
              // Mobile-optimized sizing
              isMobile && [
                "h-12 text-base px-4", // Larger touch targets
                "rounded-lg border-2", // More prominent borders
              ],
              // State styles
              isFocused && "ring-2 ring-primary/20 border-primary",
              error && "border-red-500 ring-red-500/20",
              success && "border-green-500 ring-green-500/20",
              // Icon spacing
              leftIcon && "pl-10",
              (rightIcon || clearable || voiceInput || type === "password") && "pr-12",
              // Touch optimization
              touchSupported && "touch-manipulation"
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
              // Prevent zoom on iOS
              if (isMobile) {
                e.target.style.fontSize = "16px";
              }
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
              if (isMobile) {
                e.target.style.fontSize = "";
              }
            }}
            {...(({ size, ...rest }) => rest)(props)}
          />

          {/* Right Icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {/* Clear button */}
            {clearable && props.value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-slate-800"
                onClick={onClear}
                tabIndex={-1}
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {/* Voice input button */}
            {voiceInput && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-slate-800"
                onClick={onVoiceInput}
                tabIndex={-1}
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}

            {/* Password toggle */}
            {type === "password" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-slate-800"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}

            {/* Custom right icon */}
            {rightIcon && !clearable && !voiceInput && type !== "password" && rightIcon}

            {/* Success/Error icons */}
            {success && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {error && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Helper text or error message */}
        {(helperText || error) && (
          <p
            className={cn(
              "text-sm mt-1",
              error ? "text-red-600" : "text-gray-500 dark:text-slate-400",
              isMobile && "text-base" // Larger text on mobile
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = "MobileInput";

// Mobile-optimized textarea
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  autoResize?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
}

export const MobileTextarea = forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({ 
    className, 
    label, 
    error, 
    success, 
    helperText, 
    autoResize = true,
    maxLength,
    showCharCount = false,
    ...props 
  }, ref) => {
    const { isMobile, touchSupported } = useMobileInfo();
    const [isFocused, setIsFocused] = useState(false);
    const [charCount, setCharCount] = useState(props.value?.toString().length || 0);

    useEffect(() => {
      setCharCount(props.value?.toString().length || 0);
    }, [props.value]);

    return (
      <div className={cn("mobile-textarea-group", className)}>
        {label && (
          <Label
            className={cn(
              "text-sm font-medium mb-2 block",
              error ? "text-red-600" : "text-gray-700 dark:text-slate-300",
              isMobile && "text-base"
            )}
          >
            {label}
          </Label>
        )}
        
        <div className="relative">
          <Textarea
            ref={ref}
            className={cn(
              "transition-all duration-200",
              // Mobile optimizations
              isMobile && [
                "text-base px-4 py-3", // Larger touch-friendly sizing
                "rounded-lg border-2",
                "min-h-[120px]", // Adequate height for mobile
              ],
              // State styles
              isFocused && "ring-2 ring-primary/20 border-primary",
              error && "border-red-500 ring-red-500/20",
              success && "border-green-500 ring-green-500/20",
              // Touch optimization
              touchSupported && "touch-manipulation",
              // Auto-resize
              autoResize && "resize-none"
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
              // Prevent zoom on iOS
              if (isMobile) {
                e.target.style.fontSize = "16px";
              }
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
              if (isMobile) {
                e.target.style.fontSize = "";
              }
            }}
            onChange={(e) => {
              setCharCount(e.target.value.length);
              props.onChange?.(e);
            }}
            maxLength={maxLength}
            {...props}
          />
        </div>

        {/* Footer with character count and helper text */}
        <div className="flex justify-between items-center mt-1">
          <div>
            {(helperText || error) && (
              <p
                className={cn(
                  "text-sm",
                  error ? "text-red-600" : "text-gray-500 dark:text-slate-400",
                  isMobile && "text-base"
                )}
              >
                {error || helperText}
              </p>
            )}
          </div>
          
          {(showCharCount || maxLength) && (
            <p
              className={cn(
                "text-xs text-gray-400",
                maxLength && charCount > maxLength * 0.9 && "text-orange-500",
                maxLength && charCount >= maxLength && "text-red-500"
              )}
            >
              {maxLength ? `${charCount}/${maxLength}` : charCount}
            </p>
          )}
        </div>
      </div>
    );
  }
);

MobileTextarea.displayName = "MobileTextarea";

// Mobile search input with enhanced features
interface MobileSearchInputProps extends Omit<MobileInputProps, "type"> {
  onSearch?: (query: string) => void;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  showRecentSearches?: boolean;
  recentSearches?: string[];
  placeholder?: string;
}

export const MobileSearchInput: React.FC<MobileSearchInputProps> = ({
  onSearch,
  suggestions = [],
  onSuggestionSelect,
  showRecentSearches = false,
  recentSearches = [],
  placeholder = "Search...",
  ...props
}) => {
  const { t } = useTranslation("common");
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = () => {
    if (query.trim() && onSearch) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSuggestionSelect?.(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <MobileInput
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(e.target.value.length > 0);
        }}
        onFocus={() => setShowSuggestions(query.length > 0)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
          }
        }}
        leftIcon={<Search className="h-4 w-4" />}
        clearable
        onClear={() => {
          setQuery("");
          setShowSuggestions(false);
        }}
        voiceInput
        onVoiceInput={() => {
          // Voice input implementation would go here
          console.log("Voice input requested");
        }}
        {...props}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || (showRecentSearches && recentSearches.length > 0)) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {/* Recent searches */}
            {showRecentSearches && recentSearches.length > 0 && (
              <div className="p-2 border-b">
                <p className="text-xs text-gray-500 mb-2">{t("recentSearches", "Recent searches")}</p>
                {recentSearches.slice(0, 3).map((search, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-sm"
                    onClick={() => handleSuggestionClick(search)}
                  >
                    <Clock className="h-3 w-3 inline mr-2 text-gray-400" />
                    {search}
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Search className="h-3 w-3 inline mr-2 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Mobile-optimized select with native feel
interface MobileSelectProps {
  label?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
}

export const MobileSelect: React.FC<MobileSelectProps> = ({
  label,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  error,
  className,
}) => {
  const { isMobile } = useMobileInfo();

  return (
    <div className={cn("mobile-select-group", className)}>
      {label && (
        <Label
          className={cn(
            "text-sm font-medium mb-2 block",
            error ? "text-red-600" : "text-gray-700 dark:text-slate-300",
            isMobile && "text-base"
          )}
        >
          {label}
        </Label>
      )}

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            "transition-all duration-200",
            isMobile && [
              "h-12 text-base px-4",
              "rounded-lg border-2",
            ],
            error && "border-red-500 ring-red-500/20"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={isMobile ? "text-base" : ""}>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={isMobile ? "py-3 text-base" : ""}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && (
        <p className={cn("text-sm mt-1 text-red-600", isMobile && "text-base")}>
          {error}
        </p>
      )}
    </div>
  );
};

export default {
  MobileInput,
  MobileTextarea,
  MobileSearchInput,
  MobileSelect,
}; 