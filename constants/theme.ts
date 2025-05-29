export const COLORS = {
primaryOrange: '#FFA500',
primaryBlack: '#1E1E1E',
secondaryOrange: '#FFC04D',
secondaryBlack: '#333333',

white: '#FFFFFF',
lightGray: '#F5F5F5',
mediumGray: '#A9A9A9',
darkGray: '#484848',

success: '#4CAF50',
error: '#F44336',
warning: '#FFEB3B',
} as const; // Using "as const" provides better type inference for exact values

export const SIZES = {
base: 8,
font: 14,
radius: 12,
padding: 24,
padding2: 32,

largeTitle: 40,
h1: 30,
h2: 22,
h3: 16,
h4: 14,
body1: 30,
body2: 22,
body3: 16,
body4: 14,
body5: 12,
} as const;

// For FONTS, if you were to define specific font styles:
// interface FontStyle {
//   fontFamily: string;
//   fontSize: number;
//   lineHeight?: number;
// }
// export const FONTS: { [key: string]: FontStyle } = {
//   h1: { fontFamily: 'YourFont-Bold', fontSize: SIZES.h1, lineHeight: 36 },
//   // ... other font styles
// };

// If you don't have custom fonts yet, you can omit FONTS or keep it simple.
export const FONTS = {} as const;


const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;