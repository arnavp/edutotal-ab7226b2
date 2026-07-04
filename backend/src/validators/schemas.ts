import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'editor', 'viewer']).default('viewer'),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const serviceCategorySchema = z.object({
  category_key: z.string().min(1, 'Category key is required'),
  display_name: z.string().min(1, 'Display name is required'),
  label: z.string().min(1, 'Label is required'),
  description: z.string().nullable().optional(),
  icon_key: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  order_index: z.number().int().default(0),
  published: z.boolean().default(true),
});

export const serviceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  overview: z.string().min(1, 'Overview is required'),
  category: z.string().min(1, 'Category is required'),
  icon_key: z.string().nullable().optional(),
  approach: z.unknown().nullable().optional(),
  domestic_expertise: z.string().nullable().optional(),
  international_expertise: z.string().nullable().optional(),
  benefits: z.unknown().nullable().optional(),
  order_index: z.number().int().default(0),
  published: z.boolean().default(true),
});

export const industrySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  focus_areas: z.unknown().nullable().optional(),
  icon_key: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  order_index: z.number().int().default(0),
  published: z.boolean().default(true),
  tagline: z.string().nullable().optional(),
  content_box: z.string().nullable().optional(),
  how_we_support: z.string().nullable().optional(),
  whats_happening: z.unknown().nullable().optional(),
});

export const insightSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  type: z.enum(['Thought Leadership', 'Case Study', 'Whitepaper', 'Blog', 'Event']),
  excerpt: z.string().min(1, 'Excerpt is required'),
  body: z.string().min(1, 'Body is required'),
  cover_image_url: z.string().url().nullable().optional(),
  author: z.string().nullable().optional(),
  publish_date: z.string().nullable().optional(),
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
  order_index: z.number().int().default(0),
  tags: z.array(z.string()).nullable().optional(),
});

export const teamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  designation: z.string().min(1, 'Designation is required'),
  biography: z.string().min(1, 'Biography is required'),
  photo_url: z.string().url().nullable().optional(),
  category: z.enum(['Leadership', 'Advisory', 'Staff', 'Team']),
  email: z.string().email().nullable().optional(),
  linkedin_url: z.string().url().nullable().optional(),
  order_index: z.number().int().default(0),
  published: z.boolean().default(true),
  show_email: z.boolean().nullable().optional(),
  show_linkedin: z.boolean().nullable().optional(),
});

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  logo_url: z.string().url().nullable().optional(),
  website: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  order_index: z.number().int().default(0),
  published: z.boolean().default(true),
});

export const testimonialSchema = z.object({
  quote: z.string().min(1, 'Quote is required'),
  author: z.string().min(1, 'Author is required'),
  role: z.string().nullable().optional(),
  organization: z.string().nullable().optional(),
  photo_url: z.string().url().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  published: z.boolean().default(true),
});

export const careerSchema = z.object({
  job_title: z.string().min(1, 'Job title is required'),
  description: z.string().min(1, 'Description is required'),
  responsibilities: z.unknown().nullable().optional(),
  qualifications: z.unknown().nullable().optional(),
  location: z.string().nullable().optional(),
  apply_email: z.string().email('Invalid email format'),
  published: z.boolean().default(true),
});

export const contactSubmissionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().nullable().optional(),
  message: z.string().min(1, 'Message is required'),
  service_interest: z.string().nullable().optional(),
});

export const heroBannerSchema = z.object({
  page_key: z.string().min(1, 'Page key is required'),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().nullable().optional(),
  background_image_url: z.string().url().nullable().optional(),
  cta_primary_text: z.string().nullable().optional(),
  cta_primary_link: z.string().nullable().optional(),
  cta_secondary_text: z.string().nullable().optional(),
  cta_secondary_link: z.string().nullable().optional(),
});

export const siteSettingsSchema = z.object({
  logo_url: z.string().url().nullable().optional(),
  tagline: z.string().min(1, 'Tagline is required'),
  contact_email: z.string().email().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  contact_address: z.string().nullable().optional(),
  social_facebook: z.string().url().nullable().optional(),
  social_instagram: z.string().url().nullable().optional(),
  social_linkedin: z.string().url().nullable().optional(),
  social_twitter: z.string().url().nullable().optional(),
  social_youtube: z.string().url().nullable().optional(),
  social_links: z.unknown().nullable().optional(),
  primary_color: z.string().nullable().optional(),
  accent_color: z.string().nullable().optional(),
  business_hours: z.string().nullable().optional(),
  careers_email: z.string().email().nullable().optional(),
});

export const galleryImageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  caption: z.string().nullable().optional(),
  image_url: z.string().url('Image URL is required'),
  order_index: z.number().int().default(0),
  published: z.boolean().default(true),
});