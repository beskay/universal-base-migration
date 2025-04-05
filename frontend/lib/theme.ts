// Theme colors
export const colors = {
  primary: '#3B82F6', // Blue
  primaryHover: '#2563EB',
  secondary: '#10B981', // Emerald
  secondaryHover: '#059669',
  accent: '#3B82F6', // Blue
  accentHover: '#2563EB',
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
};

// Button styles
export const buttonStyles = {
  primary: `bg-[${colors.primary}] hover:bg-[${colors.primaryHover}] text-white`,
  secondary: `bg-[${colors.secondary}] hover:bg-[${colors.secondaryHover}] text-white`,
  accent: `bg-[${colors.accent}] hover:bg-[${colors.accentHover}] text-white`,
  outline: `bg-transparent border border-[${colors.primary}] text-[${colors.primary}] hover:bg-[${colors.primary}] hover:text-white`,
  disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed',
};

// Card styles
export const cardStyles = {
  default: `bg-[${colors.card}] border border-[${colors.border}] rounded-xl shadow-sm p-6`,
  hover: `hover:shadow-md transition-shadow duration-200`,
};

// Typography
export const typography = {
  heading1: 'text-4xl font-bold',
  heading2: 'text-3xl font-bold',
  heading3: 'text-2xl font-bold',
  subtitle: 'text-xl text-gray-600',
  body: 'text-base',
  small: 'text-sm',
};

// Animations
export const animations = {
  fadeIn: 'animate-fadeIn',
  slideIn: 'animate-slideIn',
  pulse: 'animate-pulse',
};

// Layout
export const layout = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-12',
};

// Export default theme
export default {
  colors,
  buttonStyles,
  cardStyles,
  typography,
  animations,
  layout,
}; 