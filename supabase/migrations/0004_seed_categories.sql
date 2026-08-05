-- ============================================================
-- 0004_seed_categories.sql
-- Seed the categories table with professional service categories.
-- Uses ON CONFLICT (slug) DO NOTHING to prevent duplicates.
-- ============================================================

insert into public.categories (name, slug, icon)
values
  -- Development & Programming
  ('Web Development',                'web-development',                'globe'),
  ('Mobile App Development',         'mobile-app-development',         'smartphone'),
  ('Software Development',           'software-development',           'code'),
  ('Frontend Development',           'frontend-development',           'layout'),
  ('Backend Development',            'backend-development',            'server'),
  ('Full Stack Development',         'full-stack-development',         'layers'),
  ('WordPress Development',          'wordpress-development',          'file-text'),
  ('Shopify Development',            'shopify-development',            'shopping-bag'),
  ('E-commerce',                     'e-commerce',                     'store'),
  ('Game Development',               'game-development',               'gamepad'),
  ('Blockchain',                     'blockchain',                     'link'),

  -- Design & Creative
  ('UI/UX Design',                   'ui-ux-design',                   'palette'),
  ('Graphic Design',                 'graphic-design',                 'pen-tool'),
  ('Logo Design',                    'logo-design',                    'feather'),
  ('Branding',                       'branding',                       'award'),
  ('Web Design',                     'web-design',                     'monitor'),
  ('App Design',                     'app-design',                     'smartphone'),
  ('Product Design',                 'product-design',                 'box'),
  ('Illustration',                   'illustration',                   'brush'),
  ('Print Design',                   'print-design',                   'file'),
  ('Packaging Design',               'packaging-design',               'package'),
  ('3D Modeling',                    '3d-modeling',                    'box'),
  ('3D Printing',                    '3d-printing',                    'printer'),
  ('CAD Design',                     'cad-design',                     'ruler'),
  ('Interior Design',                'interior-design',                'home'),
  ('Architecture',                   'architecture',                   'building'),

  -- Video & Animation
  ('Video Editing',                  'video-editing',                  'film'),
  ('Animation',                      'animation',                      'play-circle'),
  ('Motion Graphics',                'motion-graphics',                'video'),
  ('Photography',                    'photography',                    'camera'),

  -- Audio & Music
  ('Audio Production',               'audio-production',               'headphones'),
  ('Music Production',               'music-production',               'music'),
  ('Voice Over',                     'voice-over',                     'mic'),
  ('Voice Acting',                   'voice-acting',                   'mic'),
  ('Podcast Production',             'podcast-production',             'radio'),

  -- Writing & Content
  ('Content Writing',                'content-writing',                'file-text'),
  ('Copywriting',                    'copywriting',                    'type'),
  ('Technical Writing',              'technical-writing',              'book-open'),
  ('Scriptwriting',                  'scriptwriting',                  'film'),
  ('Content Strategy',               'content-strategy',               'target'),

  -- Translation & Language
  ('Translation',                    'translation',                    'globe'),
  ('Proofreading',                   'proofreading',                   'check-circle'),

  -- Marketing & Sales
  ('SEO',                            'seo',                            'search'),
  ('Digital Marketing',              'digital-marketing',              'trending-up'),
  ('Social Media Management',        'social-media-management',        'share-2'),
  ('Email Marketing',                'email-marketing',                'mail'),
  ('App Store Optimization',         'app-store-optimization',         'download'),
  ('Sales',                          'sales',                          'dollar-sign'),

  -- Business & Consulting
  ('Business Consulting',            'business-consulting',            'briefcase'),
  ('Business Analysis',              'business-analysis',              'clipboard'),
  ('Project Management',             'project-management',             'calendar'),
  ('Product Management',             'product-management',             'layers'),

  -- Data & Analytics
  ('Data Entry',                     'data-entry',                     'database'),
  ('Data Analysis',                  'data-analysis',                  'bar-chart'),
  ('Data Science',                   'data-science',                   'activity'),
  ('Business Intelligence',          'business-intelligence',          'pie-chart'),
  ('Power BI',                       'power-bi',                       'bar-chart'),
  ('Tableau',                        'tableau',                        'bar-chart'),
  ('Research',                       'research',                       'search'),

  -- Technical Skills
  ('Excel',                          'excel',                          'table'),
  ('SQL',                            'sql',                            'database'),
  ('Python',                         'python',                         'code'),
  ('Machine Learning',               'machine-learning',               'brain'),
  ('Artificial Intelligence',        'artificial-intelligence',        'cpu'),

  -- IT & Infrastructure
  ('Cybersecurity',                  'cybersecurity',                  'shield'),
  ('Penetration Testing',            'penetration-testing',            'shield'),
  ('Cloud Computing',                'cloud-computing',                'cloud'),
  ('DevOps',                         'devops',                         'settings'),
  ('Networking',                     'networking',                     'wifi'),
  ('IT Support',                     'it-support',                     'headphones'),
  ('Database Administration',        'database-administration',         'database'),
  ('Quality Assurance',              'quality-assurance',              'check-circle'),
  ('Testing',                        'testing',                        'bug'),
  ('Technical Support',              'technical-support',              'help-circle'),

  -- Customer & Admin
  ('Customer Support',               'customer-support',               'headphones'),
  ('Virtual Assistant',              'virtual-assistant',              'user'),

  -- Finance & Legal
  ('Accounting',                     'accounting',                     'dollar-sign'),
  ('Finance',                        'finance',                        'trending-up'),
  ('Legal Services',                 'legal-services',                 'scale'),

  -- HR & Recruiting
  ('Human Resources',                'human-resources',                'users'),
  ('Recruiting',                     'recruiting',                     'user-plus'),

  -- Construction & Engineering
  ('Engineering',                    'engineering',                    'cpu'),
  ('Construction',                   'construction',                   'hammer'),
  ('Manufacturing',                  'manufacturing',                  'factory'),

  -- Logistics & Supply Chain
  ('Logistics',                      'logistics',                      'truck'),
  ('Procurement',                    'procurement',                    'shopping-cart'),

  -- Industry & Sector
  ('Healthcare',                     'healthcare',                     'heart-pulse'),
  ('Education & Tutoring',           'education-tutoring',             'graduation-cap'),
  ('Agriculture',                    'agriculture',                    'leaf'),
  ('Real Estate',                    'real-estate',                    'home'),
  ('Automotive',                     'automotive',                     'car'),
  ('Telecommunications',             'telecommunications',             'signal'),

  -- Catch-all
  ('Other',                          'other',                          'more-horizontal')

on conflict (slug) do nothing;
