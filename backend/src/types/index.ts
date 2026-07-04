export type AppRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ServiceCategory {
  id: string;
  category_key: string;
  display_name: string;
  label: string;
  description: string | null;
  icon_key: string | null;
  image_url: string | null;
  order_index: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  overview: string;
  category: string;
  icon_key: string | null;
  approach: unknown;
  domestic_expertise: string | null;
  international_expertise: string | null;
  benefits: unknown;
  order_index: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Industry {
  id: string;
  title: string;
  slug: string;
  description: string;
  focus_areas: unknown;
  icon_key: string | null;
  order_index: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Insight {
  id: string;
  title: string;
  slug: string;
  type: string;
  excerpt: string;
  body: string;
  cover_image_url: string | null;
  author: string | null;
  publish_date: string | null;
  published: boolean;
  featured: boolean;
  order_index: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  designation: string;
  biography: string;
  photo_url: string | null;
  category: string;
  email: string | null;
  linkedin_url: string | null;
  order_index: number;
  published: boolean;
  show_email: boolean | null;
  show_linkedin: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  order_index: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string | null;
  organization: string | null;
  photo_url: string | null;
  logo_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Career {
  id: string;
  job_title: string;
  description: string;
  responsibilities: unknown;
  qualifications: unknown;
  location: string | null;
  apply_email: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  service_interest: string | null;
  created_at: string;
}

export interface HeroBanner {
  id: string;
  page_key: string;
  title: string;
  subtitle: string | null;
  background_image_url: string | null;
  cta_primary_text: string | null;
  cta_primary_link: string | null;
  cta_secondary_text: string | null;
  cta_secondary_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  logo_url: string | null;
  tagline: string;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_twitter: string | null;
  social_youtube: string | null;
  social_links: unknown;
  primary_color: string | null;
  accent_color: string | null;
  business_hours: string | null;
  careers_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  caption: string | null;
  image_url: string;
  order_index: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}