-- Seed community organizations into Resource Hub
INSERT INTO public.community_links (title, url, description, category) VALUES
  ('Out in Tech',      'https://outintech.com/',            'A non-profit that unites the LGBTQ+ tech community through events, volunteer programs, and career support.',              'organization'),
  ('SheTo',            'https://sheto.tech/',               'A community dedicated to empowering women and non-binary people in technology through mentorship and networking.',          'organization'),
  ('Baddies in Tech',  'https://baddiesintech.com/',        'A community for women of color in tech, focused on career growth, mentorship, and building connections.',                  'organization'),
  ('Ladies in Tech',   'https://ladiesintech.io/',          'A global community supporting women in technology through events, resources, and peer networking.',                        'organization'),
  ('Techsgiving',      'https://techsgiving.com/',          'A community of tech professionals giving back through mentorship, resume reviews, and career support for underrepresented groups.', 'organization');
