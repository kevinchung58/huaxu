import { NavLinkItem, SocialLink, NewsItem, AwardItem, EducationItem, Publication, ResearchProject, Course, AcademicActivity, CarouselSlide, ServiceItem, ExternalLink } from './types';
import { EmailIcon, GoogleScholarIcon, LinkIcon } from './components/icons'; // Removed GitHubIcon, XTwitterIcon, OrcidIcon, LinkedInIcon, ResearchGateIcon

export const NAVIGATION_LINKS: NavLinkItem[] = [
  { label: '首頁 (Home)', path: '/' },
  { label: '關於我 (About Me)', path: '/about' },
  { label: '研究成果 (Research)', path: '/research' },
  { label: '教學與實踐 (Teaching)', path: '/teaching' },
  { label: '學術活動 (Academic Activities)', path: '/activities' },
  { label: '學術服務與社群 (Academic Service & Community)', path: '/service' },
  { label: '資源連結 (Links)', path: '/links' },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { name: 'Email', url: 'mailto:your.email@example.com', icon: EmailIcon },
  { name: 'Google Scholar', url: 'https://scholar.google.com.tw/citations?user=JTwxPuEAAAAJ&hl=zh-TW', icon: GoogleScholarIcon },
];

export const LATEST_NEWS_DATA: NewsItem[] = [
  {
    id: 'news_gittens_2025',
    date: '2025-03-01', 
    title: 'New Publication Accepted!',
    content: 'Our paper "Technological Influence on Digital Banking Adoption: A Framework and Empirical Study of the Influence of Social Robots and IVAs in a Small Island Context" has been accepted for HCII 2025.'
  },
  {
    id: 'news_gazit_2025',
    date: '2025-02-15', 
    title: 'New Publication Accepted!',
    content: 'Our paper "The dark side of the interface: examining the influence of different background modes on cognitive performance" has been accepted in Ergonomics.'
  },
  {
    id: 'news_castaneda_2025',
    date: '2025-02-01', 
    title: 'New Publication Accepted!',
    content: 'Our paper "Designing inclusive tech playful educative solutions for visually impaired learners in STEM education" has been accepted in Smart Learning Environments.'
  },
];

const NA_STRING = "N/A";

export const AWARDS_DATA: AwardItem[] = [
  { id: 'award1', year: NA_STRING, name: NA_STRING, institution: NA_STRING },
  { id: 'award2', year: NA_STRING, name: NA_STRING, institution: NA_STRING },
  { id: 'award3', year: NA_STRING, name: NA_STRING, institution: NA_STRING },
];

export const EDUCATION_DATA: EducationItem[] = [
  {
    id: 'edu1',
    degree: '博士 (Ph.D.)',
    field: '工程科學系 (資訊與應用組) (Department of Engineering Science (Information and Application Group))',
    institution: '國立成功大學 (National Cheng Kung University)',
    year: '2019/9 - 2024/6' 
  },
  { 
    id: 'edu2', 
    degree: '碩士 (Master\'s)', 
    field: '數位學習設計與管理學系 (Department of e-Learning Design & Management)', 
    institution: '國立嘉義大學 (National Chiayi University)', 
    year: '2018/9 - 2019/1' 
  },
  { 
    id: 'edu3', 
    degree: '學士 (Bachelor\'s)', 
    field: '數位學習設計與管理學系 (Department of e-Learning Design & Management)', 
    institution: '國立嘉義大學 (National Chiayi University)', 
    year: '2014/9 - 2018/6' 
  },
];

export const PUBLICATIONS_DATA: Publication[] = [
  {
    id: 'pub1',
    type: 'Journal',
    authors: 'Lai, Chin-Feng; Zhong, Hua-Xu; Chiu, Po-Sheng',
    title: 'Investigating the impact of a flipped programming course using the DT-CDIO approach',
    source: 'Computers & Education, Vol. 173, p. 104287. Elsevier',
    year: 2021,
  },
  {
    id: 'pub2',
    type: 'Journal',
    authors: 'Huang, Po-Sen; Chiu, Po-Sheng; Huang, Yueh-Min; Zhong, Hua-Xu; Lai, Chin-Feng',
    title: 'Cooperative mobile learning for the investigation of natural science courses in elementary schools',
    source: 'Sustainability, Vol. 12, No. 16, p. 6606. MDPI',
    year: 2020,
  },
  {
    id: 'pub3',
    type: 'Journal',
    authors: 'Zhong, Hua-Xu; Chang, Jui-Hung; Lai, Chin-Feng; Chen, Pei-Wen; Ku, Shang-Hsuan; Chen, Shih-Yeh',
    title: 'Information undergraduate and non-information undergraduate on an artificial intelligence learning platform: an artificial intelligence assessment model using PLS-SEM analysis',
    source: 'Education and Information Technologies, Vol. 29, No. 4, pp. 4371-4400. Springer',
    year: 2024,
  },
  {
    id: 'pub4',
    type: 'Conference',
    authors: 'Zhong, Hua-Xu; Lai, Chin-Feng; Huang, Yu-Che; Wu, Pei-Hsuan; Chang, Jui-Hung',
    title: 'Exploring the impact of artificial intelligence learning platforms on interest in and attitudes toward learning',
    source: 'Innovative Technologies and Learning: 4th International Conference, ICITL 2021, Virtual Event, November 29–December 1, 2021, Proceedings 4, pp. 22-29. Springer',
    year: 2021,
  },
  {
    id: 'pub5',
    type: 'Journal',
    authors: 'Zhong, Hua-Xu; Lai, Chin-Feng; Chang, Jui-Hung; Chiu, Po-Sheng',
    title: 'Developing creative material in STEM courses using integrated engineering design based on APOS theory',
    source: 'International Journal of Technology and Design Education, Vol. 33, No. 4, pp. 1627-1651. Springer',
    year: 2023,
  },
  {
    id: 'pub6',
    type: 'Journal',
    authors: 'Lai, Chin-Feng; Zhong, Hua-Xu; Chiu, Po-Sheng; Pu, Ying-Hung',
    title: 'Development and evaluation of a cloud bookcase system for mobile library',
    source: 'Library Hi Tech, Vol. 39, No. 2, pp. 380-395. Emerald Publishing Limited',
    year: 2021,
  },
  {
    id: 'pub7',
    type: 'Journal',
    authors: 'Chang, Jui-Hung; Chiang, Hung-Hsi; Zhong, Hua-Xu; Chou, Yu-Kai',
    title: 'Travel package recommendation based on reinforcement learning and trip guaranteed prediction',
    source: 'Journal of Internet Technology, Vol. 22, No. 6, pp. 1359-1373.',
    year: 2021,
  },
  {
    id: 'pub8',
    type: 'Journal',
    authors: 'Jeng, Yu-Lin; Lai, Chin-Feng; Huang, Sheng-Bo; Chiu, Po-Sheng; Zhong, Hua-Xu',
    title: 'To cultivate creativity and a maker mindset through an internet-of-things programming course',
    source: 'Frontiers in Psychology, Vol. 11, p. 1572. Frontiers Media SA',
    year: 2020,
  },
  {
    id: 'pub9',
    type: 'Journal',
    authors: 'Chang, Jui-Hung; Wang, Chi-Jane; Zhong, Hua-Xu; Chen, Pei-Wen; Pan, Ai-Jou; Chiu, Po-Sheng',
    title: 'Implementation and evaluation of the school\'s COVID-19 prevention website',
    source: 'Library Hi Tech, Vol. 41, No. 1, pp. 71-90. Emerald Publishing Limited',
    year: 2023,
  },
  {
    id: 'pub10',
    type: 'Journal',
    authors: 'Zhong, Hua-Xu; Chiu, Po-Sheng; Lai, Chin-Feng',
    title: 'Effects of the use of CDIO engineering design in a flipped programming course on flow experience, cognitive load',
    source: 'Sustainability, Vol. 13, No. 3, p. 1381. MDPI',
    year: 2021,
  },
  {
    id: 'pub11',
    type: 'Journal',
    authors: 'Lai, Chin-Feng; Zhong, Hua-Xu; Chang, Jui-Hung; Chiu, Po-Sheng',
    title: 'Applying the DT-CDIO engineering design model in a flipped learning programming course',
    source: 'Educational technology research and development, Vol. 70, No. 3, pp. 823-847. Springer',
    year: 2022,
  },
  {
    id: 'pub12',
    type: 'Journal',
    authors: 'Wang, Chi-Jane; Zhong, Hua-Xu; Chiu, Po-Sheng; Chang, Jui-Hung; Wu, Pei-Hsuan',
    title: 'Research on the impacts of cognitive style and computational thinking on college students in a visual artificial intelligence course',
    source: 'Frontiers in Psychology, Vol. 13, p. 864416. Frontiers Media SA',
    year: 2022,
  },
  {
    id: 'pub13',
    type: 'Journal',
    authors: 'Chiu, Po-Sheng; Zhong, Hua-Xu; Lai, Chin-Feng',
    title: 'Investigating the effects of a programming course using flipped learning',
    source: 'Innovations in Education and Teaching International, Vol. 60, No. 4, pp. 578-590. Taylor & Francis',
    year: 2023,
  },
  {
    id: 'pub14',
    type: 'Journal',
    authors: 'Chang, Jui-Hung; Wang, Chi-Jane; Zhong, Hua-Xu; Weng, Hsiu-Chen; Zhou, Yu-Kai; Ong, Hoe-Yuan; Lai, Chin-Feng',
    title: 'Artificial intelligence learning platform in a visual programming environment: exploring an artificial intelligence learning model',
    source: 'Educational technology research and development, Vol. 72, No. 2, pp. 997-1024. Springer US New York',
    year: 2024,
  },
  {
    id: 'pub15',
    type: 'Conference',
    authors: 'Zhong, Hua-Xu; Lai, Chin-Feng; Ku, Shang-Hsuan; Chang, Jui-Hung',
    title: 'Exploring the Relationship Between Collaborative Learning Factors and Perceived Learning',
    source: 'International Conference on Innovative Technologies and Learning, pp. 167-174. Springer Nature Switzerland Cham',
    year: 2024,
  },
  {
    id: 'pub16',
    type: 'Journal',
    authors: 'Castaneda, Jennifer A Cardenas; Lin, Pei-Chun; Hung, Patrick CK; Zhong, Hua-Xu; Tseng, Hao-An; Huang, Yung-Fa; Ahmad, Rafiq',
    title: 'Designing inclusive tech playful educative solutions for visually impaired learners in STEM education',
    source: 'Smart Learning Environments, Vol. 12, No. 1, p. 4. Springer',
    year: 2025,
  },
  {
    id: 'pub17',
    type: 'Journal',
    authors: 'Gazit, Tali; Tager-Shafrir, Tair; Zhong, Hua-Xu; Hung, Patrick CK; Cheung, Vien',
    title: 'The dark side of the interface: examining the influence of different background modes on cognitive performance',
    source: 'Ergonomics, Published online: January 14th. Taylor & Francis',
    year: 2025,
  },
  {
    id: 'pub18',
    type: 'Conference',
    authors: 'Gittens, C.L., Gittens, M., Jiang, Y., Hung, P.C.K., Wood, T., Zhong, Hua-Xu',
    title: 'Technological Influence on Digital Banking Adoption: A Framework and Empirical Study of the Influence of Social Robots and IVAs in a Small Island Context',
    source: 'In: Siau, K.L., Nah, F.FH. (eds) HCI in Business, Government and Organizations. HCII 2025. Lecture Notes in Computer Science, vol 15805. Springer, Cham.',
    year: 2025,
    doi: '10.1007/978-3-031-92826-0_3',
  },
];


export const PROJECTS_DATA: ResearchProject[] = [
  // Ongoing Project (N/A)
  { 
    id: 'proj_ongoing_na', 
    status: 'Ongoing', 
    name: NA_STRING, 
    role: NA_STRING, 
    funding: NA_STRING, 
    period: NA_STRING, 
    goals: NA_STRING, 
    outcomes: NA_STRING 
  },

  // Completed Projects
  // NSTC / MOST Projects
  {
    id: 'proj_nstc_1',
    status: 'Completed',
    name: 'Establishing a Digital Learning Platform for K-12 Maker Education Teacher Training and Developing STEAM Curricula and Assessments',
    role: 'Researcher',
    funding: 'National Science and Technology Council (NSTC) / Ministry of Science and Technology (MOST)',
    period: 'August 1, 2019 – July 31, 2022',
    goals: 'To establish a digital learning platform for K-12 maker education teacher training and develop related STEAM curricula and assessments.',
    outcomes: 'Platform and curricula developed.'
  },
  {
    id: 'proj_nstc_2',
    status: 'Completed',
    name: 'Developing a STEAM Education Teacher Digital Learning Platform and Designing STEAM Curricula Based on the CDIO Engineering Education Model',
    role: 'Researcher',
    funding: 'National Science and Technology Council (NSTC) / Ministry of Science and Technology (MOST)',
    period: 'August 1, 2022 – July 31, 2024', // Assumed completion
    goals: 'To develop a STEAM education teacher digital learning platform and design STEAM curricula using the CDIO model.',
    outcomes: 'Platform and curricula designed.'
  },

  // Ministry of Education Projects
  {
    id: 'proj_moe_1',
    status: 'Completed',
    name: 'Integrating CDIO Engineering Education Model with STEM Education into Programming Courses',
    role: 'Researcher',
    funding: 'Ministry of Education',
    period: 'August 1, 2020 – July 31, 2021',
    goals: 'To integrate the CDIO model with STEM education in programming courses.',
    outcomes: 'Integration implemented and evaluated.'
  },
  {
    id: 'proj_moe_2',
    status: 'Completed',
    name: 'Integrating Design Thinking into Reflective Window Programming Courses Using the CDIO Engineering Education Model (Excellence Award Project)',
    role: 'Researcher',
    funding: 'Ministry of Education',
    period: 'August 1, 2021 – July 31, 2022',
    goals: 'To integrate design thinking into programming courses using the CDIO model.',
    outcomes: 'Project received an Excellence Award.'
  },
  {
    id: 'proj_moe_3',
    status: 'Completed',
    name: 'Implementing Clustering Algorithms for Adaptive Learning and Peer Learning – A Case Study in Virtual Learning Spaces',
    role: 'Researcher',
    funding: 'Ministry of Education',
    period: 'August 1, 2022 – July 31, 2023',
    goals: 'To implement clustering algorithms for adaptive and peer learning in virtual spaces.',
    outcomes: 'Algorithms implemented and case study conducted.'
  },
  {
    id: 'proj_moe_4',
    status: 'Completed',
    name: 'Impact of Integrating Guided Inquiry Learning with Collaborative Mind Mapping – A Case Study on Information Security Course Content',
    role: 'Researcher',
    funding: 'Ministry of Education',
    period: 'August 1, 2023 – July 31, 2024',
    goals: 'To study the impact of guided inquiry learning with collaborative mind mapping on information security course content.',
    outcomes: 'Impact assessed through case study.'
  },

  // International Research Experience
  {
    id: 'proj_intl_exp_1',
    status: 'Completed',
    name: 'International Research Experience: NSTC Scholarship for Doctoral Students to Study Abroad',
    role: 'Visiting Doctoral Student',
    funding: 'National Science and Technology Council (NSTC) Scholarship',
    period: 'September 7, 2023 – April 8, 2024',
    goals: 'To conduct doctoral research abroad and gain international research experience.',
    outcomes: 'Successfully completed study abroad period.'
  }
];


export const COURSES_DATA: Course[] = [
  { id: 'course1', name: NA_STRING, code: NA_STRING, semester: NA_STRING, description: NA_STRING, syllabusUrl: undefined },
  { id: 'course2', name: NA_STRING, code: NA_STRING, semester: NA_STRING, description: NA_STRING, syllabusUrl: undefined },
  { id: 'course3', name: NA_STRING, code: NA_STRING, semester: NA_STRING, description: NA_STRING, syllabusUrl: undefined },
];

export const ACADEMIC_ACTIVITIES_DATA: AcademicActivity[] = [
  { 
    id: 'act1', 
    type: 'Invited Talk', 
    title: NA_STRING, 
    eventName: NA_STRING, 
    location: NA_STRING, 
    date: NA_STRING,
    imageUrl: 'IMG/3.jpg',
    slidesUrl: undefined,
    posterUrl: undefined,
  },
  { 
    id: 'act2', 
    type: 'Oral Presentation', 
    title: NA_STRING, 
    eventName: NA_STRING, 
    location: NA_STRING, 
    date: NA_STRING, 
    imageUrl: 'IMG/4.jpg',
    slidesUrl: undefined,
    posterUrl: undefined,
  },
  { 
    id: 'act3', 
    type: 'Poster Presentation', 
    title: NA_STRING, 
    eventName: NA_STRING, 
    location: NA_STRING, 
    date: NA_STRING, 
    imageUrl: 'IMG/5.jpg',
    slidesUrl: undefined,
    posterUrl: undefined,
  },
  { 
    id: 'act4', 
    type: 'Seminar/Workshop', 
    eventName: NA_STRING, 
    role: NA_STRING, 
    location: NA_STRING, 
    date: NA_STRING, 
    imageUrl: 'IMG/6.jpg',
    slidesUrl: undefined,
    posterUrl: undefined,
  },
  { 
    id: 'act5', 
    type: 'Conference Attendance', 
    eventName: NA_STRING, 
    location: NA_STRING, 
    date: NA_STRING, 
    imageUrl: 'IMG/7.jpg',
    slidesUrl: undefined,
    posterUrl: undefined,
  },
  // Example of a 'Public Lecture' that would NOT be N/A'd if it existed:
  // { 
  //   id: 'act6', 
  //   type: 'Public Lecture', 
  //   eventName: 'AI for Everyone', 
  //   location: 'City Hall Auditorium', 
  //   date: '2024-09-01', 
  //   imageUrl: 'https://picsum.photos/800/450?random=6',
  //   description: 'A public talk about the basics of AI.',
  // },
];

export const CAROUSEL_SLIDES_DATA: CarouselSlide[] = [
  {
    id: 'carousel-1',
    imageUrl: 'IMG/3.jpg', // 改為相對路徑
    alt: 'Academic Activity 1',
    caption: '',
  },
  {
    id: 'carousel-2',
    imageUrl: 'IMG/4.jpg',
    alt: 'Academic Activity 2',
    caption: '',
  },
  {
    id: 'carousel-3',
    imageUrl: 'IMG/5.jpg',
    alt: 'Academic Activity 3',
    caption: '',
  },
  {
    id: 'carousel-4',
    imageUrl: 'IMG/6.jpg',
    alt: 'Academic Activity 4',
    caption: '',
  },
  {
    id: 'carousel-5',
    imageUrl: 'IMG/7.jpg',
    alt: 'Academic Activity 5',
    caption: '',
  },
];


export const ACADEMIC_SERVICE_DATA: ServiceItem[] = [
  { 
    id: 'serv_jr_consolidated', 
    type: 'Journal Reviewing', 
    details: `- Educational Technology Research and Development (SSCI Q1)
- Education and Information Technologies (SSCI Q1)
- Journal of Educational Computing Research (SSCI Q1)
- BMC Medical Education (SSCI Q1)
- Frontiers in Psychology (SSCI Q1)
- Scientific Reports (SCI Q2)
- Library Hi Tech (SSCI Q2)
- Journal of Computer Assisted Learning (SSCI Q1)
- International Journal of STEM Education (SSCI Q1)
- Journal of Control Automation and Electrical Systems (SCI)`
  },
];

export const EXTERNAL_LINKS_DATA: ExternalLink[] = [
  // Category 1: Text Generation & LLM Assistance
  { id: 'ext_link_text_gen_1', name: 'ChatGPT (OpenAI)', url: 'https://chat.openai.com', icon: LinkIcon, category: '文本生成與輔助 (Text Generation & LLM Assistance)' },
  { id: 'ext_link_text_gen_2', name: 'Gemini (Google)', url: 'https://gemini.google.com', icon: LinkIcon, category: '文本生成與輔助 (Text Generation & LLM Assistance)' },
  { id: 'ext_link_text_gen_3', name: 'Claude (Anthropic)', url: 'https://claude.ai', icon: LinkIcon, category: '文本生成與輔助 (Text Generation & LLM Assistance)' },
  { id: 'ext_link_text_gen_4', name: 'Perplexity AI', url: 'https://www.perplexity.ai', icon: LinkIcon, category: '文本生成與輔助 (Text Generation & LLM Assistance)' },
  { id: 'ext_link_text_gen_5', name: 'Notion AI (整合於 Notion)', url: 'https://www.notion.so', icon: LinkIcon, category: '文本生成與輔助 (Text Generation & LLM Assistance)', subCategory: '學術與專業寫作輔助' },
  { id: 'ext_link_text_gen_6', name: 'Gamma.app', url: 'https://gamma.app', icon: LinkIcon, category: '文本生成與輔助 (Text Generation & LLM Assistance)', subCategory: '學術與專業寫作輔助' },
  { id: 'ext_link_text_gen_7', name: 'Elicit.org', url: 'https://elicit.org', icon: LinkIcon, category: '文本生成與輔助 (Text Generation & LLM Assistance)', subCategory: '學術與專業寫作輔助' },
  { id: 'ext_link_text_gen_8', name: 'Grammarly', url: 'https://www.grammarly.com', icon: LinkIcon, category: '文本生成與輔助 (Text Generation & LLM Assistance)', subCategory: '學術與專業寫作輔助' },

  // Category 2: AI Multimedia Generation
  { id: 'ext_link_mm_img_1', name: 'Midjourney', url: 'https://www.midjourney.com', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '圖像生成 (Image Generation)' },
  { id: 'ext_link_mm_img_2', name: 'DALL-E 3 (OpenAI/ChatGPT Plus)', url: 'https://chat.openai.com', description: '透過 ChatGPT Plus 使用', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '圖像生成 (Image Generation)' },
  { id: 'ext_link_mm_img_3', name: 'Stable Diffusion (模型)', url: 'https://stability.ai/stablediffusion', description: '官方資訊, 可透過不同介面使用', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '圖像生成 (Image Generation)' },
  { id: 'ext_link_mm_img_4', name: 'Adobe Firefly', url: 'https://firefly.adobe.com', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '圖像生成 (Image Generation)' },
  { id: 'ext_link_mm_img_5', name: 'Canva Magic Media (整合於 Canva)', url: 'https://www.canva.com', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '圖像生成 (Image Generation)' },

  { id: 'ext_link_mm_vid_1', name: 'Runway Gen-2', url: 'https://runwayml.com', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '影片生成與編輯 (Video Generation & Editing)' },
  { id: 'ext_link_mm_vid_2', name: 'Pika Labs', url: 'https://pika.art', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '影片生成與編輯 (Video Generation & Editing)' },
  { id: 'ext_link_mm_vid_3', name: 'Sora (OpenAI - 預覽階段)', url: 'https://openai.com/sora', description: '資訊頁面', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '影片生成與編輯 (Video Generation & Editing)' },
  { id: 'ext_link_mm_vid_4', name: 'HeyGen', url: 'https://www.heygen.com', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '影片生成與編輯 (Video Generation & Editing)' },
  // { id: 'ext_link_mm_vid_5', name: 'Synthesia', url: 'https://www.synthesia.io', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '影片生成與編輯 (Video Generation & Editing)' }, // Removed by user
  // { id: 'ext_link_mm_vid_6', name: 'Descript', url: 'https://www.descript.com', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '影片生成與編輯 (Video Generation & Editing)' }, // Removed by user

  { id: 'ext_link_mm_aud_1', name: 'Suno AI', url: 'https://suno.ai', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '音樂與音訊生成 (Music & Audio Generation)' },
  { id: 'ext_link_mm_aud_2', name: 'Udio AI', url: 'https://www.udio.com', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '音樂與音訊生成 (Music & Audio Generation)' },
  { id: 'ext_link_mm_aud_3', name: 'ElevenLabs', url: 'https://elevenlabs.io', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '音樂與音訊生成 (Music & Audio Generation)' },
  // { id: 'ext_link_mm_aud_4', name: 'Adobe Podcast (Enhance Speech)', url: 'https://podcast.adobe.com/enhance', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '音樂與音訊生成 (Music & Audio Generation)' }, // Removed by user
  { id: 'ext_link_mm_aud_5', name: 'AIVA', url: 'https://www.aiva.ai', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '音樂與音訊生成 (Music & Audio Generation)' },
  { id: 'ext_link_mm_aud_6', name: 'Soundraw.io', url: 'https://soundraw.io', icon: LinkIcon, category: 'AI 影音圖像生成 (AI Multimedia Generation)', subCategory: '音樂與音訊生成 (Music & Audio Generation)' },

  // Category 3: AI in Academic Applications & Research
  { id: 'ext_link_acad_res_1', name: 'Elicit.org', url: 'https://elicit.org', icon: LinkIcon, category: 'AI 學術應用與研究資源 (AI in Academic Applications & Research)', subCategory: 'AI 輔助研究工具' },
  { id: 'ext_link_acad_res_2', name: 'Connected Papers', url: 'https://www.connectedpapers.com', icon: LinkIcon, category: 'AI 學術應用與研究資源 (AI in Academic Applications & Research)', subCategory: 'AI 輔助研究工具' },
  { id: 'ext_link_acad_res_3', name: 'ResearchRabbit', url: 'https://www.researchrabbit.ai', icon: LinkIcon, category: 'AI 學術應用與研究資源 (AI in Academic Applications & Research)', subCategory: 'AI 輔助研究工具' },
  { id: 'ext_link_acad_res_4', name: 'SciSpace', url: 'https://scispace.com', icon: LinkIcon, category: 'AI 學術應用與研究資源 (AI in Academic Applications & Research)', subCategory: 'AI 輔助研究工具' },
  { id: 'ext_link_acad_res_5', name: 'Zotero', url: 'https://www.zotero.org', icon: LinkIcon, category: 'AI 學術應用與研究資源 (AI in Academic Applications & Research)', subCategory: 'AI 輔助研究工具' },
  { id: 'ext_link_acad_res_6', name: 'Mendeley', url: 'https://www.mendeley.com', icon: LinkIcon, category: 'AI 學術應用與研究資源 (AI in Academic Applications & Research)', subCategory: 'AI 輔助研究工具' },

  { id: 'ext_link_acad_plat_1', name: 'Google Colaboratory (Colab)', url: 'https://colab.research.google.com', icon: LinkIcon, category: 'AI 學術應用與研究資源 (AI in Academic Applications & Research)', subCategory: 'AI 研究與數據分析平台/工具' },
  { id: 'ext_link_acad_plat_2', name: 'Hugging Face Hub', url: 'https://huggingface.co', icon: LinkIcon, category: 'AI 學術應用與研究資源 (AI in Academic Applications & Research)', subCategory: 'AI 研究與數據分析平台/工具' },
  { id: 'ext_link_acad_plat_3', name: 'Kaggle', url: 'https://www.kaggle.com', icon: LinkIcon, category: 'AI 學術應用與研究資源 (AI in Academic Applications & Research)', subCategory: 'AI 研究與數據分析平台/工具' },

  { id: 'ext_link_acad_eth_1', name: 'AI4People', url: 'https://www.eismd.eu/project/ai4people/', description: '或相關報告連結', icon: LinkIcon, category: 'AI 學術應用與研究資源 (AI in Academic Applications & Research)', subCategory: 'AI 倫理與負責任創新' },
  { id: 'ext_link_acad_eth_2', name: 'IEEE Ethically Aligned Design', url: 'https://ethicsinaction.ieee.org', icon: LinkIcon, category: 'AI 學術應用與研究資源 (AI in Academic Applications & Research)', subCategory: 'AI 倫理與負責任創新' },
  { id: 'ext_link_acad_eth_3', name: 'Partnership on AI', url: 'https://partnershiponai.org', icon: LinkIcon, category: 'AI 學術應用與研究資源 (AI in Academic Applications & Research)', subCategory: 'AI 倫理與負責任創新' },
  { id: 'ext_link_acad_eth_4', name: 'AI Now Institute', url: 'https://ainowinstitute.org', icon: LinkIcon, category: 'AI 學術應用與研究資源 (AI in Academic Applications & Research)', subCategory: 'AI 倫理與負責任創新' },
  { id: 'ext_link_acad_eth_5', name: 'Stanford HAI', url: 'https://hai.stanford.edu', description: '各大學 AI 倫理研究中心網站 範例', icon: LinkIcon, category: 'AI 學術應用與研究資源 (AI in Academic Applications & Research)', subCategory: 'AI 倫理與負責任創新' },

  // Category 4: GAI/AI-Assisted Learning & Teaching Platforms
  { id: 'ext_link_learn_lit_1', name: 'Code.org (AI and Machine Learning courses)', url: 'https://code.org/ai', icon: LinkIcon, category: 'GAI/AI 輔助學習與教學平台 (GAI/AI-Assisted Learning & Teaching Platforms)', subCategory: 'AI 素養與程式設計教學平台' },
  { id: 'ext_link_learn_lit_2', name: 'Machine Learning for Kids', url: 'https://machinelearningforkids.co.uk', icon: LinkIcon, category: 'GAI/AI 輔助學習與教學平台 (GAI/AI-Assisted Learning & Teaching Platforms)', subCategory: 'AI 素養與程式設計教學平台' },
  { id: 'ext_link_learn_lit_3', name: 'AI4K12.org', url: 'https://ai4k12.org', icon: LinkIcon, category: 'GAI/AI 輔助學習與教學平台 (GAI/AI-Assisted Learning & Teaching Platforms)', subCategory: 'AI 素養與程式設計教學平台' },
  { id: 'ext_link_learn_lit_4', name: 'Google AI Education', url: 'https://ai.google/education/', icon: LinkIcon, category: 'GAI/AI 輔助學習與教學平台 (GAI/AI-Assisted Learning & Teaching Platforms)', subCategory: 'AI 素養與程式設計教學平台' },
  // { id: 'ext_link_learn_lit_5', name: 'Microsoft Learn (AI Path)', url: 'https://learn.microsoft.com/training/ai/', icon: LinkIcon, category: 'GAI/AI 輔助學習與教學平台 (GAI/AI-Assisted Learning & Teaching Platforms)', subCategory: 'AI 素養與程式設計教學平台' }, // Removed by user
  { id: 'ext_link_learn_lit_6', name: 'MIT RAISE', url: 'https://raise.mit.edu', icon: LinkIcon, category: 'GAI/AI 輔助學習與教學平台 (GAI/AI-Assisted Learning & Teaching Platforms)', subCategory: 'AI 素養與程式設計教學平台' },

  { id: 'ext_link_learn_adv_1', name: 'Coursera', url: 'https://www.coursera.org', icon: LinkIcon, category: 'GAI/AI 輔助學習與教學平台 (GAI/AI-Assisted Learning & Teaching Platforms)', subCategory: '進階 AI 技術學習平台' },
  { id: 'ext_link_learn_adv_2', name: 'edX', url: 'https://www.edx.org', icon: LinkIcon, category: 'GAI/AI 輔助學習與教學平台 (GAI/AI-Assisted Learning & Teaching Platforms)', subCategory: '進階 AI 技術學習平台' },
  { id: 'ext_link_learn_adv_3', name: 'fast.ai', url: 'https://www.fast.ai', icon: LinkIcon, category: 'GAI/AI 輔助學習與教學平台 (GAI/AI-Assisted Learning & Teaching Platforms)', subCategory: '進階 AI 技術學習平台' },
  { id: 'ext_link_learn_adv_4', name: 'NVIDIA Deep Learning Institute (DLI)', url: 'https://www.nvidia.com/en-us/training/', icon: LinkIcon, category: 'GAI/AI 輔助學習與教學平台 (GAI/AI-Assisted Learning & Teaching Platforms)', subCategory: '進階 AI 技術學習平台' },
];
