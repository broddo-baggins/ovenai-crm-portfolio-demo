"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DateRange } from "react-day-picker"
import { addDays } from "date-fns"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  required?: boolean
  error?: boolean
  "aria-describedby"?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  id,
  required = false,
  error = false,
  "aria-describedby": ariaDescribedBy,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange?.(selectedDate)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          disabled={disabled}
          id={id}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-describedby={ariaDescribedBy}
          aria-required={required}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

// Date Range Picker Component
interface DateRangePickerProps {
  from?: Date
  to?: Date
  onDateRangeChange?: (range: { from: Date | undefined; to: Date | undefined }) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  required?: boolean
  error?: boolean
  "aria-describedby"?: string
}

export function DateRangePicker({
  from,
  to,
  onDateRangeChange,
  placeholder = "Pick a date range",
  disabled = false,
  className,
  id,
  required = false,
  error = false,
  "aria-describedby": ariaDescribedBy,
  ...props
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleDateSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (range) {
      onDateRangeChange?.(range)
      if (range.from && range.to) {
        setOpen(false)
      }
    }
  }

  const formatDateRange = () => {
    if (from && to) {
      return `${format(from, "LLL dd, y")} - ${format(to, "LLL dd, y")}`
    } else if (from) {
      return format(from, "LLL dd, y")
    }
    return placeholder
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !(from || to) && "text-muted-foreground",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          disabled={disabled}
          id={id}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-describedby={ariaDescribedBy}
          aria-required={required}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{formatDateRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={from}
          selected={{ from, to }}
          onSelect={handleDateSelect}
          numberOfMonths={2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

interface DatePickerWithRangeProps {
  className?: string
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
  className,
  date,
  onDateChange,
}: DatePickerWithRangeProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    date || {
      from: new Date(2024, 0, 20),
      to: addDays(new Date(2024, 0, 20), 20),
    }
  )

  React.useEffect(() => {
    if (date !== dateRange) {
      setDateRange(date)
    }
  }, [date])

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDateRange(newDate)
    onDateChange?.(newDate)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { DatePicker as default } 