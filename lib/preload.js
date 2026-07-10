// Keyingi savol rasmlarini oldindan yuklab qo'yamiz (brauzer keshiga tushadi).
// Savolga o'tilganda rasm allaqachon tayyor bo'ladi — sekin internetda ham silliq.
export function preloadImages(urls) {
  if (typeof window === 'undefined') return;
  for (const u of urls) {
    if (!u) continue;
    const img = new Image();
    img.src = u;
  }
}
