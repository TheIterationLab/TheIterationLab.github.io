// Public Supabase & Contact Configuration for The Iteration Lab
export const SUPABASE_URL = 'https://khewlpzdjbdlpqfnqplt.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZXdscHpkamJkbHBxZm5xcGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2ODA2MTgsImV4cCI6MjEwODI1NjYxOH0.GdKBFPXuZ1NacefESgx6YX7FKvnWqGibiQDPteKGGeQ';

// Founder links & WhatsApp contact
export const FOUNDER_LEADER_CID = 'a370517e-ec1a-4257-9677-9293f6bd8d6b';
export const FOUNDER_LEADER_DETAIL_URL = `/leaders/?id=${FOUNDER_LEADER_CID}`;
export const FOUNDER_PORTFOLIO_URL = 'https://ikramulhoque-arik.github.io';
export const FOUNDER_PROFILE_URL = '/profile/S/ikramulhoquearik';
export const WHATSAPP_URL = 'https://wa.me/TheIterationLab';
export const WHATSAPP_NUMBER = 'TheIterationLab';
export const LEADER_APPLICATION_MESSAGE =
  'Hello The Iteration Lab! I want to be a hardworking, motivated leader of your platform.';
export const LEADER_APPLICATION_WHATSAPP_URL = `${WHATSAPP_URL}?text=${encodeURIComponent(
  LEADER_APPLICATION_MESSAGE
)}`;

// Default local image folders when Supabase stores filenames only (e.g. "Arik.webp")
export const IMAGE_DIRS = {
  leaders: '/leaders/img/',
  students: '/students/img/',
  teachers: '/teachers/img/',
  institutes: '/institutes/img/',
  researches: '/researches/img/',
  softwares: '/softwares/img/',
  communities: '/communities/img/'
};
