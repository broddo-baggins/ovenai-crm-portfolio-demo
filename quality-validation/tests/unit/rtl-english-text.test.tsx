import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnglishText } from '@/components/common/RTLProvider';

describe('English Text in RTL Context', () => {
  it('should maintain LTR direction for English text', () => {
    render(
      <div dir="rtl">
        <EnglishText data-testid="english-text">
          Queue Management Actions
        </EnglishText>
      </div>
    );

    const englishText = screen.getByTestId('english-text');
    
    // Should have LTR direction regardless of parent RTL context
    expect(englishText).toHaveAttribute('dir', 'ltr');
    expect(englishText).toHaveClass('text-left');
  });

  it('should render as span by default', () => {
    render(
      <EnglishText data-testid="english-text">
        Queue Management Actions
      </EnglishText>
    );

    const englishText = screen.getByTestId('english-text');
    expect(englishText.tagName.toLowerCase()).toBe('span');
  });

  it('should allow custom component type', () => {
    render(
      <EnglishText as="div" data-testid="english-text">
        Queue Management Actions
      </EnglishText>
    );

    const englishText = screen.getByTestId('english-text');
    expect(englishText.tagName.toLowerCase()).toBe('div');
  });

  it('should apply custom className while maintaining LTR direction', () => {
    render(
      <EnglishText className="font-bold" data-testid="english-text">
        Queue Management Actions
      </EnglishText>
    );

    const englishText = screen.getByTestId('english-text');
    expect(englishText).toHaveClass('font-bold');
    expect(englishText).toHaveClass('text-left');
    expect(englishText).toHaveAttribute('dir', 'ltr');
  });

  it('should work correctly in RTL interface context', () => {
    // Simulate RTL interface
    document.documentElement.dir = 'rtl';
    
    render(
      <div className="flex flex-row-reverse">
        <span>Icon</span>
        <EnglishText data-testid="english-text">
          Queue Management Actions
        </EnglishText>
      </div>
    );

    const englishText = screen.getByTestId('english-text');
    
    // English text should remain LTR even in RTL interface
    expect(englishText).toHaveAttribute('dir', 'ltr');
    expect(englishText).toHaveClass('text-left');
    
    // Cleanup
    document.documentElement.dir = 'ltr';
  });
}); 