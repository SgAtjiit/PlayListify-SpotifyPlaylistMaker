// Avatar utility to generate consistent avatars based on first letter
export const getAvatarUrl = (user) => {
  if (user?.photoURL) {
    return user.photoURL;
  }
  
  // Get first letter of display name or email
  const name = user?.displayName || user?.email || 'User';
  const firstLetter = name.charAt(0).toUpperCase();
  
  // Use a consistent avatar service with just the first letter
  return `https://ui-avatars.com/api/?name=${firstLetter}&background=22c55e&color=000&size=200&bold=true`;
};

// Alternative function if you prefer the Iran service
export const getAvatarUrlIran = (user) => {
  if (user?.photoURL) {
    return user.photoURL;
  }
  
  const name = user?.displayName || user?.email || 'User';
  const firstLetter = name.charAt(0).toUpperCase();
  
  return `https://avatar.iran.liara.run/username?username=${firstLetter}`;
};