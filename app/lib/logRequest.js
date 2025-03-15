// Patch fetch to log all requests
const originalFetch = window.fetch;

window.fetch = function(...args) {
  const url = args[0];
  const options = args[1] || {};
  
  console.log('Request URL:', url);
  console.log('Request Method:', options.method || 'GET');
  console.log('Request Headers:', options.headers);
  console.log('Request Body:', options.body);
  
  return originalFetch.apply(this, args)
    .then(response => {
      // Clone the response so we can log it and still return the original
      const clone = response.clone();
      clone.text().then(text => {
        console.log('Response Status:', response.status);
        console.log('Response Text:', text.substring(0, 1000) + (text.length > 1000 ? '...' : ''));
      });
      return response;
    })
    .catch(error => {
      console.error('Fetch Error:', error);
      throw error;
    });
};

console.log('Fetch logging enabled'); 