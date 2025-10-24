import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  id?: string
  required?: boolean
  error?: boolean
  "aria-describedby"?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  disabled = false,
  className,
  id,
  required = false,
  error = false,
  "aria-describedby": ariaDescribedBy,
  ...props
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find((option) => option.value === value)

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === value) {
      onValueChange?.("")
    } else {
      onValueChange?.(selectedValue)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedOption && "text-muted-foreground",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          disabled={disabled}
          id={id}
          aria-describedby={ariaDescribedBy}
          aria-required={required}
          {...props}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Multi-select Combobox Component
interface MultiComboboxProps {
  options: ComboboxOption[]
  values?: string[]
  onValuesChange?: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  id?: string
  required?: boolean
  error?: boolean
  "aria-describedby"?: string
  maxSelected?: number
}

export function MultiCombobox({
  options,
  values = [],
  onValuesChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  disabled = false,
  className,
  id,
  required = false,
  error = false,
  "aria-describedby": ariaDescribedBy,
  maxSelected,
  ...props
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOptions = options.filter((option) => values.includes(option.value))

  const handleSelect = (selectedValue: string) => {
    const newValues = values.includes(selectedValue)
      ? values.filter((v) => v !== selectedValue)
      : maxSelected && values.length >= maxSelected
      ? values
      : [...values, selectedValue]
    
    onValuesChange?.(newValues)
  }

  const getDisplayText = () => {
    if (selectedOptions.length === 0) return placeholder
    if (selectedOptions.length === 1) return selectedOptions[0].label
    return `${selectedOptions.length} selected`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            selectedOptions.length === 0 && "text-muted-foreground",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          disabled={disabled}
          id={id}
          aria-describedby={ariaDescribedBy}
          aria-required={required}
          {...props}
        >
          {getDisplayText()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled || (maxSelected && !values.includes(option.value) && values.length >= maxSelected)}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      values.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox as default } 