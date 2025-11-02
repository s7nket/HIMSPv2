// frontend/.eslintrc.js
module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    'react-hooks/exhaustive-deps': 'warn', // Change from error to warning
    'no-unused-vars': 'warn'
  }
};
