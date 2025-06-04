export interface NavLinkItem {
  label: string;
  path: string;
}

export interface NewsItem {
  id: string;
  date: string;
  title: string;
  content: string;
}

export interface AwardItem {
  id: string;
  year: string;
  name: string;
  institution?: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  field: string;
  institution: string;
  year: string;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface Publication {
  id: string;
  type: 'Journal' | 'Conference' | 'Book' | 'Book Chapter';
  authors: string;
  title: string;
  source: string;
  year: number;
  doi?: string;
  url?: string;
  pdfUrl?: string;
  bibtex?: string;
}

export interface ResearchProject {
  id: string;
  status: 'Ongoing' | 'Completed';
  name: string;
  role: string;
  funding?: string;
  period: string;
  goals: string;
  outcomes?: string;
}

export interface Course {
  id: string;
  name: string;
  code?: string;
  semester: string;
  description?: string;
  syllabusUrl?: string;
}

export interface AcademicActivity {
  id: string;
  type: 'Invited Talk' | 'Conference Oral Presentation' | 'Poster Presentation' | 'Conference Attendance' | 'Seminar/Workshop' | 'Public Lecture';
  title?: string; // For presentations/talks
  eventName: string; // Conference name, institution, etc.
  location: string;
  date: string;
  role?: string; // e.g., Organizer, Attendee
  description?: string;
  slidesUrl?: string;
  posterUrl?: string;
  imageUrl?: string; // For main carousel on activities page
}

export interface CarouselSlide {
  id: string;
  imageUrl: string;
  caption: string;
  alt: string;
  activityDetails?: AcademicActivity; // Optional: link slide to specific activity
}

export interface ServiceItem {
  id: string;
  type: 'Journal Reviewing' | 'Conference Reviewing' | 'Editorial Role' | 'Committee Service' | 'Conference Organization' | 'Student Mentoring' | 'Academic Outreach';
  details: string; // e.g., Journal Name, Conference Name, Role description
  period?: string;
}

export type ExternalLinkCategory = 
  | 'Academic Profile' 
  | 'Professional Affiliation' 
  | 'Collaboration/Lab' 
  | 'Other Resource'
  | '文本生成與輔助 (Text Generation & LLM Assistance)'
  | 'AI 影音圖像生成 (AI Multimedia Generation)'
  | 'AI 學術應用與研究資源 (AI in Academic Applications & Research)'
  | 'GAI/AI 輔助學習與教學平台 (GAI/AI-Assisted Learning & Teaching Platforms)';

export interface ExternalLink {
  id: string;
  name: string;
  url: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  category: ExternalLinkCategory;
  subCategory?: string; // Added for finer-grained grouping
  description?: string;
}
