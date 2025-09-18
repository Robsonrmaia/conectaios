export default {
  '*.{ts,tsx}': [
    'eslint --fix',
    'tsc --noEmit --project tsconfig.json --skipLibCheck'
  ],
  '*.{ts,tsx,js,jsx,json,css,md}': [
    'prettier --write'
  ]
};