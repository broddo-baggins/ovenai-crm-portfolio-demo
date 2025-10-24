import { describe, test, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

/**
 * React API Safety Tests
 * 
 * Purpose: Ensure critical React APIs are available at runtime
 * Prevents: "undefined is not an object (evaluating 'Zt.forwardRef')" errors
 */

describe('🔬 React API Safety', () => {
  test('React.forwardRef should be available and functional', () => {
    expect(React.forwardRef).toBeDefined();
    expect(typeof React.forwardRef).toBe('function');

    // Test that forwardRef actually works
    const TestComponent = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
      (props, ref) => <div ref={ref} data-testid="forwarded-ref">{props.children}</div>
    );

    const { getByTestId } = render(<TestComponent>Test</TestComponent>);
    expect(getByTestId('forwarded-ref')).toBeInTheDocument();
  });

  test('Essential React APIs should be available', () => {
    const essentialAPIs = [
      'createElement',
      'Component',
      'PureComponent', 
      'createContext',
      'useState',
      'useEffect',
      'useCallback',
      'useMemo',
      'useRef',
      'forwardRef',
      'Fragment',
      'StrictMode'
    ];

    essentialAPIs.forEach(api => {
      expect(React[api as keyof typeof React]).toBeDefined();
    });
  });

  test('React hooks should work correctly', () => {
    const TestHooksComponent = () => {
      const [count, setCount] = React.useState(0);
      const ref = React.useRef<HTMLDivElement>(null);
      
      React.useEffect(() => {
        if (ref.current) {
          ref.current.setAttribute('data-count', count.toString());
        }
      }, [count]);

      const increment = React.useCallback(() => {
        setCount(prev => prev + 1);
      }, []);

      const memoizedValue = React.useMemo(() => count * 2, [count]);

      return (
        <div ref={ref} data-testid="hooks-test">
          <span data-testid="count">{count}</span>
          <span data-testid="memoized">{memoizedValue}</span>
          <button onClick={increment} data-testid="increment">+</button>
        </div>
      );
    };

    const { getByTestId } = render(<TestHooksComponent />);
    
    expect(getByTestId('count')).toHaveTextContent('0');
    expect(getByTestId('memoized')).toHaveTextContent('0');
    expect(getByTestId('hooks-test')).toBeInTheDocument();
  });

  test('React context should work correctly', () => {
    const TestContext = React.createContext<string>('default');
    
    const Provider = ({ children }: { children: React.ReactNode }) => (
      <TestContext.Provider value="test-value">
        {children}
      </TestContext.Provider>
    );

    const Consumer = () => {
      const value = React.useContext(TestContext);
      return <div data-testid="context-value">{value}</div>;
    };

    const { getByTestId } = render(
      <Provider>
        <Consumer />
      </Provider>
    );

    expect(getByTestId('context-value')).toHaveTextContent('test-value');
  });

  test('React.Fragment should render correctly', () => {
    const FragmentComponent = () => (
      <React.Fragment>
        <div data-testid="first">First</div>
        <div data-testid="second">Second</div>
      </React.Fragment>
    );

    const { getByTestId } = render(<FragmentComponent />);
    
    expect(getByTestId('first')).toBeInTheDocument();
    expect(getByTestId('second')).toBeInTheDocument();
  });

  test('React components should mount and unmount cleanly', () => {
    let mounted = false;
    let unmounted = false;

    const TestComponent = () => {
      React.useEffect(() => {
        mounted = true;
        return () => {
          unmounted = true;
        };
      }, []);

      return <div data-testid="mount-test">Mounted</div>;
    };

    const { getByTestId, unmount } = render(<TestComponent />);
    
    expect(getByTestId('mount-test')).toBeInTheDocument();
    expect(mounted).toBe(true);
    
    unmount();
    expect(unmounted).toBe(true);
  });
}); 