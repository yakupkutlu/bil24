const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Resim yüklenemedi');
  }

  const data = await response.json();
  return data.url;
}
