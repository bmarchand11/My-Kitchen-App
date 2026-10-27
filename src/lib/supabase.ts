import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from './database.types';

// The publishable key is meant to ship inside the app; row level security in
// supabase/migrations is what keeps each household's food private.
const SUPABASE_URL = 'https://bxzfrzlnpvwnxnpderlg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_hpTJaXEQaXoFH7x4dS6XxQ_ejtFNw7m';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Only refresh the sign-in token while the app is open, as Supabase recommends for mobile.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
