import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import Sitemap from 'vite-plugin-sitemap';
import { createClient } from '@supabase/supabase-js';

async function getDynamicRoutes(env: Record<string, string>) {
  const staticRoutes = [
    '/',
    '/dashboard',
    '/profile',
    '/feed',
    '/events',
    '/agenda',
    '/artists',
    '/venues',
  ];

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not available, using static routes only');
    return staticRoutes;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [eventsRes, artistsRes, venuesRes] = await Promise.all([
      supabase.from('events').select('slug, updated_at').eq('status', 'approved').limit(500),
      supabase.from('artists').select('slug, updated_at').eq('status', 'approved').limit(500),
      supabase.from('venues').select('slug, updated_at').eq('status', 'approved').limit(500),
    ]);

    const dynamicRoutes: Array<{ url: string; lastmod?: number; priority?: number }> = [];

    if (eventsRes.data) {
      eventsRes.data.forEach(event => {
        dynamicRoutes.push({
          url: `/events/${event.slug}`,
          lastmod: event.updated_at ? new Date(event.updated_at).getTime() : Date.now(),
          priority: 0.8,
        });
      });
    }

    if (artistsRes.data) {
      artistsRes.data.forEach(artist => {
        dynamicRoutes.push({
          url: `/artists/${artist.slug}`,
          lastmod: artist.updated_at ? new Date(artist.updated_at).getTime() : Date.now(),
          priority: 0.7,
        });
      });
    }

    if (venuesRes.data) {
      venuesRes.data.forEach(venue => {
        dynamicRoutes.push({
          url: `/venues/${venue.slug}`,
          lastmod: venue.updated_at ? new Date(venue.updated_at).getTime() : Date.now(),
          priority: 0.7,
        });
      });
    }

    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.warn('Failed to fetch dynamic routes for sitemap:', error);
    return staticRoutes;
  }
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const routes = await getDynamicRoutes(env);

  return {
    plugins: [
      react(),
      Sitemap({
        hostname: 'https://785mag.com',
        dynamicRoutes: routes,
        changefreq: 'daily',
        priority: 0.9,
        lastmod: Date.now(),
      }),
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'supabase-vendor': ['@supabase/supabase-js'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      headers: {
        'Cache-Control': 'public, max-age=0',
      },
    },
  };
});
