module.exports = function normalizePlate(str) {
  if (!str) return '';
  return str.replace(/[^0-9A-Z]/gi, '').toUpperCase();
};
