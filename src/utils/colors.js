export const RAINBOW_COLORS = {
  red: '#FFB3B3',
  orange: '#FFCCB3',
  yellow: '#FFFFB3',
  green: '#B3FFB3',
  mint: '#B3FFCC',
  cyan: '#B3FFFF',
  blue: '#B3E5FF',
  indigo: '#B3CCFF',
  purple: '#CCB3FF',
  pink: '#FFB3E6'
};

export const getRandomRainbowColor = () => {
  const colors = Object.values(RAINBOW_COLORS);
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getRainbowGradient = (colors = ['pink', 'purple', 'blue']) => {
  const colorValues = colors.map(color => RAINBOW_COLORS[color] || color);
  return `linear-gradient(135deg, ${colorValues.join(', ')})`;
};
