import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LeadForm } from "@/components/forms/LeadForm";
import { RTLProvider } from "@/contexts/RTLContext";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        "forms.title": "Lead Form",
        "forms.description":
          "Please fill out the following details and we'll get back to you soon",
        "forms.fields.name": "Full Name",
        "forms.fields.email": "Email Address",
        "forms.fields.phone": "Phone Number",
        "forms.fields.company": "Company Name",
        "forms.fields.status": "Lead Status",
        "forms.fields.source": "Source",
        "forms.fields.priority": "Priority",
        "forms.fields.notes": "Notes",
        "forms.placeholders.name": "Enter your full name",
        "forms.placeholders.email": "Enter your email address",
        "forms.placeholders.phone": "Enter your phone number",
        "forms.placeholders.company": "Enter your company name",
        "forms.placeholders.status": "Select status",
        "forms.placeholders.source": "Select source",
        "forms.placeholders.priority": "Select priority",
        "forms.placeholders.notes": "Enter any additional notes or comments",
        "forms.buttons.submit": "Save Lead",
        "forms.buttons.submitting": "Submitting...",
        "forms.buttons.reset": "Reset",
        "forms.success.title": "Form submitted successfully!",
        "forms.success.description": "A representative will contact you soon",
        "forms.validation.nameRequired": "Name is required",
        "forms.validation.nameMinLength": "Name must be at least 2 characters",
        "forms.validation.emailOptional": "Email is optional",
        "forms.validation.emailInvalid": "Please enter a valid email address",
        "forms.validation.phoneRequired": "Phone is required",
        "forms.validation.phoneMinLength":
          "Phone number must be at least 8 characters",
        "forms.validation.notesMaxLength":
          "Notes cannot exceed 1000 characters",
        "forms.status.newLead": "New Lead",
        "forms.status.contacted": "Contacted",
        "forms.status.qualified": "Qualified",
        "forms.status.converted": "Converted",
        "forms.status.lost": "Lost",
        "forms.source.website": "Website",
        "forms.source.referral": "Referral",
        "forms.source.socialMedia": "Social Media",
        "forms.source.advertising": "Advertising",
        "forms.source.coldCall": "Cold Call",
        "forms.source.other": "Other",
        "forms.priority.low": "Low",
        "forms.priority.medium": "Medium",
        "forms.priority.high": "High",
        "forms.priority.urgent": "Urgent",
      };
      return translations[key] || fallback || key;
    },
  }),
}));

// Mock useLang hook
vi.mock("@/hooks/useLang", () => ({
  useLang: () => ({
    isRTL: false,
    textStart: () => "text-left",
    flexRowReverse: () => "flex-row",
  }),
}));

// Mock Select components to avoid DOM nesting warnings
vi.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, defaultValue }: any) => (
    <div data-testid="select-wrapper">
      <select
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onValueChange?.(e.target.value)
        }
        defaultValue={defaultValue}
        aria-label="Select"
      >
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children, className }: any) => (
    <>{children}</>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

const renderWithRTL = (ui: React.ReactElement, isRTL = false) => {
  return render(<RTLProvider defaultRTL={isRTL}>{ui}</RTLProvider>);
};

describe("LeadForm", () => {
  const mockSubmit = vi.fn();
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    mockSubmit.mockClear();
    // Use real timers for userEvent compatibility
    vi.useRealTimers();
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render all required form fields", () => {
      renderWithRTL(<LeadForm />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      // Select fields use aria-labelledby, so we check for the labels and triggers
      expect(screen.getByText(/lead status/i)).toBeInTheDocument();
      expect(screen.getAllByText(/priority/i)).toHaveLength(2); // Label and placeholder
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    it("should render submit button", () => {
      renderWithRTL(<LeadForm />);
      expect(
        screen.getByRole("button", { name: /save lead/i }),
      ).toBeInTheDocument();
    });

    it("should render form title and description", () => {
      renderWithRTL(<LeadForm />);
      expect(screen.getByText("Lead Form")).toBeInTheDocument();
      expect(
        screen.getByText(/please fill out the following details/i),
      ).toBeInTheDocument();
    });
  });

  describe("RTL Support", () => {
    it("should render in RTL mode with proper direction", () => {
      renderWithRTL(<LeadForm />, true);

      // Check that the document has RTL direction (our new implementation applies to document.documentElement)
      expect(document.documentElement).toHaveAttribute("dir", "rtl");
      expect(document.documentElement).toHaveClass("rtl");

      // Check that the form still has the English labels (since we're not actually translating)
      expect(screen.getByText("Lead Form")).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /save lead/i }),
      ).toBeInTheDocument();
    });

    it("should apply RTL class when in RTL mode", () => {
      renderWithRTL(<LeadForm />, true);

      // Check that the document element has the RTL class
      expect(document.documentElement).toHaveClass("rtl");
      expect(document.documentElement).toHaveAttribute("dir", "rtl");
    });
  });

  describe("Form Validation", () => {
    it("should prevent submission with empty required fields", async () => {
      renderWithRTL(<LeadForm onSubmit={mockSubmit} />);

      const submitButton = screen.getByRole("button", { name: /save lead/i });
      await user.click(submitButton);

      // Form should not submit if validation fails
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("should prevent submission with invalid phone format", async () => {
      renderWithRTL(<LeadForm onSubmit={mockSubmit} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/phone/i), "invalid-phone");

      const submitButton = screen.getByRole("button", { name: /save lead/i });
      await user.click(submitButton);

      // Form should not submit if validation fails
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("should prevent submission with short phone number", async () => {
      renderWithRTL(<LeadForm onSubmit={mockSubmit} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/phone/i), "123");

      const submitButton = screen.getByRole("button", { name: /save lead/i });
      await user.click(submitButton);

      // Form should not submit if validation fails
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("should handle form input changes", async () => {
      renderWithRTL(<LeadForm onSubmit={mockSubmit} />);

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, "John Doe");

      expect((nameInput as HTMLInputElement).value).toBe("John Doe");
    });
  });

  describe("Form Submission", () => {
    it("should submit valid form data", async () => {
      renderWithRTL(<LeadForm onSubmit={mockSubmit} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/phone/i), "1234567890");
      await user.type(screen.getByLabelText(/notes/i), "Test notes");

      const submitButton = screen.getByRole("button", { name: /save lead/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          name: "John Doe",
          phone: "1234567890",
          notes: "Test notes",
          status: "new_lead",
          state: "new_lead",
          priority: "medium",
        });
      });
    });

    it("should show success message after submission", async () => {
      renderWithRTL(<LeadForm onSubmit={mockSubmit} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/phone/i), "1234567890");

      const submitButton = screen.getByRole("button", { name: /save lead/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/form submitted successfully/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Initial Data", () => {
    it("should populate form with initial data", () => {
      const initialData = {
        name: "Jane Doe",
        phone: "0987654321",
        status: "contacted" as const,
        state: "contacted" as const,
        priority: "high" as const,
        notes: "Initial notes",
      };

      renderWithRTL(<LeadForm initialData={initialData} />);

      expect(
        (screen.getByLabelText(/full name/i) as HTMLInputElement).value,
      ).toBe("Jane Doe");
      expect((screen.getByLabelText(/phone/i) as HTMLInputElement).value).toBe(
        "0987654321",
      );
      expect(
        (screen.getByLabelText(/notes/i) as HTMLTextAreaElement).value,
      ).toBe("Initial notes");
    });
  });

  describe("Form Fields", () => {
    it("should have required attribute on required fields", () => {
      renderWithRTL(<LeadForm />);

      expect(screen.getByLabelText(/full name/i)).toHaveAttribute("required");
      expect(screen.getByLabelText(/phone/i)).toHaveAttribute("required");
    });

    it("should have proper input types", () => {
      renderWithRTL(<LeadForm />);

      expect(screen.getByLabelText(/phone/i)).toHaveAttribute("type", "tel");
    });

    it("should count characters in notes field", async () => {
      renderWithRTL(<LeadForm />);

      const notesField = screen.getByLabelText(/notes/i);
      await user.type(notesField, "Test");

      expect(screen.getByText("4/1000 characters")).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should disable submit button when submitting", async () => {
      // Mock a slow submit function that resolves quickly for testing
      const slowSubmit = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100)),
        );
      renderWithRTL(<LeadForm onSubmit={slowSubmit} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/phone/i), "1234567890");

      const submitButton = screen.getByRole("button", { name: /save lead/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();

      // Wait for submission to complete
      await waitFor(() => {
        expect(slowSubmit).toHaveBeenCalled();
      });
    });

    it("should disable all form fields when submitting", async () => {
      // Mock a slow submit function that resolves quickly for testing
      const slowSubmit = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100)),
        );
      renderWithRTL(<LeadForm onSubmit={slowSubmit} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/phone/i), "1234567890");

      const submitButton = screen.getByRole("button", { name: /save lead/i });
      await user.click(submitButton);

      expect(screen.getByLabelText(/full name/i)).toBeDisabled();
      expect(screen.getByLabelText(/phone/i)).toBeDisabled();

      // Wait for submission to complete
      await waitFor(() => {
        expect(slowSubmit).toHaveBeenCalled();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for all form fields", () => {
      renderWithRTL(<LeadForm />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      
      // For select fields, check for labels and triggers separately since they use aria-labelledby
      expect(screen.getByText(/lead status/i)).toBeInTheDocument();
      expect(screen.getAllByText(/priority/i)).toHaveLength(2); // Label and placeholder
      
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });
  });
});
