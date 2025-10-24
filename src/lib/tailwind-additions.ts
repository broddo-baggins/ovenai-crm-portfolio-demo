// This is a file to keep additional Tailwind configurations that can be imported into the main config

export const tailwindAdditions = {
  keyframes: {
    ripple: {
      '0%': { transform: 'scale(0)', opacity: '0.5' },
      '100%': { transform: 'scale(1)', opacity: '0' },
    },
  },
  animation: {
    ripple: 'ripple 0.6s linear forwards',
  },
  colors: {
    'temperature': {
      'cold': '#8E9196',
      'cool': '#D3E4FD',
      'warm': '#FEC6A1',
      'hot': '#ea384c',
    },
  },
};
