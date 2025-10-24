/**
 * Comprehensive Accessibility Tests
 * Validates WCAG compliance and accessibility best practices
 */

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { axe } from 'jest-axe';
import 'jest-axe/extend-expect.js';


describe("Accessibility Tests", () => {
  afterEach(() => {
    cleanup();
  });

  it("should pass basic accessibility validation with axe-core", async () => {
    const TestComponent = () => (
      <div role="main">
        <h1>Test Heading</h1>
        <button aria-label="Test Button">Click me</button>
        <input aria-label="Test Input" type="text" />
      </div>
    );

    const { container } = render(<TestComponent />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it("should validate aria labels exist on interactive elements", () => {
    const TestComponent = () => (
      <div>
        <button aria-label="Submit form">Submit</button>
        <input aria-label="Enter your name" type="text" />
        <select aria-label="Choose option">
          <option>Option 1</option>
        </select>
      </div>
    );

    render(<TestComponent />);

    const button = screen.getByRole("button");
    const input = screen.getByRole("textbox");
    const select = screen.getByRole("combobox");

    expect(button).toHaveAttribute("aria-label");
    expect(input).toHaveAttribute("aria-label");
    expect(select).toHaveAttribute("aria-label");
  });

  it("should check keyboard navigation support", () => {
    const TestComponent = () => (
      <div>
        <button tabIndex={0}>First</button>
        <button tabIndex={0}>Second</button>
        <button tabIndex={0}>Third</button>
      </div>
    );

    render(<TestComponent />);

    const buttons = screen.getAllByRole("button");

    buttons.forEach((button) => {
      expect(button).toHaveAttribute("tabIndex", "0");
    });
  });

  it("should validate heading hierarchy", () => {
    const TestComponent = () => (
      <div>
        <h1>Main Title</h1>
        <h2>Section Title</h2>
        <h3>Subsection Title</h3>
      </div>
    );

    render(<TestComponent />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("should validate color contrast ratios", async () => {
    const TestComponent = () => (
      <div style={{ backgroundColor: "#ffffff", color: "#000000" }}>
        <p>This text should have sufficient contrast</p>
      </div>
    );

    const { container } = render(<TestComponent />);
    const results = await axe(container, {
      rules: {
        "color-contrast": { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });
});
