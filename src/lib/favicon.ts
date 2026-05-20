import { db } from './db';

export async function updateDynamicFavicon() {
  try {
    const settings = await db.storeSettings.toCollection().first();
    if (settings && settings.logo) {
      const logoUrl = settings.logo;

      // Update regular favicon
      const iconLinks = document.querySelectorAll("link[rel*='icon']");
      if (iconLinks.length > 0) {
        iconLinks.forEach((link) => {
          (link as HTMLLinkElement).href = logoUrl;
        });
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = logoUrl;
        document.head.appendChild(link);
      }

      // Update apple-touch-icon
      let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (appleIcon) {
        appleIcon.href = logoUrl;
      } else {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        appleIcon.href = logoUrl;
        document.head.appendChild(appleIcon);
      }
    }
  } catch (err) {
    console.error('Failed to update dynamic favicon:', err);
  }
}
