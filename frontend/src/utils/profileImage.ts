const fallbackImageByRole: Record<string, string> = {
  student: '/images/stunet/b1.jpg',
  teacher: '/images/techer/download.jfif',
  admin: '/images/admin/download.jfif',
  super_admin: '/images/admin/download (1).jfif',
  finance: '/images/manager/download.jfif',
  accountant: '/images/manager/download.jfif',
  owner: '/images/manager/images.jfif',
  branch_manager: '/images/manager/download (1).jfif',
  attendance: '/images/manager/download (2).jfif',
  role: '/images/admin/download (6).jfif',
  parent: '/images/manager/images (1).jfif',
  user: '/images/manager/images (2).jfif'
};

export function getApiOrigin() {
  const configuredBaseUrl = import.meta.env.VITE_API_URL;
  if (configuredBaseUrl) {
    try {
      return new URL(configuredBaseUrl).origin;
    } catch {
      return configuredBaseUrl.replace(/\/api\/?$/, '');
    }
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8081`;
  }

  return 'http://127.0.0.1:8081';
}

export function getRoleFallbackImage(role?: string | null) {
  if (!role) return '/images/manager/download.jfif';
  return fallbackImageByRole[role] ?? '/images/manager/download.jfif';
}

export function resolveProfileImage(profileImage?: string | null, role?: string | null) {
  if (!profileImage) {
    return getRoleFallbackImage(role);
  }

  if (profileImage.startsWith('http')) {
    return profileImage;
  }

  if (profileImage.startsWith('/images/')) {
    return profileImage;
  }

  const cleanPath = profileImage.replace(/^\/+/, '').replace(/^uploads\//, '');
  return `${getApiOrigin()}/uploads/${cleanPath}`;
}

export function applyProfileImageFallback(target: HTMLImageElement, role?: string | null) {
  target.onerror = null;
  target.src = getRoleFallbackImage(role);
}
