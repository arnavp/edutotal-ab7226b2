import { supabaseAdmin } from '@/lib/supabase';
import type {
  Service,
  ServiceCategory,
  Industry,
  Insight,
  TeamMember,
  Client,
  Testimonial,
  Career,
  ContactSubmission,
  HeroBanner,
  SiteSettings,
  GalleryImage,
  User,
  AppRole,
} from '@/types';

export class DatabaseService {
  private supabase = supabaseAdmin;

  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    const { data: authUser } = await this.supabase.auth.admin.getUserById(userId);
    if (!authUser.user) return null;

    return {
      id: authUser.user.id,
      email: authUser.user.email!,
      role: data.role as AppRole,
      created_at: authUser.user.created_at,
      updated_at: authUser.user.updated_at || authUser.user.created_at,
    };
  }

  async getUserRole(userId: string): Promise<AppRole | null> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data.role as AppRole;
  }

  async setUserRole(userId: string, role: AppRole): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id' });

    return !error;
  }

  async removeUserRole(userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    return !error;
  }

  async getAllUsers(): Promise<User[]> {
    const { data: users, error: usersError } = await this.supabase.auth.admin.listUsers();
    if (usersError || !users) return [];

    const { data: roles, error: rolesError } = await this.supabase
      .from('user_roles')
      .select('user_id, role');

    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

    return users.users.map(u => ({
      id: u.id,
      email: u.email!,
      role: (roleMap.get(u.id) as AppRole) || 'viewer',
      created_at: u.created_at,
      updated_at: u.updated_at || u.created_at,
    }));
  }

  async createUser(email: string, password: string, role: AppRole = 'viewer'): Promise<{ user: User | null; error: string | null }> {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      return { user: null, error: error?.message || 'Failed to create user' };
    }

    const { error: roleError } = await this.supabase
      .from('user_roles')
      .insert({ user_id: data.user.id, role });

    if (roleError) {
      await this.supabase.auth.admin.deleteUser(data.user.id);
      return { user: null, error: roleError.message };
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        role,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
      },
      error: null,
    };
  }

  async updateUser(userId: string, updates: { email?: string; password?: string }): Promise<{ user: User | null; error: string | null }> {
    const { data, error } = await this.supabase.auth.admin.updateUserById(userId, updates);

    if (error || !data.user) {
      return { user: null, error: error?.message || 'Failed to update user' };
    }

    const { data: roleData } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        role: (roleData?.role as AppRole) || 'viewer',
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
      },
      error: null,
    };
  }

  async deleteUser(userId: string): Promise<{ error: string | null }> {
    await this.supabase.from('user_roles').delete().eq('user_id', userId);
    const { error } = await this.supabase.auth.admin.deleteUser(userId);
    return { error: error?.message || null };
  }

  async signIn(email: string, password: string): Promise<{ session: { access_token: string; user: User } | null; error: string | null }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      return { session: null, error: error?.message || 'Invalid credentials' };
    }

    const role = await this.getUserRole(data.user.id);

    return {
      session: {
        access_token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: role || 'viewer',
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || data.user.created_at,
        },
      },
      error: null,
    };
  }

  async signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    const redirectUrl = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/`;
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });

    if (error || !data.user) {
      return { user: null, error: error?.message || 'Sign up failed' };
    }

    const { error: roleError } = await this.supabase
      .from('user_roles')
      .insert({ user_id: data.user.id, role: 'viewer' });

    if (roleError) {
      return { user: null, error: roleError.message };
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        role: 'viewer',
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
      },
      error: null,
    };
  }

  async getServices(params?: { published?: boolean; category?: string; limit?: number; offset?: number }): Promise<Service[]> {
    let query = this.supabase.from('services').select('*');

    if (params?.published !== undefined) {
      query = query.eq('published', params.published);
    }
    if (params?.category) {
      query = query.eq('category', params.category);
    }
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    query = query.order('order_index', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getServiceById(id: string): Promise<Service | null> {
    const { data, error } = await this.supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getServiceBySlug(slug: string): Promise<Service | null> {
    const { data, error } = await this.supabase
      .from('services')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data;
  }

  async createService(service: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service> {
    const { data, error } = await this.supabase
      .from('services')
      .insert(service)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateService(id: string, updates: Partial<Service>): Promise<Service | null> {
    const { data, error } = await this.supabase
      .from('services')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async deleteService(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('services').delete().eq('id', id);
    return !error;
  }

  async getServiceCategories(params?: { published?: boolean }): Promise<ServiceCategory[]> {
    let query = this.supabase.from('service_categories').select('*');

    if (params?.published !== undefined) {
      query = query.eq('published', params.published);
    }

    query = query.order('order_index', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createServiceCategory(category: Omit<ServiceCategory, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceCategory> {
    const { data, error } = await this.supabase
      .from('service_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateServiceCategory(id: string, updates: Partial<ServiceCategory>): Promise<ServiceCategory | null> {
    const { data, error } = await this.supabase
      .from('service_categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async deleteServiceCategory(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('service_categories').delete().eq('id', id);
    return !error;
  }

  async getIndustries(params?: { published?: boolean; limit?: number; offset?: number }): Promise<Industry[]> {
    let query = this.supabase.from('industries').select('*');

    if (params?.published !== undefined) {
      query = query.eq('published', params.published);
    }
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    query = query.order('order_index', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getIndustryById(id: string): Promise<Industry | null> {
    const { data, error } = await this.supabase
      .from('industries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getIndustryBySlug(slug: string): Promise<Industry | null> {
    const { data, error } = await this.supabase
      .from('industries')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data;
  }

  async createIndustry(industry: Omit<Industry, 'id' | 'created_at' | 'updated_at'>): Promise<Industry> {
    const { data, error } = await this.supabase
      .from('industries')
      .insert(industry)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateIndustry(id: string, updates: Partial<Industry>): Promise<Industry | null> {
    const { data, error } = await this.supabase
      .from('industries')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async deleteIndustry(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('industries').delete().eq('id', id);
    return !error;
  }

  async getIndustryServices(industryId: string): Promise<Service[]> {
    const { data, error } = await this.supabase
      .from('industry_services')
      .select('service_id')
      .eq('industry_id', industryId);

    if (error || !data) return [];

    const serviceIds = data.map(d => d.service_id);
    const { data: services, error: servicesError } = await this.supabase
      .from('services')
      .select('*')
      .in('id', serviceIds);

    if (servicesError) return [];
    return services || [];
  }

  async addIndustryService(industryId: string, serviceId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('industry_services')
      .insert({ industry_id: industryId, service_id: serviceId });

    return !error;
  }

  async removeIndustryService(industryId: string, serviceId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('industry_services')
      .delete()
      .eq('industry_id', industryId)
      .eq('service_id', serviceId);

    return !error;
  }

  async getInsights(params?: { published?: boolean; featured?: boolean; type?: string; limit?: number; offset?: number }): Promise<Insight[]> {
    let query = this.supabase.from('insights').select('*');

    if (params?.published !== undefined) {
      query = query.eq('published', params.published);
    }
    if (params?.featured !== undefined) {
      query = query.eq('featured', params.featured);
    }
    if (params?.type) {
      query = query.eq('type', params.type);
    }
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    query = query.order('publish_date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getInsightById(id: string): Promise<Insight | null> {
    const { data, error } = await this.supabase
      .from('insights')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getInsightBySlug(slug: string): Promise<Insight | null> {
    const { data, error } = await this.supabase
      .from('insights')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data;
  }

  async createInsight(insight: Omit<Insight, 'id' | 'created_at' | 'updated_at'>): Promise<Insight> {
    const { data, error } = await this.supabase
      .from('insights')
      .insert(insight)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateInsight(id: string, updates: Partial<Insight>): Promise<Insight | null> {
    const { data, error } = await this.supabase
      .from('insights')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async deleteInsight(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('insights').delete().eq('id', id);
    return !error;
  }

  async getTeamMembers(params?: { published?: boolean; category?: string }): Promise<TeamMember[]> {
    let query = this.supabase.from('team_members').select('*');

    if (params?.published !== undefined) {
      query = query.eq('published', params.published);
    }
    if (params?.category) {
      query = query.eq('category', params.category);
    }

    query = query.order('order_index', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createTeamMember(member: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>): Promise<TeamMember> {
    const { data, error } = await this.supabase
      .from('team_members')
      .insert(member)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | null> {
    const { data, error } = await this.supabase
      .from('team_members')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('team_members').delete().eq('id', id);
    return !error;
  }

  async getClients(params?: { published?: boolean }): Promise<Client[]> {
    let query = this.supabase.from('clients').select('*');

    if (params?.published !== undefined) {
      query = query.eq('published', params.published);
    }

    query = query.order('order_index', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const { data, error } = await this.supabase
      .from('clients')
      .insert(client)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    const { data, error } = await this.supabase
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async deleteClient(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('clients').delete().eq('id', id);
    return !error;
  }

  async getTestimonials(params?: { published?: boolean }): Promise<Testimonial[]> {
    let query = this.supabase.from('testimonials').select('*');

    if (params?.published !== undefined) {
      query = query.eq('published', params.published);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createTestimonial(testimonial: Omit<Testimonial, 'id' | 'created_at' | 'updated_at'>): Promise<Testimonial> {
    const { data, error } = await this.supabase
      .from('testimonials')
      .insert(testimonial)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTestimonial(id: string, updates: Partial<Testimonial>): Promise<Testimonial | null> {
    const { data, error } = await this.supabase
      .from('testimonials')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async deleteTestimonial(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('testimonials').delete().eq('id', id);
    return !error;
  }

  async getCareers(params?: { published?: boolean }): Promise<Career[]> {
    let query = this.supabase.from('careers').select('*');

    if (params?.published !== undefined) {
      query = query.eq('published', params.published);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createCareer(career: Omit<Career, 'id' | 'created_at' | 'updated_at'>): Promise<Career> {
    const { data, error } = await this.supabase
      .from('careers')
      .insert(career)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCareer(id: string, updates: Partial<Career>): Promise<Career | null> {
    const { data, error } = await this.supabase
      .from('careers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async deleteCareer(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('careers').delete().eq('id', id);
    return !error;
  }

  async getContactSubmissions(params?: { limit?: number; offset?: number }): Promise<ContactSubmission[]> {
    let query = this.supabase.from('contact_submissions').select('*').order('created_at', { ascending: false });

    if (params?.limit) {
      query = query.limit(params.limit);
    }
    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createContactSubmission(submission: Omit<ContactSubmission, 'id' | 'created_at'>): Promise<ContactSubmission> {
    const { data, error } = await this.supabase
      .from('contact_submissions')
      .insert(submission)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getHeroBanners(params?: { pageKey?: string }): Promise<HeroBanner[]> {
    let query = this.supabase.from('hero_banners').select('*');

    if (params?.pageKey) {
      query = query.eq('page_key', params.pageKey);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createHeroBanner(banner: Omit<HeroBanner, 'id' | 'created_at' | 'updated_at'>): Promise<HeroBanner> {
    const { data, error } = await this.supabase
      .from('hero_banners')
      .insert(banner)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateHeroBanner(id: string, updates: Partial<HeroBanner>): Promise<HeroBanner | null> {
    const { data, error } = await this.supabase
      .from('hero_banners')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async deleteHeroBanner(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('hero_banners').delete().eq('id', id);
    return !error;
  }

  async getSiteSettings(): Promise<SiteSettings | null> {
    const { data, error } = await this.supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }

  async updateSiteSettings(updates: Partial<SiteSettings>): Promise<SiteSettings | null> {
    const { data, error } = await this.supabase
      .from('site_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', (await this.getSiteSettings())?.id || '')
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async getGalleryImages(params?: { published?: boolean }): Promise<GalleryImage[]> {
    let query = this.supabase.from('gallery_images').select('*');

    if (params?.published !== undefined) {
      query = query.eq('published', params.published);
    }

    query = query.order('order_index', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createGalleryImage(image: Omit<GalleryImage, 'id' | 'created_at' | 'updated_at'>): Promise<GalleryImage> {
    const { data, error } = await this.supabase
      .from('gallery_images')
      .insert(image)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateGalleryImage(id: string, updates: Partial<GalleryImage>): Promise<GalleryImage | null> {
    const { data, error } = await this.supabase
      .from('gallery_images')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async deleteGalleryImage(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('gallery_images').delete().eq('id', id);
    return !error;
  }
}

export const db = new DatabaseService();