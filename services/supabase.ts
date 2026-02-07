
import { createClient } from '@supabase/supabase-js';

// استخدام الروابط مباشرة لتجنب أي مشاكل في قراءة متغيرات البيئة
const SUPABASE_URL = 'https://amxhaqifwezrqpexpbpc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFteGhhcWlmd2V6cnFwZXhwYnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTA4MDAsImV4cCI6MjA4NTkyNjgwMH0.-1d9XgOB8ff1NuUmwV20iNrWyjiaCZ1u0fbkoN75iKc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const uploadFile = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('uploads')
      .upload(fileName, file);

    if (error) {
      console.error('Upload Error:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (err) {
    console.error('Upload Exception:', err);
    return null;
  }
};
