function getCookie(name) {
  // Split cookie string into individual name-value pairs
  const cookies = document.cookie.split(';');
  
  // Loop through each cookie pair
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    
    // Check if this cookie has the name we want
    if (cookie.startsWith(name + '=')) {
      // Return the decoded value
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  // Return null if cookie is not found
  return null;
};

function setCookie(name, value, daysToLive) {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; SameSite=Lax; Secure;`;
    
    if (daysToLive) {
        const seconds = daysToLive * 24 * 60 * 60;
        cookieString += ` max-age=${seconds};`;
    }
    
    document.cookie = cookieString;
}