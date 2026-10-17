if (!process.env.REACT_APP_API_URL || !process.env.REACT_APP_API_URL.trim()) {
  console.error('Production build blocked: set REACT_APP_API_URL to the backend API base URL ending in /api.');
  process.exit(1);
}
