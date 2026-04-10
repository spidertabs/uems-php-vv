-- Colleges Table INSERT statements
INSERT INTO colleges (code, name, description) VALUES
-- Schools (Main Campus)
('SOAS', 'School of Agriculture Sciences', 'Agricultural sciences, agribusiness, and environmental studies.'),
('SPS', 'School of Professional Studies', 'Professional and interdisciplinary programs.'),
('SDDEL', 'School of Digital, Distance and E-Learning', 'Online, distance, and blended learning programs.'),
('SEAS', 'School of Engineering and Applied Sciences', 'Engineering and applied science programs.'),
('SOL', 'School of Law', 'Legal studies and research faculty.'),
('SOMAC', 'School of Mathematics and Computing', 'Handles Mathematics, Computing, and ICT programs.'),
('SONAS', 'School of Natural and Applied Sciences', 'Covers biology, chemistry, physics, and applied science programs.'),
('SPH', 'School of Public Health', 'Public health, epidemiology, and community health programs.'),

-- Colleges (Main Campus)
('CEM', 'College of Economics and Management', 'Business, management, and economics programs.'),
('CEODL', 'College of Education, Open and Distance Learning', 'Teacher education and open and distance learning programs.'),
('CHSS', 'College of Humanities and Social Sciences', 'Humanities, social sciences, and behavioral studies.');


-- Departments Table INSERT statements
INSERT INTO departments (college_id, code, name, description) VALUES

-- SOAS (School of Agriculture Sciences) - college_id = 1
(1, 'AGRIC', 'Agriculture', 'Department of Agricultural Sciences and Rural Development'),
(1, 'AGBUS', 'Agribusiness', 'Department of Agribusiness Management'),
(1, 'ENVS', 'Environmental Studies', 'Department of Environmental Studies and Conservation'),

-- SPS (School of Professional Studies) - college_id = 2
(2, 'PROF', 'Professional Studies', 'Department of Professional and Interdisciplinary Programs'),

-- SDDEL (School of Digital, Distance and E-Learning) - college_id = 3
(3, 'DDEL', 'Distance and E-Learning', 'Department of Distance and E-Learning Programs'),

-- SEAS (School of Engineering and Applied Sciences) - college_id = 4
(4, 'CIV', 'Civil Engineering', 'Department of Civil and Structural Engineering'),
(4, 'ELE', 'Electrical Engineering', 'Department of Electrical and Electronic Engineering'),
(4, 'MEC', 'Mechanical Engineering', 'Department of Mechanical Engineering'),
(4, 'TEL', 'Telecommunications Engineering', 'Department of Telecommunications and Network Engineering'),

-- SOL (School of Law) - college_id = 5
(5, 'LAW', 'Law', 'Department of Law offering LLB and LLM programs'),
(5, 'CML', 'Commercial Law', 'Department of Commercial and Business Law'),
(5, 'IEL', 'International and Economic Law', 'Department of International and Economic Law'),
(5, 'IPL', 'Intellectual Property Law', 'Department of Intellectual Property and Innovation Law'),

-- SOMAC (School of Mathematics and Computing) - college_id = 6
(6, 'CS', 'Computer Science', 'Department of Computer Science offering programs in computing and software development'),
(6, 'IT', 'Information Technology', 'Department of Information Technology offering programs in IT systems and management'),
(6, 'SE', 'Software Engineering', 'Department of Software Engineering specializing in software development methodologies'),
(6, 'MATH', 'Mathematics', 'Department of Mathematics offering pure and applied mathematics programs'),

-- SONAS (School of Natural and Applied Sciences) - college_id = 7
(7, 'ENV', 'Environmental Management', 'Department of Environmental Management and Conservation'),
(7, 'PHY', 'Physics', 'Department of Physics offering energy systems and applied physics'),
(7, 'CHEM', 'Chemistry', 'Department of Chemistry specializing in industrial and research chemistry'),
(7, 'BIO', 'Biology', 'Department of Biological Sciences including wildlife and ecology'),

-- SPH (School of Public Health) - college_id = 8
(8, 'PH', 'Public Health', 'Department of Public Health offering MPH and PhD programs'),
(8, 'EPID', 'Epidemiology', 'Department of Epidemiology and Biostatistics'),
(8, 'HSM', 'Health Systems Management', 'Department of Health Systems and Policy Management'),

-- CEM (College of Economics and Management) - college_id = 9
(9, 'ACC', 'Accounting', 'Department of Accounting and Finance'),
(9, 'BUS', 'Business Administration', 'Department of Business Administration and Management'),
(9, 'HRM', 'Human Resource Management', 'Department of Human Resource Management'),
(9, 'MKT', 'Marketing', 'Department of Marketing and Entrepreneurship'),
(9, 'ENT', 'Entrepreneurship', 'Department of Entrepreneurship and Small Business Management'),
(9, 'ECO', 'Economics', 'Department of Economics'),
(9, 'SCM', 'Supply Chain Management', 'Department of Supply Chain and Procurement Management'),

-- CEODL (College of Education, Open and Distance Learning) - college_id = 10
(10, 'EDU', 'Education', 'Department of Education and Pedagogy'),
(10, 'ENG', 'English', 'Department of English Language and Literature'),
(10, 'LING', 'Linguistics', 'Department of Linguistics'),
(10, 'EDADMIN', 'Educational Administration', 'Department of Educational Management and Administration'),

-- CHSS (College of Humanities and Social Sciences) - college_id = 11
(11, 'SWS', 'Social Work', 'Department of Social Work and Social Administration'),
(11, 'GIC', 'Guidance and Counselling', 'Department of Guidance and Counselling'),
(11, 'PSY', 'Psychology', 'Department of Psychology'),
(11, 'DVS', 'Development Studies', 'Department of Development Studies'),
(11, 'CRP', 'Conflict Resolution and Peace', 'Department of Conflict Resolution and Peace Building'),
(11, 'MCO', 'Mass Communication', 'Department of Mass Communication and Journalism'),
(11, 'PAD', 'Public Administration', 'Department of Public Administration and Management'),
(11, 'POL', 'Political Science', 'Department of Political Science and International Relations');


INSERT INTO programmes (code, name, level, duration_years, department_id, college_id, description, is_active) VALUES
-- ============================================================
-- SOMAC – School of Mathematics & Computing (college_id = 6)
-- CS = 14 | IT = 15 | SE = 16 | MATH = 17
-- ============================================================
('DIT', 'Diploma in Information Technology', 'diploma', 2, 15, 6, 'Two-year diploma covering computer fundamentals, networking and programming', TRUE),
('BIT', 'Bachelor of Information Technology', 'bachelors', 3, 15, 6, 'Bachelor degree in information technology and systems', TRUE),
('BSE', 'Bachelor of Software Engineering', 'bachelors', 3, 16, 6, 'Bachelor degree focusing on software development and engineering principles', TRUE),
('DCS', 'Diploma in Computer Science', 'diploma', 2, 14, 6, 'Diploma covering programming, databases and computer systems', TRUE),
('BCS', 'Bachelor of Computer Science', 'bachelors', 3, 14, 6,'Bachelor degree covering algorithms, data structures, operating systems, databases, AI and cybersecurity', TRUE),
('MCS', 'Master of Computer Science', 'masters', 2, 14, 6, 'Advanced master programme in computer science and research', TRUE),
('PHDCOMPSCI', 'PhD in Computer Science by Research', 'phd', 3, 14, 6, 'Doctoral research programme in computer science', TRUE),
('MSCMATH', 'Master of Science in Pure Mathematics', 'masters', 2, 17, 6, 'Master programme in pure and applied mathematics', TRUE),
-- ============================================================
-- SONAS – School of Natural & Applied Sciences (college_id = 7)
-- ENV = 18 | PHY = 19 | CHEM = 20 | BIO = 21
-- ============================================================
('DENV', 'Diploma in Environmental Management', 'diploma', 2, 18, 7, 'Diploma in environmental management and conservation', TRUE),
('BSWMC', 'Bachelor of Science in Wildlife Management and Conservation', 'bachelors', 3, 21, 7, 'Bachelor degree in wildlife management, ecology and conservation', TRUE),
('BSIC', 'Bachelor of Science in Industrial Chemistry', 'bachelors', 3, 20, 7,'Bachelor degree in industrial and applied chemistry', TRUE),
('MSCENV', 'Master of Science in Environmental Management', 'masters', 2, 18, 7, 'Advanced environmental management studies', TRUE),
('MSCPHY', 'Master of Science in Physics (Energy Systems)', 'masters', 2, 19, 7, 'Master programme in applied physics and energy systems', TRUE),
('PHDPHY', 'PhD in Physics by Research', 'phd', 3, 19, 7, 'Doctoral research programme in physics', TRUE),
('PHDCHEM', 'PhD in Chemistry by Research', 'phd', 3, 20, 7, 'Doctoral research programme in chemistry', TRUE),

-- ============================================================
-- SOAS – School of Agriculture Sciences (college_id = 1)
-- AGRIC = 1
-- ============================================================
('MAERI', 'Master in Agricultural Extension and Rural Innovation', 'masters', 2, 1, 1, 'Master programme in agricultural extension and rural development', TRUE),

-- ============================================================
-- SPH – School of Public Health (college_id = 8)
-- PH = 22
-- ============================================================
('MPH', 'Master in Public Health', 'masters', 2, 22, 8, 'Master programme in public health', TRUE),
('PHDPH', 'PhD in Public Health by Research', 'phd', 3, 22, 8, 'Doctoral research programme in public health', TRUE),

-- ============================================================
-- SOL – School of Law (college_id = 5)
-- LAW = 10 | CML = 11
-- ============================================================
('LLB', 'Bachelor of Law', 'bachelors', 4, 10, 5, 'Bachelor of Laws degree', TRUE),
('LLMCL', 'Master of Laws - Commercial Law', 'masters', 2, 11, 5, 'Master of laws specializing in commercial law', TRUE),
('LLMGL', 'Master of Laws - General Law', 'masters', 2, 10, 5, 'General master of laws programme', TRUE),

-- ============================================================
-- CEM – College of Economics & Management (college_id = 9)
-- ACC = 25 | BUS = 26 | HRM = 27 | ENT = 29 | SCM = 31
-- ============================================================
('BHRM', 'Bachelor of Human Resource Management', 'bachelors', 3, 27, 9, 'Bachelor degree in human resource management', TRUE),
('BESBM', 'Bachelor of Entrepreneurship & Small Business Management', 'bachelors', 3, 29, 9,
 'Bachelor degree in entrepreneurship and small business', TRUE),

('BBA', 'Bachelor of Business Administration', 'bachelors', 3, 26, 9, 'Bachelor degree in business administration', TRUE),
('BBAFA', 'Bachelor of Business Administration (Finance & Accounting)', 'bachelors', 3, 25, 9, 'Bachelor degree in finance and accounting', TRUE),
('BIBA', 'Bachelor of International Business Administration', 'bachelors', 3, 26, 9, 'Bachelor degree in international business', TRUE),
('BSPM', 'Bachelor of Supply and Procurement Management', 'bachelors', 3, 31, 9, 'Bachelor degree in supply chain and procurement management', TRUE),

-- ============================================================
-- CEODL – College of Education, Open & Distance Learning (college_id = 10)
-- EDU = 32 | ENG = 33 | LING = 34 | EDADMIN = 35
-- ============================================================
('PGDE', 'Postgraduate Diploma in Education', 'diploma', 1, 32, 10, 'Postgraduate diploma in education', TRUE),
('PGDEMA', 'Postgraduate Diploma in Educational Management and Administration', 'diploma', 1, 35, 10, 'Postgraduate diploma in education management', TRUE),
('MAENG', 'Master of Arts in English', 'masters', 2, 33, 10, 'Master programme in English language studies', TRUE),
('MALING', 'Master of Arts in Linguistics', 'masters', 2, 34, 10, 'Master programme in linguistics', TRUE),
('MEDEMA', 'Master of Education in Education Management and Administration', 'masters', 2, 35, 10, 'Master of education management programme', TRUE),
('PHDMSEA', 'PhD in Management Sciences - Educational Administration', 'phd', 3, 35, 10, 'Doctoral research in educational administration', TRUE),

-- ============================================================
-- CHSS – College of Humanities & Social Sciences (college_id = 11)
-- SWS = 36 | GIC = 37 | DVS = 39 | CRP = 40 | MCO = 41 | PAD = 42
-- ============================================================
('DGC', 'Diploma in Guidance and Counselling', 'diploma', 2, 37, 11, 'Diploma in guidance and counselling', TRUE),
('DMC', 'Diploma in Mass Communication', 'diploma', 2, 41, 11, 'Diploma in mass communication', TRUE),
('PGDDS', 'Postgraduate Diploma in Development Studies', 'diploma', 1, 39, 11, 'Postgraduate diploma in development studies', TRUE),
('BGC', 'Bachelor of Guidance and Counselling', 'bachelors', 3, 37, 11, 'Bachelor degree in guidance and counselling', TRUE),
('BSWCD', 'Bachelor of Social Work and Community Development', 'bachelors', 3, 36, 11, 'Bachelor degree in social work and community development', TRUE),
('MACRP', 'Master of Arts in Conflict Resolution and Peace Building', 'masters', 2, 40, 11, 'Master programme in peace and conflict studies', TRUE),
('PHDMSPM', 'PhD in Management Sciences - Public Management', 'phd', 3, 42, 11, 'Doctoral research in public management', TRUE);

-- ============================================================
-- Users: COMMON PASSWORD HASH (bcrypt) Password: uems@2026
-- ============================================================
SET @HASH := '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu';
INSERT INTO users (email, password_hash, first_name, last_name, role, department_id, college_id, phone ) VALUES

-- ADMIN USERS
('admin@uems.ac.ug', @HASH, 'System', 'Admin', 'admin', NULL, NULL, '0700000000'),

-- EXAM MASTERS
('exammaster@uems.ac.ug', @HASH, 'Peter', 'Lutalo', 'exam_master', NULL, NULL, '0705555555'),
('exam.assistant@uems.ac.ug', @HASH, 'Ruth', 'Nakimuli', 'exam_master', NULL, NULL, '0705555556'),
('exam.it@uems.ac.ug', @HASH, 'Daniel', 'Kyambadde', 'exam_master', NULL, NULL, '0705555557'),
('exam.sciences@uems.ac.ug', @HASH, 'Catherine', 'Nabatanzi', 'exam_master', NULL, NULL, '0705555558'),
('exam.law@uems.ac.ug', @HASH, 'Henry', 'Wasswa', 'exam_master', NULL, NULL, '0705555559'),

-- DEANS (COLLEGES / SCHOOLS)
-- College IDs: 1=SOMAC Agriculture, 2=SONAS Applied Sciences, 3=SOPH Public Health, 4=SOL Law, 5=CEM Business, 
--              6=CEODL Education, 7=SEAS Engineering, 8=CHSS Humanities, 9=School of Business, 10=School of Education, 11=School of Social Sciences
('dean.somac@uems.ac.ug', @HASH, 'John', 'Katumba', 'dean', NULL, 1, '0701111111'),
('dean.sonas@uems.ac.ug', @HASH, 'Sarah', 'Nanyonga', 'dean', NULL, 2, '0702222222'),
('dean.sph@uems.ac.ug', @HASH, 'Michael', 'Okello', 'dean', NULL, 8, '0703333333'),
('dean.sol@uems.ac.ug', @HASH, 'Elizabeth', 'Namubiru', 'dean', NULL, 5, '0703333334'),
('dean.cem@uems.ac.ug', @HASH, 'Alice', 'Kakuru', 'dean', NULL, 9, '0704444444'),
('dean.ceodl@uems.ac.ug', @HASH, 'Simon', 'Mwebaze', 'dean', NULL, 3, '0704444445'),
('dean.seas@uems.ac.ug', @HASH, 'Christopher', 'Tugume', 'dean', NULL, 4, '0704444446'),
('dean.chss@uems.ac.ug', @HASH, 'Margaret', 'Kwagala', 'dean', NULL, 11, '0704444447'),
('dean.research@uems.ac.ug', @HASH, 'Paul', 'Mukasa', 'dean', NULL, NULL, '0704444448'),
('dean.students@uems.ac.ug', @HASH, 'Jane', 'Nakibuka', 'dean', NULL, NULL, '0704444449'),

-- ============================================================
-- HEADS OF DEPARTMENT (HODs) - All Departments Covered
-- ============================================================

-- AGRICULTURE DEPARTMENTS (College 1)
('hod.agric@uems.ac.ug', @HASH, 'Joseph', 'Mugerwa', 'hod', 1, 1, '0706000001'),
('hod.agbus@uems.ac.ug', @HASH, 'Sarah', 'Nabirye', 'hod', 2, 1, '0706000002'),
('hod.envs@uems.ac.ug', @HASH, 'Francis', 'Opolot', 'hod', 3, 1, '0706000003'),

-- PROFESSIONAL STUDIES (College 2)
('hod.prof@uems.ac.ug', @HASH, 'Brenda', 'Kansiime', 'hod', 4, 2, '0706000004'),

-- DISTANCE LEARNING (College 3)
('hod.ddel@uems.ac.ug', @HASH, 'Ronald', 'Kato', 'hod', 5, 3, '0706000005'),

-- ENGINEERING DEPARTMENTS (College 4)
('hod.civ@uems.ac.ug', @HASH, 'Francis', 'Okello', 'hod', 6, 4, '0706000006'),
('hod.ele@uems.ac.ug', @HASH, 'James', 'Kato', 'hod', 7, 4, '0706000007'),
('hod.mec@uems.ac.ug', @HASH, 'Sarah', 'Tendo', 'hod', 8, 4, '0706000008'),
('hod.tel@uems.ac.ug', @HASH, 'Robert', 'Mugambwa', 'hod', 9, 4, '0706000009'),

-- LAW DEPARTMENTS (College 5)
('hod.law@uems.ac.ug', @HASH, 'Julius', 'Businge', 'hod', 10, 5, '0706000010'),
('hod.cml@uems.ac.ug', @HASH, 'Monica', 'Kyomugisha', 'hod', 11, 5, '0706000011'),
('hod.iel@uems.ac.ug', @HASH, 'Patrick', 'Mugisha', 'hod', 12, 5, '0706000012'),
('hod.ipl@uems.ac.ug', @HASH, 'Susan', 'Namutebi', 'hod', 13, 5, '0706000013'),

-- COMPUTING & MATHEMATICS DEPARTMENTS (College 6)
('hod.cs@uems.ac.ug', @HASH, 'Derrick', 'Mugisha', 'hod', 14, 6, '0706000014'),
('hod.it@uems.ac.ug', @HASH, 'Moses', 'Nabende', 'hod', 15, 6, '0706000015'),
('hod.se@uems.ac.ug', @HASH, 'Daniel', 'Okumu', 'hod', 16, 6, '0706000016'),
('hod.math@uems.ac.ug', @HASH, 'Caroline', 'Nabirye', 'hod', 17, 6, '0706000017'),

-- NATURAL SCIENCES DEPARTMENTS (College 7)
('hod.env@uems.ac.ug', @HASH, 'Catherine', 'Nalwoga', 'hod', 18, 7, '0706000018'),
('hod.phy@uems.ac.ug', @HASH, 'Rogers', 'Wamala', 'hod', 19, 7, '0706000019'),
('hod.chem@uems.ac.ug', @HASH, 'Isaac', 'Baluku', 'hod', 20, 7, '0706000020'),
('hod.bio@uems.ac.ug', @HASH, 'Lydia', 'Namara', 'hod', 21, 7, '0706000021'),

-- PUBLIC HEALTH DEPARTMENTS (College 8)
('hod.ph@uems.ac.ug', @HASH, 'David', 'Tumusiime', 'hod', 22, 8, '0706000022'),
('hod.epid@uems.ac.ug', @HASH, 'Grace', 'Nakato', 'hod', 23, 8, '0706000023'),
('hod.hsm@uems.ac.ug', @HASH, 'Andrew', 'Kisembo', 'hod', 24, 8, '0706000024'),

-- BUSINESS DEPARTMENTS (College 9)
('hod.acc@uems.ac.ug', @HASH, 'Thomas', 'Wasswa', 'hod', 25, 9, '0706000025'),
('hod.bus@uems.ac.ug', @HASH, 'Joyce', 'Nalubega', 'hod', 26, 9, '0706000026'),
('hod.hrm@uems.ac.ug', @HASH, 'Richard', 'Kigozi', 'hod', 27, 9, '0706000027'),
('hod.mkt@uems.ac.ug', @HASH, 'Esther', 'Nabatanzi', 'hod', 28, 9, '0706000028'),
('hod.ent@uems.ac.ug', @HASH, 'Peter', 'Muwanga', 'hod', 29, 9, '0706000029'),
('hod.eco@uems.ac.ug', @HASH, 'Samuel', 'Kyeyune', 'hod', 30, 9, '0706000030'),
('hod.scm@uems.ac.ug', @HASH, 'Rebecca', 'Nakafeero', 'hod', 31, 9, '0706000031'),

-- EDUCATION DEPARTMENTS (College 10)
('hod.edu@uems.ac.ug', @HASH, 'Matthew', 'Kigozi', 'hod', 32, 10, '0706000032'),
('hod.eng@uems.ac.ug', @HASH, 'Dorothy', 'Nansubuga', 'hod', 33, 10, '0706000033'),
('hod.ling@uems.ac.ug', @HASH, 'Stephen', 'Ssematimba', 'hod', 34, 10, '0706000034'),
('hod.edadmin@uems.ac.ug', @HASH, 'Janet', 'Namukasa', 'hod', 35, 10, '0706000035'),

-- SOCIAL SCIENCES DEPARTMENTS (College 11)
('hod.sws@uems.ac.ug', @HASH, 'Peter', 'Namugera', 'hod', 36, 11, '0706000036'),
('hod.gic@uems.ac.ug', @HASH, 'Rose', 'Nalule', 'hod', 37, 11, '0706000037'),
('hod.psy@uems.ac.ug', @HASH, 'Martin', 'Ssali', 'hod', 38, 11, '0706000038'),
('hod.dvs@uems.ac.ug', @HASH, 'Mary', 'Kemigisha', 'hod', 39, 11, '0706000039'),
('hod.crp@uems.ac.ug', @HASH, 'Alex', 'Mugisha', 'hod', 40, 11, '0706000040'),
('hod.mco@uems.ac.ug', @HASH, 'Patricia', 'Nabukenya', 'hod', 41, 11, '0706000041'),
('hod.pad@uems.ac.ug', @HASH, 'George', 'Kisitu', 'hod', 42, 11, '0706000042'),
('hod.pol@uems.ac.ug', @HASH, 'Lydia', 'Nansikombi', 'hod', 43, 11, '0706000043'),

-- ============================================================
-- LECTURERS - Multiple lecturers per department
-- ============================================================

-- Agriculture Department (dept 1, college 1)
('lect.agric1@uems.ac.ug', @HASH, 'Joseph', 'Wandera', 'lecturer', 1, 1, '0707000001'),
('lect.agric2@uems.ac.ug', @HASH, 'Esther', 'Namuli', 'lecturer', 1, 1, '0707000002'),
('lect.agric3@uems.ac.ug', @HASH, 'Robert', 'Ocen', 'lecturer', 1, 1, '0707000003'),
('lect.agric4@uems.ac.ug', @HASH, 'Grace', 'Auma', 'lecturer', 1, 1, '0707000004'),

-- Agribusiness Department (dept 2, college 1)
('lect.agbus1@uems.ac.ug', @HASH, 'Peter', 'Wasswa', 'lecturer', 2, 1, '0707000005'),
('lect.agbus2@uems.ac.ug', @HASH, 'Sarah', 'Nakato', 'lecturer', 2, 1, '0707000006'),
('lect.agbus3@uems.ac.ug', @HASH, 'David', 'Okello', 'lecturer', 2, 1, '0707000007'),

-- Environmental Studies Department (dept 3, college 1)
('lect.envs1@uems.ac.ug', @HASH, 'Catherine', 'Nalwoga', 'lecturer', 3, 1, '0707000008'),
('lect.envs2@uems.ac.ug', @HASH, 'James', 'Otim', 'lecturer', 3, 1, '0707000009'),
('lect.envs3@uems.ac.ug', @HASH, 'Ruth', 'Nabukenya', 'lecturer', 3, 1, '0707000010'),

-- Professional Studies Department (dept 4, college 2)
('lect.prof1@uems.ac.ug', @HASH, 'Sarah', 'Nabirye', 'lecturer', 4, 2, '0707000011'),
('lect.prof2@uems.ac.ug', @HASH, 'David', 'Mugisha', 'lecturer', 4, 2, '0707000012'),
('lect.prof3@uems.ac.ug', @HASH, 'Grace', 'Namukasa', 'lecturer', 4, 2, '0707000013'),

-- Distance Learning Department (dept 5, college 3)
('lect.ddel1@uems.ac.ug', @HASH, 'Ronald', 'Kato', 'lecturer', 5, 3, '0707000014'),
('lect.ddel2@uems.ac.ug', @HASH, 'Mary', 'Nalwoga', 'lecturer', 5, 3, '0707000015'),
('lect.ddel3@uems.ac.ug', @HASH, 'Peter', 'Mugisha', 'lecturer', 5, 3, '0707000016'),

-- Civil Engineering Department (dept 6, college 4)
('lect.civ1@uems.ac.ug', @HASH, 'Francis', 'Okello', 'lecturer', 6, 4, '0707000017'),
('lect.civ2@uems.ac.ug', @HASH, 'Sarah', 'Nabukenya', 'lecturer', 6, 4, '0707000018'),
('lect.civ3@uems.ac.ug', @HASH, 'David', 'Wasswa', 'lecturer', 6, 4, '0707000019'),
('lect.civ4@uems.ac.ug', @HASH, 'Grace', 'Namuli', 'lecturer', 6, 4, '0707000020'),
('lect.civ5@uems.ac.ug', @HASH, 'Robert', 'Mugisha', 'lecturer', 6, 4, '0707000021'),

-- Electrical Engineering Department (dept 7, college 4)
('lect.ele1@uems.ac.ug', @HASH, 'James', 'Kato', 'lecturer', 7, 4, '0707000022'),
('lect.ele2@uems.ac.ug', @HASH, 'Sarah', 'Nabatanzi', 'lecturer', 7, 4, '0707000023'),
('lect.ele3@uems.ac.ug', @HASH, 'David', 'Mugisha', 'lecturer', 7, 4, '0707000024'),
('lect.ele4@uems.ac.ug', @HASH, 'Grace', 'Nalwoga', 'lecturer', 7, 4, '0707000025'),
('lect.ele5@uems.ac.ug', @HASH, 'Robert', 'Wasswa', 'lecturer', 7, 4, '0707000026'),

-- Mechanical Engineering Department (dept 8, college 4)
('lect.mec1@uems.ac.ug', @HASH, 'Sarah', 'Tendo', 'lecturer', 8, 4, '0707000027'),
('lect.mec2@uems.ac.ug', @HASH, 'David', 'Kato', 'lecturer', 8, 4, '0707000028'),
('lect.mec3@uems.ac.ug', @HASH, 'Grace', 'Nabukenya', 'lecturer', 8, 4, '0707000029'),
('lect.mec4@uems.ac.ug', @HASH, 'Robert', 'Mugisha', 'lecturer', 8, 4, '0707000030'),

-- Telecommunications Engineering Department (dept 9, college 4)
('lect.tel1@uems.ac.ug', @HASH, 'Robert', 'Mugambwa', 'lecturer', 9, 4, '0707000031'),
('lect.tel2@uems.ac.ug', @HASH, 'Sarah', 'Nalwoga', 'lecturer', 9, 4, '0707000032'),
('lect.tel3@uems.ac.ug', @HASH, 'David', 'Wasswa', 'lecturer', 9, 4, '0707000033'),
('lect.tel4@uems.ac.ug', @HASH, 'Grace', 'Namukasa', 'lecturer', 9, 4, '0707000034'),

-- Law Department (dept 10, college 5)
('lect.law1@uems.ac.ug', @HASH, 'Robert', 'Turyasingura', 'lecturer', 10, 5, '0707000035'),
('lect.law2@uems.ac.ug', @HASH, 'Grace', 'Nabukeera', 'lecturer', 10, 5, '0707000036'),
('lect.law3@uems.ac.ug', @HASH, 'James', 'Mugisha', 'lecturer', 10, 5, '0707000037'),
('lect.law4@uems.ac.ug', @HASH, 'Sarah', 'Namukasa', 'lecturer', 10, 5, '0707000038'),
('lect.law5@uems.ac.ug', @HASH, 'David', 'Kato', 'lecturer', 10, 5, '0707000039'),

-- Commercial Law Department (dept 11, college 5)
('lect.cml1@uems.ac.ug', @HASH, 'Monica', 'Kyomugisha', 'lecturer', 11, 5, '0707000040'),
('lect.cml2@uems.ac.ug', @HASH, 'Peter', 'Wasswa', 'lecturer', 11, 5, '0707000041'),
('lect.cml3@uems.ac.ug', @HASH, 'Ruth', 'Nabatanzi', 'lecturer', 11, 5, '0707000042'),

-- International and Economic Law Department (dept 12, college 5)
('lect.iel1@uems.ac.ug', @HASH, 'Patrick', 'Mugisha', 'lecturer', 12, 5, '0707000043'),
('lect.iel2@uems.ac.ug', @HASH, 'Sarah', 'Nabukeera', 'lecturer', 12, 5, '0707000044'),
('lect.iel3@uems.ac.ug', @HASH, 'David', 'Kisitu', 'lecturer', 12, 5, '0707000045'),

-- Intellectual Property Law Department (dept 13, college 5)
('lect.ipl1@uems.ac.ug', @HASH, 'Susan', 'Namutebi', 'lecturer', 13, 5, '0707000046'),
('lect.ipl2@uems.ac.ug', @HASH, 'Robert', 'Mugerwa', 'lecturer', 13, 5, '0707000047'),
('lect.ipl3@uems.ac.ug', @HASH, 'Grace', 'Nalwoga', 'lecturer', 13, 5, '0707000048'),

-- Computer Science Department (dept 14, college 6)
('lect.cs1@uems.ac.ug', @HASH, 'Paul', 'Mutebi', 'lecturer', 14, 6, '0707000049'),
('lect.cs2@uems.ac.ug', @HASH, 'Sarah', 'Nakibuuka', 'lecturer', 14, 6, '0707000050'),
('lect.cs3@uems.ac.ug', @HASH, 'Robert', 'Kakembo', 'lecturer', 14, 6, '0707000051'),
('lect.cs4@uems.ac.ug', @HASH, 'Grace', 'Nabukeera', 'lecturer', 14, 6, '0707000052'),
('lect.cs5@uems.ac.ug', @HASH, 'David', 'Ssempijja', 'lecturer', 14, 6, '0707000053'),

-- Information Technology Department (dept 15, college 6)
('lect.it1@uems.ac.ug', @HASH, 'Moses', 'Nabende', 'lecturer', 15, 6, '0707000054'),
('lect.it2@uems.ac.ug', @HASH, 'Esther', 'Namuli', 'lecturer', 15, 6, '0707000055'),
('lect.it3@uems.ac.ug', @HASH, 'Henry', 'Kato', 'lecturer', 15, 6, '0707000056'),
('lect.it4@uems.ac.ug', @HASH, 'Joyce', 'Nalwadda', 'lecturer', 15, 6, '0707000057'),
('lect.it5@uems.ac.ug', @HASH, 'Richard', 'Mugisha', 'lecturer', 15, 6, '0707000058'),

-- Software Engineering Department (dept 16, college 6)
('lect.se1@uems.ac.ug', @HASH, 'Daniel', 'Okumu', 'lecturer', 16, 6, '0707000059'),
('lect.se2@uems.ac.ug', @HASH, 'Catherine', 'Nabatanzi', 'lecturer', 16, 6, '0707000060'),
('lect.se3@uems.ac.ug', @HASH, 'Peter', 'Lwanga', 'lecturer', 16, 6, '0707000061'),
('lect.se4@uems.ac.ug', @HASH, 'Sarah', 'Nabukeera', 'lecturer', 16, 6, '0707000062'),
('lect.se5@uems.ac.ug', @HASH, 'Thomas', 'Ssali', 'lecturer', 16, 6, '0707000063'),

-- Mathematics Department (dept 17, college 6)
('lect.math1@uems.ac.ug', @HASH, 'Robert', 'Wandera', 'lecturer', 17, 6, '0707000064'),
('lect.math2@uems.ac.ug', @HASH, 'Alice', 'Nakintu', 'lecturer', 17, 6, '0707000065'),
('lect.math3@uems.ac.ug', @HASH, 'John', 'Kisakye', 'lecturer', 17, 6, '0707000066'),
('lect.math4@uems.ac.ug', @HASH, 'Grace', 'Namugga', 'lecturer', 17, 6, '0707000067'),
('lect.math5@uems.ac.ug', @HASH, 'David', 'Mugerwa', 'lecturer', 17, 6, '0707000068'),

-- Environmental Management Department (dept 18, college 7)
('lect.env1@uems.ac.ug', @HASH, 'Catherine', 'Nalwoga', 'lecturer', 18, 7, '0707000069'),
('lect.env2@uems.ac.ug', @HASH, 'James', 'Otim', 'lecturer', 18, 7, '0707000070'),
('lect.env3@uems.ac.ug', @HASH, 'Ruth', 'Nabukenya', 'lecturer', 18, 7, '0707000071'),
('lect.env4@uems.ac.ug', @HASH, 'Paul', 'Okello', 'lecturer', 18, 7, '0707000072'),

-- Physics Department (dept 19, college 7)
('lect.phy1@uems.ac.ug', @HASH, 'Samuel', 'Okello', 'lecturer', 19, 7, '0707000073'),
('lect.phy2@uems.ac.ug', @HASH, 'Mary', 'Achan', 'lecturer', 19, 7, '0707000074'),
('lect.phy3@uems.ac.ug', @HASH, 'Joseph', 'Ocaya', 'lecturer', 19, 7, '0707000075'),
('lect.phy4@uems.ac.ug', @HASH, 'Grace', 'Atim', 'lecturer', 19, 7, '0707000076'),

-- Chemistry Department (dept 20, college 7)
('lect.chem1@uems.ac.ug', @HASH, 'Isaac', 'Okurut', 'lecturer', 20, 7, '0707000077'),
('lect.chem2@uems.ac.ug', @HASH, 'Susan', 'Kemigisha', 'lecturer', 20, 7, '0707000078'),
('lect.chem3@uems.ac.ug', @HASH, 'Patrick', 'Odongo', 'lecturer', 20, 7, '0707000079'),
('lect.chem4@uems.ac.ug', @HASH, 'Rebecca', 'Nanyonjo', 'lecturer', 20, 7, '0707000080'),

-- Biology Department (dept 21, college 7)
('lect.bio1@uems.ac.ug', @HASH, 'Lydia', 'Nabukenya', 'lecturer', 21, 7, '0707000081'),
('lect.bio2@uems.ac.ug', @HASH, 'Charles', 'Mugisha', 'lecturer', 21, 7, '0707000082'),
('lect.bio3@uems.ac.ug', @HASH, 'Sarah', 'Namayanja', 'lecturer', 21, 7, '0707000083'),
('lect.bio4@uems.ac.ug', @HASH, 'Peter', 'Okot', 'lecturer', 21, 7, '0707000084'),

-- Public Health Department (dept 22, college 8)
('lect.ph1@uems.ac.ug', @HASH, 'David', 'Kato', 'lecturer', 22, 8, '0707000085'),
('lect.ph2@uems.ac.ug', @HASH, 'Sarah', 'Nabirye', 'lecturer', 22, 8, '0707000086'),
('lect.ph3@uems.ac.ug', @HASH, 'James', 'Okello', 'lecturer', 22, 8, '0707000087'),
('lect.ph4@uems.ac.ug', @HASH, 'Mary', 'Nakafeero', 'lecturer', 22, 8, '0707000088'),

-- Epidemiology Department (dept 23, college 8)
('lect.epid1@uems.ac.ug', @HASH, 'Grace', 'Nabukenya', 'lecturer', 23, 8, '0707000089'),
('lect.epid2@uems.ac.ug', @HASH, 'Robert', 'Mugisha', 'lecturer', 23, 8, '0707000090'),
('lect.epid3@uems.ac.ug', @HASH, 'John', 'Otim', 'lecturer', 23, 8, '0707000091'),

-- Health Systems Management Department (dept 24, college 8)
('lect.hsm1@uems.ac.ug', @HASH, 'Sarah', 'Nabatanzi', 'lecturer', 24, 8, '0707000092'),
('lect.hsm2@uems.ac.ug', @HASH, 'David', 'Kisitu', 'lecturer', 24, 8, '0707000093'),
('lect.hsm3@uems.ac.ug', @HASH, 'Esther', 'Nalwoga', 'lecturer', 24, 8, '0707000094'),

-- Accounting Department (dept 25, college 9)
('lect.acc1@uems.ac.ug', @HASH, 'Geoffrey', 'Nsubuga', 'lecturer', 25, 9, '0707000095'),
('lect.acc2@uems.ac.ug', @HASH, 'Sarah', 'Nabukenya', 'lecturer', 25, 9, '0707000096'),
('lect.acc3@uems.ac.ug', @HASH, 'David', 'Wasswa', 'lecturer', 25, 9, '0707000097'),
('lect.acc4@uems.ac.ug', @HASH, 'Grace', 'Namuli', 'lecturer', 25, 9, '0707000098'),
('lect.acc5@uems.ac.ug', @HASH, 'Robert', 'Kigozi', 'lecturer', 25, 9, '0707000099'),

-- Business Administration Department (dept 26, college 9)
('lect.bus1@uems.ac.ug', @HASH, 'Joyce', 'Nalubega', 'lecturer', 26, 9, '0707000100'),
('lect.bus2@uems.ac.ug', @HASH, 'Peter', 'Mugisha', 'lecturer', 26, 9, '0707000101'),
('lect.bus3@uems.ac.ug', @HASH, 'Sarah', 'Nabatanzi', 'lecturer', 26, 9, '0707000102'),
('lect.bus4@uems.ac.ug', @HASH, 'David', 'Kato', 'lecturer', 26, 9, '0707000103'),
('lect.bus5@uems.ac.ug', @HASH, 'Grace', 'Nalwadda', 'lecturer', 26, 9, '0707000104'),

-- Human Resource Management Department (dept 27, college 9)
('lect.hrm1@uems.ac.ug', @HASH, 'Richard', 'Kigozi', 'lecturer', 27, 9, '0707000105'),
('lect.hrm2@uems.ac.ug', @HASH, 'Sarah', 'Nabukeera', 'lecturer', 27, 9, '0707000106'),
('lect.hrm3@uems.ac.ug', @HASH, 'David', 'Mugisha', 'lecturer', 27, 9, '0707000107'),
('lect.hrm4@uems.ac.ug', @HASH, 'Grace', 'Namukasa', 'lecturer', 27, 9, '0707000108'),

-- Marketing Department (dept 28, college 9)
('lect.mkt1@uems.ac.ug', @HASH, 'Esther', 'Nabatanzi', 'lecturer', 28, 9, '0707000109'),
('lect.mkt2@uems.ac.ug', @HASH, 'Peter', 'Wasswa', 'lecturer', 28, 9, '0707000110'),
('lect.mkt3@uems.ac.ug', @HASH, 'Sarah', 'Nalwoga', 'lecturer', 28, 9, '0707000111'),
('lect.mkt4@uems.ac.ug', @HASH, 'David', 'Kisitu', 'lecturer', 28, 9, '0707000112'),

-- Entrepreneurship Department (dept 29, college 9)
('lect.ent1@uems.ac.ug', @HASH, 'Peter', 'Muwanga', 'lecturer', 29, 9, '0707000113'),
('lect.ent2@uems.ac.ug', @HASH, 'Grace', 'Nabukenya', 'lecturer', 29, 9, '0707000114'),
('lect.ent3@uems.ac.ug', @HASH, 'Robert', 'Mugisha', 'lecturer', 29, 9, '0707000115'),

-- Economics Department (dept 30, college 9)
('lect.eco1@uems.ac.ug', @HASH, 'Samuel', 'Kyeyune', 'lecturer', 30, 9, '0707000116'),
('lect.eco2@uems.ac.ug', @HASH, 'Sarah', 'Namuli', 'lecturer', 30, 9, '0707000117'),
('lect.eco3@uems.ac.ug', @HASH, 'David', 'Okello', 'lecturer', 30, 9, '0707000118'),
('lect.eco4@uems.ac.ug', @HASH, 'Grace', 'Nabatanzi', 'lecturer', 30, 9, '0707000119'),

-- Supply Chain Management Department (dept 31, college 9)
('lect.scm1@uems.ac.ug', @HASH, 'Rebecca', 'Nakafeero', 'lecturer', 31, 9, '0707000120'),
('lect.scm2@uems.ac.ug', @HASH, 'Peter', 'Mugisha', 'lecturer', 31, 9, '0707000121'),
('lect.scm3@uems.ac.ug', @HASH, 'Sarah', 'Nabukenya', 'lecturer', 31, 9, '0707000122'),

-- Education Department (dept 32, college 10)
('lect.edu1@uems.ac.ug', @HASH, 'Matthew', 'Kigozi', 'lecturer', 32, 10, '0707000123'),
('lect.edu2@uems.ac.ug', @HASH, 'Sarah', 'Nalwoga', 'lecturer', 32, 10, '0707000124'),
('lect.edu3@uems.ac.ug', @HASH, 'David', 'Wasswa', 'lecturer', 32, 10, '0707000125'),
('lect.edu4@uems.ac.ug', @HASH, 'Grace', 'Namukasa', 'lecturer', 32, 10, '0707000126'),
('lect.edu5@uems.ac.ug', @HASH, 'Robert', 'Mugisha', 'lecturer', 32, 10, '0707000127'),

-- English Department (dept 33, college 10)
('lect.eng1@uems.ac.ug', @HASH, 'Dorothy', 'Nansubuga', 'lecturer', 33, 10, '0707000128'),
('lect.eng2@uems.ac.ug', @HASH, 'Peter', 'Mugisha', 'lecturer', 33, 10, '0707000129'),
('lect.eng3@uems.ac.ug', @HASH, 'Sarah', 'Nabatanzi', 'lecturer', 33, 10, '0707000130'),
('lect.eng4@uems.ac.ug', @HASH, 'David', 'Kisitu', 'lecturer', 33, 10, '0707000131'),

-- Linguistics Department (dept 34, college 10)
('lect.ling1@uems.ac.ug', @HASH, 'Stephen', 'Ssematimba', 'lecturer', 34, 10, '0707000132'),
('lect.ling2@uems.ac.ug', @HASH, 'Grace', 'Nabukenya', 'lecturer', 34, 10, '0707000133'),
('lect.ling3@uems.ac.ug', @HASH, 'Robert', 'Mugisha', 'lecturer', 34, 10, '0707000134'),

-- Educational Administration Department (dept 35, college 10)
('lect.edadmin1@uems.ac.ug', @HASH, 'Janet', 'Namukasa', 'lecturer', 35, 10, '0707000135'),
('lect.edadmin2@uems.ac.ug', @HASH, 'Peter', 'Wasswa', 'lecturer', 35, 10, '0707000136'),
('lect.edadmin3@uems.ac.ug', @HASH, 'Sarah', 'Nalwoga', 'lecturer', 35, 10, '0707000137'),

-- Social Work Department (dept 36, college 11)
('lect.sws1@uems.ac.ug', @HASH, 'Peter', 'Namugera', 'lecturer', 36, 11, '0707000138'),
('lect.sws2@uems.ac.ug', @HASH, 'Sarah', 'Nabukenya', 'lecturer', 36, 11, '0707000139'),
('lect.sws3@uems.ac.ug', @HASH, 'David', 'Wasswa', 'lecturer', 36, 11, '0707000140'),
('lect.sws4@uems.ac.ug', @HASH, 'Grace', 'Namuli', 'lecturer', 36, 11, '0707000141'),

-- Guidance and Counselling Department (dept 37, college 11)
('lect.gic1@uems.ac.ug', @HASH, 'Rose', 'Nalule', 'lecturer', 37, 11, '0707000142'),
('lect.gic2@uems.ac.ug', @HASH, 'Peter', 'Mugisha', 'lecturer', 37, 11, '0707000143'),
('lect.gic3@uems.ac.ug', @HASH, 'Sarah', 'Nabatanzi', 'lecturer', 37, 11, '0707000144'),
('lect.gic4@uems.ac.ug', @HASH, 'David', 'Kisitu', 'lecturer', 37, 11, '0707000145'),

-- Psychology Department (dept 38, college 11)
('lect.psy1@uems.ac.ug', @HASH, 'Martin', 'Ssali', 'lecturer', 38, 11, '0707000146'),
('lect.psy2@uems.ac.ug', @HASH, 'Sarah', 'Nalwoga', 'lecturer', 38, 11, '0707000147'),
('lect.psy3@uems.ac.ug', @HASH, 'David', 'Mugisha', 'lecturer', 38, 11, '0707000148'),
('lect.psy4@uems.ac.ug', @HASH, 'Grace', 'Nabukenya', 'lecturer', 38, 11, '0707000149'),

-- Development Studies Department (dept 39, college 11)
('lect.dvs1@uems.ac.ug', @HASH, 'Mary', 'Kemigisha', 'lecturer', 39, 11, '0707000150'),
('lect.dvs2@uems.ac.ug', @HASH, 'Peter', 'Wasswa', 'lecturer', 39, 11, '0707000151'),
('lect.dvs3@uems.ac.ug', @HASH, 'Sarah', 'Nalwoga', 'lecturer', 39, 11, '0707000152'),

-- Conflict Resolution and Peace Department (dept 40, college 11)
('lect.crp1@uems.ac.ug', @HASH, 'Alex', 'Mugisha', 'lecturer', 40, 11, '0707000153'),
('lect.crp2@uems.ac.ug', @HASH, 'Grace', 'Nabukenya', 'lecturer', 40, 11, '0707000154'),
('lect.crp3@uems.ac.ug', @HASH, 'David', 'Kato', 'lecturer', 40, 11, '0707000155'),

-- Mass Communication Department (dept 41, college 11)
('lect.mco1@uems.ac.ug', @HASH, 'Patricia', 'Nabukenya', 'lecturer', 41, 11, '0707000156'),
('lect.mco2@uems.ac.ug', @HASH, 'Peter', 'Mugisha', 'lecturer', 41, 11, '0707000157'),
('lect.mco3@uems.ac.ug', @HASH, 'Sarah', 'Nalwoga', 'lecturer', 41, 11, '0707000158'),
('lect.mco4@uems.ac.ug', @HASH, 'David', 'Wasswa', 'lecturer', 41, 11, '0707000159'),

-- Public Administration Department (dept 42, college 11)
('lect.pad1@uems.ac.ug', @HASH, 'George', 'Kisitu', 'lecturer', 42, 11, '0707000160'),
('lect.pad2@uems.ac.ug', @HASH, 'Sarah', 'Nabukenya', 'lecturer', 42, 11, '0707000161'),
('lect.pad3@uems.ac.ug', @HASH, 'David', 'Mugisha', 'lecturer', 42, 11, '0707000162'),
('lect.pad4@uems.ac.ug', @HASH, 'Grace', 'Namuli', 'lecturer', 42, 11, '0707000163'),

-- Political Science Department (dept 43, college 11)
('lect.pol1@uems.ac.ug', @HASH, 'Lydia', 'Nansikombi', 'lecturer', 43, 11, '0707000164'),
('lect.pol2@uems.ac.ug', @HASH, 'Peter', 'Wasswa', 'lecturer', 43, 11, '0707000165'),
('lect.pol3@uems.ac.ug', @HASH, 'David', 'Kato', 'lecturer', 43, 11, '0707000166'),
('lect.pol4@uems.ac.ug', @HASH, 'Sarah', 'Nalwoga', 'lecturer', 43, 11, '0707000167');



INSERT INTO courses (code, title, level, semester, credit_units, college_id, department_id, hod_id, description, is_active) VALUES
-- Year 1, Semester 1
('UCC1101', 'English Language Skills', 1, 1, 3, 10, 33, 49, 'Core university course focusing on developing English language proficiency and communication skills', TRUE),
('UCC1102', 'Introduction to Computer Fundamentals', 1, 1, 3, 6, 14, 30, 'Introduction to basic computer concepts, hardware, software, and operating systems', TRUE),
('ITE1101', 'Introduction to Information Technology', 1, 1, 3, 6, 15, 31, 'Overview of IT concepts, applications, and role in modern society', TRUE),
('COS1202', 'Computer Applications', 1, 1, 3, 6, 14, 30, 'Practical training in office productivity software and computer applications', TRUE),
('ITE1102', 'Mathematical Techniques for IS-IT', 1, 1, 3, 6, 15, 31, 'Mathematical foundations for information systems and information technology', TRUE),
('ITE1103', 'Introduction to Programming Logic', 1, 1, 3, 6, 15, 31, 'Fundamental concepts of algorithmic thinking, flowcharts, and structured programming principles', TRUE),

-- Year 1, Semester 2
('ITE1201', 'Internet Technologies & Web-Page Authoring (Website Design)', 1, 2, 3, 6, 15, 31, 'Introduction to internet technologies, HTML, CSS, and web design principles', TRUE),
('DIT1202', 'Computer Operations and Maintenance', 1, 2, 3, 6, 15, 31, 'Computer hardware operations, troubleshooting, and maintenance procedures', TRUE),
('COS1203', 'Network Fundamentals', 1, 2, 3, 6, 14, 30, 'Introduction to computer networking concepts and protocols', TRUE),
('DIT1201', 'Fundamentals of Networking', 1, 2, 3, 6, 15, 31, 'Alternative code - Basic networking principles and technologies', TRUE),
('UCC1201', 'Communication Skills', 1, 2, 3, 10, 33, 49, 'Development of effective written and oral communication skills', TRUE),
('DCS1102', 'Programming Fundamentals', 1, 2, 3, 6, 14, 30, 'Introduction to programming concepts and problem-solving techniques', TRUE),
('COS1204', 'Structured Programming', 1, 2, 3, 6, 14, 30, 'Alternative code - Structured programming methodologies and techniques', TRUE),

-- Year 2, Semester 2
('ENT2201', 'Entrepreneurship Development II', 2, 2, 3, 9, 29, 45, 'Advanced entrepreneurship concepts, business planning, and venture management', TRUE),
('DIT2202', 'Information Security Fundamentals', 2, 2, 3, 6, 15, 31, 'Basic concepts of information security, threats, and protection mechanisms', TRUE),
('DCS2201', 'Computer Networks and Systems Administration', 2, 2, 3, 6, 14, 30, 'Network administration, configuration, and systems management', TRUE),
('COS2102', 'Systems Analysis and Design', 2, 2, 3, 6, 14, 30, 'Methods and techniques for analyzing and designing information systems', TRUE),

-- ============================================================================
-- BACHELOR OF INFORMATION TECHNOLOGY COURSES
-- ============================================================================

-- Year 1, Semester 1 (some shared with Diploma)
('IFS1101', 'Fundamentals of Information Technology', 1, 1, 3, 6, 15, 31, 'Comprehensive introduction to IT principles and applications', TRUE),
('HRM1101', 'Principles and Practices of Management', 1, 1, 3, 9, 27, 43, 'Introduction to management theory and organizational behavior', TRUE),

-- Year 1, Semester 2
('STA1207', 'Introduction to Probability and Statistics', 1, 2, 3, 6, 17, 32, 'Statistical concepts, probability theory, and data analysis', TRUE),
('ITE1202', 'Electronic Commerce', 1, 2, 3, 6, 15, 31, 'E-commerce technologies, business models, and online transactions', TRUE),
('COS1201', 'Fundamentals of Programming', 1, 2, 3, 6, 14, 30, 'Core programming concepts and algorithm development', TRUE),
('ITE2201', 'Web Site Design, Programming and Administration', 1, 2, 3, 6, 15, 31, 'Web development and administration', TRUE),

-- Year 2, Semester 2
('ITE2203', 'Graphics and Multimedia Applications', 2, 2, 3, 6, 15, 31, 'Digital graphics, multimedia design, and production tools', TRUE),
('COS2208', 'Software Engineering', 2, 2, 3, 6, 16, 19, 'Software development lifecycle, methodologies, and best practices', TRUE),
('ITE2205', 'Systems Dynamics and Simulation', 2, 2, 3, 6, 15, 31, 'Modeling and simulation of complex systems', TRUE),
('ITE3105', 'Data Warehousing', 2, 2, 3, 6, 15, 31, 'Data warehouse concepts, design, and implementation', TRUE),
('CEN2202', 'Computer Networks and Data Communications', 2, 2, 3, 6, 14, 30, 'Advanced networking and data communication technologies', TRUE),
('COS3104', 'Emerging Trends in Computer Science', 2, 2, 3, 6, 14, 30, 'Current and emerging technologies in computer science', TRUE),
('ITE2202', 'Emerging Trends in Information Technology', 2, 2, 3, 6, 15, 31, 'Alternative code - Latest IT trends and innovations', TRUE),
('COS3103', 'Operating Systems', 2, 2, 3, 6, 14, 30, 'Operating system concepts, design, and implementation', TRUE),

-- Year 3, Semester 1
('ITE3106', 'Network and Information Security', 3, 1, 3, 6, 15, 31, 'Advanced security concepts, cryptography, and network protection', TRUE),
('CEN3101', 'Network Administration and Configuration', 3, 1, 3, 6, 14, 30, 'Advanced network management and configuration techniques', TRUE),
('ITE3101', 'IT Audit', 3, 1, 3, 6, 15, 31, 'IT auditing principles, standards, and methodologies', TRUE),
('ITE3103', 'Web Design, Programming, and Administration', 3, 1, 3, 6, 15, 31, 'Advanced web development and website management', TRUE),
('ITE3102', 'IT Planning and Management', 3, 1, 3, 6, 15, 31, 'Strategic IT planning and project management', TRUE),
('ITE3107', 'Enterprise Data Management', 3, 1, 3, 6, 15, 31, 'Enterprise-level data management and governance', TRUE),

-- Year 3, Semester 2
('ITE3202', 'Computer and Cyber Forensics', 3, 2, 3, 6, 15, 31, 'Digital forensics, investigation techniques, and cybercrime', TRUE),
('IFS3201', 'Social Issues in Computing', 3, 2, 3, 6, 15, 31, 'Ethical, social, and professional issues in computing', TRUE),
('ITE2204', 'Social & Professional Issues in Computing', 3, 2, 3, 6, 15, 31, 'Alternative code - Ethics and professional responsibility', TRUE),
('COS3201', 'Cloud Computing Principles', 3, 2, 3, 6, 14, 30, 'Cloud computing architectures, services, and deployment models', TRUE),
('ITE3203', 'Principles of Mobile Computing', 3, 2, 3, 6, 15, 31, 'Mobile computing technologies and application development', TRUE),
('COS3204', 'Mobile Application Development', 3, 2, 3, 6, 14, 30, 'Alternative code - Mobile app development platforms and tools', TRUE),
('ITE3207', 'Database Management Systems', 3, 2, 3, 6, 15, 31, 'Database design, SQL, and database administration', TRUE),
('ITE3201', 'Database Management Systems', 3, 2, 3, 6, 15, 31, 'Alternative code - Database concepts and implementation', TRUE),

-- ============================================================================
-- BACHELOR OF SOFTWARE ENGINEERING COURSES
-- ============================================================================

('CSE1203', 'Principles of Software Development', 1, 2, 3, 6, 16, 19, 'Software development principles, methodologies, and practices', TRUE),

-- ============================================================================
-- MASTER OF SCIENCE IN PURE MATHEMATICS COURSES
-- ============================================================================

('MCS7102', 'Research Methods in Computing', 1, 1, 3, 6, 14, 30, 'Research methodologies for computing and IT disciplines', TRUE),
('MCY7102', 'Research Methods for Cybersecurity', 1, 1, 3, 6, 14, 30, 'Research approaches specific to cybersecurity', TRUE),
('MDS7111', 'Research Methods for Data Science and Analytics', 1, 1, 3, 6, 17, 32, 'Research methodologies in data science', TRUE),

-- ============================================================================
-- PhD PROGRAMMES - COMMON COURSES
-- ============================================================================

-- PhD Common Year 1, Semester 1
('UCC9105', 'Information Access and Computer Applications in Research', 1, 1, 3, 6, 14, 30, 'Advanced research tools and information retrieval', TRUE),
('UCC9101', 'Philosophy of Knowledge', 1, 1, 3, 10, 32, 48, 'Epistemology and philosophy of science', TRUE),
('UCC9104', 'Institutional Pedagogy', 1, 1, 3, 10, 32, 48, 'Teaching methodologies for higher education', TRUE),
('UCC9103', 'Advanced Research Methodology', 1, 1, 3, 6, 17, 32, 'Advanced quantitative and qualitative research methods', TRUE),

-- PhD Common Year 1, Semester 2
('UCC9102', 'Scholarly Writing and Publication Skills', 1, 2, 3, 10, 33, 49, 'Academic writing and publication strategies', TRUE),
('CDC9121', 'Research Ethics', 1, 2, 3, 11, 38, 50, 'Ethical principles in research conduct', TRUE),
('CDC9123', 'Advanced Data Analysis', 1, 2, 3, 6, 17, 32, 'Advanced statistical and data analysis techniques', TRUE),

-- ============================================================================
-- MASTER OF PUBLIC HEALTH COURSES
-- ============================================================================

-- Year 1, Semester 1
('MPH414', 'Health Economics & Finance', 1, 1, 3, 8, 22, 38, 'Economic principles in health systems and financing', TRUE),
('MPH412', 'Epidemiology', 1, 1, 3, 8, 23, 39, 'Disease distribution and determinants in populations', TRUE),
('MPH415', 'Communicable & Non Communicable Diseases', 1, 1, 3, 8, 22, 38, 'Prevention and control of diseases', TRUE),
('MPH411', 'Fundamentals of Public Health', 1, 1, 3, 8, 22, 38, 'Core public health concepts and principles', TRUE),
('MPH413', 'Biostatistics', 1, 1, 3, 8, 23, 39, 'Statistical methods in public health research', TRUE),
('MPH416', 'Health Education & Promotion', 1, 1, 3, 8, 22, 38, 'Health behavior change and promotion strategies', TRUE),

-- Year 1, Semester 2
('MPH421', 'Health Policy and Management', 1, 2, 3, 8, 24, 28, 'Health policy development and management', TRUE),
('MPH423', 'Health Communication and Informatics', 1, 2, 3, 8, 22, 38, 'Communication strategies in public health', TRUE),
('MPH425', 'Community Home Based Care', 1, 2, 3, 8, 22, 38, 'Community-based health interventions', TRUE),
('MPH422', 'Occupational Health and Safety', 1, 2, 3, 8, 22, 38, 'Workplace health and safety management', TRUE),
('MPH424', 'Biostatistics II & Computing', 1, 2, 3, 8, 23, 39, 'Advanced biostatistics and computational methods', TRUE),
('UCC8101', 'Research Methodology', 1, 2, 3, 6, 17, 32, 'Masters level research methods', TRUE),

-- Year 2, Semester 1
('MPH515', 'Public Health Ethics and Law', 2, 1, 3, 8, 22, 38, 'Ethical and legal issues in public health', TRUE),
('MPH511', 'Environmental Health', 2, 1, 3, 8, 22, 38, 'Environmental factors affecting population health', TRUE),
('MPH513', 'Demography of Population Health', 2, 1, 3, 8, 22, 38, 'Population dynamics and health indicators', TRUE),
('MPH512', 'Public Health Nutrition', 2, 1, 3, 8, 22, 38, 'Nutrition principles and interventions', TRUE),
('MPH514', 'Disaster Management', 2, 1, 3, 8, 22, 38, 'Emergency preparedness and disaster response', TRUE),

-- PhD in Public Health
('BME9201', 'Epidemiology and Biostatistics', 1, 2, 3, 8, 23, 39, 'Advanced epidemiological and statistical methods', TRUE),



-- ============================================================================
-- MASTER OF SCIENCE IN ENVIRONMENTAL MANAGEMENT COURSES
-- ============================================================================

('ENV7208', 'Waste Management', 1, 2, 3, 7, 18, 34, 'Solid waste management systems and technologies', TRUE),
('ENV7203', 'Environmental Economics', 1, 2, 3, 7, 18, 34, 'Economic analysis of environmental issues', TRUE),
('ENV7201', 'Environmental Law and Ethics', 1, 2, 3, 7, 18, 34, 'Environmental legislation and ethical frameworks', TRUE),
('ENV7206', 'Integrated Water Resource Management', 1, 2, 3, 7, 18, 34, 'Sustainable water resource management', TRUE),
('CBW7104', 'Biostatistics', 1, 2, 3, 7, 21, 37, 'Statistical methods in biological sciences', TRUE),
('ENV7205', 'Energy Environment and Climate Change', 1, 2, 3, 7, 18, 34, 'Climate change impacts and energy systems', TRUE),
('ENV7207', 'Evolutionary and Conservation Genetics', 1, 2, 3, 7, 21, 37, 'Genetic principles in conservation', TRUE),

-- ============================================================================
-- MASTER OF SCIENCE IN PHYSICS (ENERGY SYSTEMS) COURSES
-- ============================================================================

('PHY7109', 'Advanced Classical Mechanics and Special Relativity', 1, 1, 3, 7, 19, 35, 'Advanced mechanics and relativistic physics', TRUE),
('AMP7106', 'Computational Mathematics and Programming', 1, 1, 3, 6, 17, 32, 'Mathematical computing and programming', TRUE),
('RET7116', 'Energy Resources and Conservation Techniques', 1, 1, 3, 7, 19, 35, 'Energy resources and efficiency', TRUE),
('RET7114', 'Bio-energy Technologies', 1, 1, 3, 7, 19, 35, 'Biomass and bioenergy systems', TRUE),
('RET7115', 'Solar Photo-voltaic Technology', 1, 1, 3, 7, 19, 35, 'Solar PV systems and applications', TRUE),
('PHY7101', 'Methods of Mathematical Physics', 1, 1, 3, 7, 19, 35, 'Mathematical techniques in physics', TRUE),
('UCC8201', 'Scholarly Writing and Publication Skills', 1, 1, 3, 10, 33, 49, 'Masters level academic writing', TRUE),

-- ============================================================================
-- MASTER IN AGRICULTURAL EXTENSION AND RURAL INNOVATION COURSES
-- ============================================================================

('MAR7103', 'Innovations for Resilient Agricultural Systems', 1, 1, 3, 1, 1, 17, 'Agricultural innovation and resilience', TRUE),
('MAR7101', 'Agricultural Extension and Innovation Systems', 1, 1, 3, 1, 1, 17, 'Extension services and innovation diffusion', TRUE),
('MAR7104', 'Program Development and Evaluation', 1, 1, 3, 1, 1, 17, 'Agricultural program planning and assessment', TRUE),
('MAR7102', 'Administration and Management of Agricultural Organizations', 1, 1, 3, 1, 1, 17, 'Management of agricultural enterprises', TRUE),
('MAR7108', 'Rural Livelihood and Food Systems', 1, 1, 3, 1, 1, 17, 'Rural development and food security', TRUE),
('MAR7107', 'Crop Production Systems', 1, 1, 3, 1, 1, 17, 'Crop management and production', TRUE),
('MAR7105', 'Farming Systems and Livelihood Analysis', 1, 1, 3, 1, 1, 17, 'Analysis of farming systems', TRUE),

-- ============================================================================
-- BACHELOR OF SCIENCE IN WILDLIFE MANAGEMENT COURSES
-- ============================================================================

('BWM1103', 'Evolutionary Biology', 1, 1, 3, 7, 21, 37, 'Evolution and natural selection principles', TRUE),
('ENV1102', 'Principles of Ecology', 1, 1, 3, 7, 18, 34, 'Ecological concepts and ecosystem dynamics', TRUE),
('BIO1102', 'Invertebrates', 1, 1, 3, 7, 21, 37, 'Study of invertebrate animals', TRUE),

-- ============================================================================
-- BACHELOR OF SCIENCE IN INDUSTRIAL CHEMISTRY COURSES
-- ============================================================================

('MEC2109', 'Fluid Mechanics', 2, 1, 3, 4, 8, 24, 'Fluid properties and flow dynamics', TRUE),

-- ============================================================================
-- DIPLOMA IN ENVIRONMENTAL MANAGEMENT COURSES
-- ============================================================================

('ENV1203', 'Environmental Ethics', 1, 2, 3, 7, 18, 34, 'Ethical approaches to environmental issues', TRUE),
('ENV1201', 'Principles of Natural Resource Management', 1, 2, 3, 7, 18, 34, 'Natural resource conservation and management', TRUE),
('ENV1101', 'Environment & Society', 1, 2, 3, 7, 18, 34, 'Environmental sociology and human-environment interactions', TRUE),
('ENV1202', 'Environmental Sanitation & Community Health', 1, 2, 3, 7, 18, 34, 'Sanitation systems and community health', TRUE),
('ENV1206', 'Population & Environment', 1, 2, 3, 7, 18, 34, 'Population dynamics and environmental impacts', TRUE),
('ENV1207', 'Earth Physical Environment', 1, 2, 3, 7, 18, 34, 'Geophysical processes and earth systems', TRUE),

-- ============================================================================
-- BACHELOR OF LAW (LLB) COURSES
-- ============================================================================

-- Year 1, Semester 1
('LLB1104', 'Law of Contracts I', 1, 1, 3, 5, 10, 26, 'Introduction to contract law principles', TRUE),
('LLB1105', 'Principles of Constitutional Law I', 1, 1, 3, 5, 10, 26, 'Constitutional law fundamentals', TRUE),
('LLB1101', 'Introducing Law', 1, 1, 3, 5, 10, 26, 'Introduction to legal systems and concepts', TRUE),
('LLB1102', 'Law and Development', 1, 1, 3, 5, 10, 26, 'Legal frameworks for development', TRUE),
('LLB1103', 'Fundamentals of Criminal Law', 1, 1, 3, 5, 10, 26, 'Introduction to criminal law', TRUE),

-- Year 1, Semester 2
('LLB1205', 'Principles of Constitutional Law II', 1, 2, 3, 5, 10, 26, 'Advanced constitutional law', TRUE),
('LLB1202', 'Administrative Law', 1, 2, 3, 5, 10, 26, 'Principles of administrative law', TRUE),
('LLB1204', 'Law of Contracts II', 1, 2, 3, 5, 10, 26, 'Advanced contract law', TRUE),
('LLB1203', 'Criminal Liability', 1, 2, 3, 5, 10, 26, 'Criminal responsibility and defenses', TRUE),
('LLB1201', 'Legal Methods', 1, 2, 3, 5, 10, 26, 'Legal research and reasoning', TRUE),

-- Year 2, Semester 1
('LLB2103', 'Family Law I', 2, 1, 3, 5, 10, 26, 'Marriage, divorce, and family relations', TRUE),
('LLB2104', 'Law of Evidence I', 2, 1, 3, 5, 10, 26, 'Rules of evidence and procedure', TRUE),
('LLB2101', 'Nature and History of Torts', 2, 1, 3, 5, 10, 26, 'Tort law principles and development', TRUE),
('LLB2102', 'Equity and Trusts', 2, 1, 3, 5, 10, 26, 'Equitable principles and trust law', TRUE),
('LLB2105', 'Foundations of Land Law', 2, 1, 3, 5, 10, 26, 'Property and land law basics', TRUE),

-- Year 2, Semester 2
('LLB2201', 'Negligence, Strict Liability and Procedure in Torts', 2, 2, 3, 5, 10, 26, 'Advanced tort law', TRUE),
('UCC2101', 'Research Methods', 2, 2, 3, 5, 10, 26, 'Legal research methodology', TRUE),
('LLB2204', 'Law of Evidence II', 2, 2, 3, 5, 10, 26, 'Advanced evidence law', TRUE),
('LLB2203', 'Family Law II', 2, 2, 3, 5, 10, 26, 'Advanced family law', TRUE),
('LLB2205', 'Land Transactions', 2, 2, 3, 5, 10, 26, 'Property transactions and conveyancing', TRUE),

-- Year 3, Semester 1
('LLB3105', 'Banking and Negotiable Instruments', 3, 1, 3, 5, 11, 27, 'Banking law and negotiable instruments', TRUE),
('LLB3104', 'Principles of International Law I', 3, 1, 3, 5, 12, 31, 'Public international law', TRUE),
('LLB3102', 'Law of Sale of Goods', 3, 1, 3, 5, 11, 27, 'Commercial law - sale of goods', TRUE),
('LLB3103', 'Business Associations I', 3, 1, 3, 5, 11, 27, 'Company law and business organizations', TRUE),
('LLB3106', 'Human Rights In Domestic Perspective', 3, 1, 3, 5, 10, 26, 'Human rights in national context', TRUE),
('LLB3101', 'Jurisprudence I', 3, 1, 3, 5, 10, 26, 'Legal philosophy and theory', TRUE),

-- Year 3, Semester 2
('LLB3202', 'Criminal Procedure', 3, 2, 3, 5, 10, 26, 'Criminal trial procedure', TRUE),
('LLB3201', 'Jurisprudence II', 3, 2, 3, 5, 10, 26, 'Advanced legal theory', TRUE),
('LLB3206', 'Environmental Law and Policy', 3, 2, 3, 5, 10, 26, 'Environmental legislation and regulation', TRUE),
('LLB3204', 'Principles of International Law II', 3, 2, 3, 5, 12, 31, 'Advanced international law', TRUE),
('LLB3203', 'Business Association II', 3, 2, 3, 5, 11, 27, 'Advanced company law', TRUE),
('LLB3205', 'Consumer Law and Practice', 3, 2, 3, 5, 11, 27, 'Consumer protection law', TRUE),
('LLB3208', 'Commercial Law (Hire Purchase and Agency)', 3, 2, 3, 5, 11, 27, 'Hire purchase and agency law', TRUE),

-- Year 4, Semester 1
('LLB4101', 'Civil Procedure I', 4, 1, 3, 5, 10, 26, 'Civil litigation procedure', TRUE),
('LLB4106', 'Intellectual Property Law I', 4, 1, 3, 5, 13, 32, 'IP rights and protection', TRUE),
('LLB4109', 'Insurance Law', 4, 1, 3, 5, 11, 27, 'Insurance contracts and regulation', TRUE),
('LLB4104', 'International Trade and Business', 4, 1, 3, 5, 12, 31, 'International commercial law', TRUE),
('LLB4107', 'Labour Law I', 4, 1, 3, 5, 10, 26, 'Employment law and relations', TRUE),
('LLB4108', 'Clinical Legal Education', 4, 1, 3, 5, 10, 26, 'Practical legal skills and ethics', TRUE),
('LLB4103', 'International and Regional Human Rights', 4, 1, 3, 5, 12, 31, 'International human rights law', TRUE),
('LLB4102', 'Revenue Law and Taxation I', 4, 1, 3, 5, 11, 27, 'Tax law and administration', TRUE),

-- Year 4, Semester 2
('LLB4208', 'Insolvency Law', 4, 2, 3, 5, 11, 27, 'Bankruptcy and insolvency', TRUE),
('LLB4202', 'Revenue Law and Taxation II', 4, 2, 3, 5, 11, 27, 'Advanced taxation law', TRUE),
('LLB4201', 'Civil Procedure II', 4, 2, 3, 5, 10, 26, 'Advanced civil procedure', TRUE),
('LLB4206', 'Intellectual Property Law II', 4, 2, 3, 5, 13, 32, 'Advanced IP law', TRUE),
('LLB4207', 'Labour Law II', 4, 2, 3, 5, 10, 26, 'Advanced labour law', TRUE),
('LLB4205', 'Criminology and Penology', 4, 2, 3, 5, 10, 26, 'Criminal justice and corrections', TRUE),
('LLB4203', 'International Humanitarian Law', 4, 2, 3, 5, 12, 31, 'Law of armed conflict', TRUE),
('LLB4204', 'Gender and The Law', 4, 2, 3, 5, 10, 26, 'Gender issues in legal context', TRUE),
('LLB4210', 'Alternative Dispute Resolution', 4, 2, 3, 5, 10, 26, 'Mediation, arbitration, and ADR', TRUE),


-- ============================================================================
-- MASTER OF LAWS COURSES
-- ============================================================================

-- LLM Commercial Law
('IPL7108', 'Intellectual Property Law (Core)', 1, 1, 3, 5, 13, 32, 'Advanced IP law for LLM', TRUE),
('IET7101', 'International Economic Law (Core)', 1, 1, 3, 5, 12, 31, 'International economic legal frameworks', TRUE),
('IET7102', 'International Investment Law', 1, 1, 3, 5, 12, 31, 'Foreign investment law', TRUE),
('IET7104', 'Banking and Financial Law (Elective)', 1, 1, 3, 5, 11, 27, 'Banking regulation and finance law', TRUE),
('LCL7107', 'Corporate Governance Law', 1, 1, 3, 5, 11, 27, 'Corporate governance principles', TRUE),

-- LLM General Law
('PIL7204', 'International Refugee Law', 1, 2, 3, 5, 12, 31, 'Refugee protection and asylum law', TRUE),
('CLC7207', 'International Criminal Law', 1, 2, 3, 5, 10, 26, 'International criminal tribunals', TRUE),
('IPL7206', 'Patents and Trade Secrets Law', 1, 2, 3, 5, 13, 32, 'Patent law and trade secrets', TRUE),
('LMG7205', 'Legal Research Methods', 1, 2, 3, 5, 10, 26, 'Advanced legal research', TRUE),
('PIL7207', 'Public International Law II', 1, 2, 3, 5, 12, 31, 'Advanced PIL topics', TRUE),
('BFL7208', 'Islamic Banking and Finance', 1, 2, 3, 5, 11, 27, 'Sharia-compliant banking', TRUE),
('IE7207', 'International Commercial Arbitration', 1, 2, 3, 5, 12, 31, 'Arbitration in commercial disputes', TRUE),
('UCC8102', 'Computer Application in Research', 1, 2, 3, 6, 14, 30, 'Research computing tools', TRUE),

-- ============================================================================
-- BUSINESS AND MANAGEMENT COURSES
-- ============================================================================

-- Common Business Courses
('MKM1101', 'Principles of Marketing', 1, 1, 3, 9, 28, 44, 'Marketing fundamentals and strategies', TRUE),
('ACC1101', 'Fundamentals of Accounting', 1, 1, 3, 9, 25, 41, 'Introduction to financial accounting', TRUE),
('ECO1101', 'Introduction to Micro Economics', 1, 1, 3, 9, 30, 46, 'Microeconomic principles', TRUE),
('STA1201', 'Quantitative Methods', 1, 2, 3, 6, 17, 32, 'Business statistics and quantitative analysis', TRUE),
('HRM1201', 'Principles of Human Resource Management', 1, 2, 3, 9, 27, 43, 'HR management fundamentals', TRUE),
('ECO1201', 'Introduction to Macro Economics', 1, 2, 3, 9, 30, 46, 'Macroeconomic principles', TRUE),

-- HRM Specific
('HRM1202', 'Industrial Relations and Labour Laws', 1, 2, 3, 9, 27, 43, 'Employment relations and law', TRUE),

-- Accounting & Finance (BBA-FA)
('ACC2203', 'Cost Accounting', 2, 2, 3, 9, 25, 41, 'Cost analysis and management accounting', TRUE),
('ACC2202', 'Public Sector Accounting', 2, 2, 3, 9, 25, 41, 'Government accounting systems', TRUE),
('ACC2204', 'Specialized Accounting', 2, 2, 3, 9, 25, 41, 'Industry-specific accounting', TRUE),
('BUS2203', 'Principles and Practice of Insurance Management', 2, 2, 3, 9, 26, 42, 'Insurance industry management', TRUE),
('ECO2203', 'International Trade Theory', 2, 2, 3, 9, 30, 46, 'International economics', TRUE),
('ACC2201', 'Computerised Accounting', 2, 2, 3, 9, 25, 41, 'Accounting software applications', TRUE),
('ACC3102', 'Corporate Finance', 3, 1, 3, 9, 25, 41, 'Corporate financial management', TRUE),
('ACC3101', 'Taxation and Accounting', 3, 1, 3, 9, 25, 41, 'Tax accounting and compliance', TRUE),
('PAD2102', 'Public Financial Management', 3, 1, 3, 11, 42, 50, 'Government financial systems', TRUE),
('ACC3103', 'Advanced Accounting', 3, 1, 3, 9, 25, 41, 'Complex accounting topics', TRUE),
('HRM3101', 'Strategic Management and Business Policy', 3, 1, 3, 9, 27, 43, 'Strategic planning and execution', TRUE),
('PAD3202', 'Project Planning and Management', 3, 2, 3, 11, 42, 50, 'Project management methodologies', TRUE),
('ACC3204', 'Management Accounting', 3, 2, 3, 9, 25, 41, 'Managerial decision-making', TRUE),
('ACC3201', 'Auditing Practice and Investigation', 3, 2, 3, 9, 25, 41, 'Audit procedures and forensics', TRUE),
('ACC3203', 'Contemporary Issues In Financial Accounting', 3, 2, 3, 9, 25, 41, 'Current accounting standards', TRUE),
('BUS3202', 'Business Ethics', 3, 2, 3, 9, 26, 42, 'Corporate social responsibility', TRUE),

-- ============================================================================
-- SCHOOL OF ENGINEERING AND APPLIED SCIENCES (SEAS) COURSES
-- ============================================================================

-- Bachelor of Science in Civil Engineering
-- Year 2, Semester 1
('CVE2101', 'Engineering Surveying I', 2, 1, 3, 4, 6, 22, 'Land surveying techniques and instruments', TRUE),
('CVE2102', 'Strength of Materials I', 2, 1, 3, 4, 6, 22, 'Mechanics of materials and stress analysis', TRUE),
('CVE2103', 'Fluid Mechanics I', 2, 1, 3, 4, 6, 22, 'Fluid properties and dynamics', TRUE),
('CVE2104', 'Engineering Drawing and CAD', 2, 1, 3, 4, 6, 22, 'Technical drawing and computer-aided design', TRUE),

-- Year 2, Semester 2
('CVE2201', 'Engineering Surveying II', 2, 2, 3, 4, 6, 22, 'Advanced surveying and GPS', TRUE),
('CVE2202', 'Strength of Materials II', 2, 2, 3, 4, 6, 22, 'Advanced material mechanics', TRUE),
('CVE2203', 'Fluid Mechanics II', 2, 2, 3, 4, 6, 22, 'Advanced fluid dynamics', TRUE),
('CVE2204', 'Structural Analysis I', 2, 2, 3, 4, 6, 22, 'Analysis of structures', TRUE),

-- Year 3, Semester 1
('CVE3101', 'Structural Analysis II', 3, 1, 3, 4, 6, 22, 'Advanced structural analysis', TRUE),
('CVE3102', 'Geotechnical Engineering I', 3, 1, 3, 4, 6, 22, 'Soil mechanics and foundation engineering', TRUE),
('CVE3103', 'Hydraulics and Hydrology', 3, 1, 3, 4, 6, 22, 'Water resources engineering', TRUE),
('CVE3104', 'Construction Technology and Management', 3, 1, 3, 4, 6, 22, 'Construction methods and project management', TRUE),

-- Year 3, Semester 2
('CVE3201', 'Structural Design I', 3, 2, 3, 4, 6, 22, 'Design of structural elements', TRUE),
('CVE3202', 'Geotechnical Engineering II', 3, 2, 3, 4, 6, 22, 'Advanced foundation design', TRUE),
('CVE3203', 'Transportation Engineering I', 3, 2, 3, 4, 6, 22, 'Highway and traffic engineering', TRUE),
('CVE3204', 'Environmental Engineering', 3, 2, 3, 4, 6, 22, 'Water and wastewater treatment', TRUE),

-- Year 4, Semester 1
('CVE4101', 'Structural Design II', 4, 1, 3, 4, 6, 22, 'Advanced structural design', TRUE),
('CVE4102', 'Transportation Engineering II', 4, 1, 3, 4, 6, 22, 'Advanced transportation systems', TRUE),
('CVE4103', 'Water Resources Engineering', 4, 1, 3, 4, 6, 22, 'Irrigation and water supply systems', TRUE),
('CVE4104', 'Engineering Economics and Project Management', 4, 1, 3, 4, 6, 22, 'Economic analysis of engineering projects', TRUE),

-- Year 4, Semester 2
('CVE4201', 'Design Project', 4, 2, 6, 4, 6, 22, 'Final year civil engineering design project', TRUE),
('CVE4202', 'Professional Practice and Ethics', 4, 2, 3, 4, 6, 22, 'Engineering ethics and professional conduct', TRUE),

-- Bachelor of Science in Electrical Engineering
-- Year 2, Semester 1
('ELE2101', 'Circuit Analysis I', 2, 1, 3, 4, 7, 23, 'DC and AC circuit analysis', TRUE),
('ELE2102', 'Electronics I', 2, 1, 3, 4, 7, 23, 'Semiconductor devices and circuits', TRUE),
('ELE2103', 'Electrical Measurements', 2, 1, 3, 4, 7, 23, 'Measurement instruments and techniques', TRUE),
('ELE2104', 'Engineering Mathematics III', 2, 1, 3, 4, 7, 23, 'Advanced mathematics for electrical engineering', TRUE),

-- Year 2, Semester 2
('ELE2201', 'Circuit Analysis II', 2, 2, 3, 4, 7, 23, 'Advanced circuit theory', TRUE),
('ELE2202', 'Electronics II', 2, 2, 3, 4, 7, 23, 'Amplifiers and oscillators', TRUE),
('ELE2203', 'Electrical Machines I', 2, 2, 3, 4, 7, 23, 'DC machines and transformers', TRUE),
('ELE2204', 'Electromagnetic Fields', 2, 2, 3, 4, 7, 23, 'Electromagnetic theory', TRUE),

-- Year 3, Semester 1
('ELE3101', 'Electrical Machines II', 3, 1, 3, 4, 7, 23, 'AC machines and special machines', TRUE),
('ELE3102', 'Power Systems I', 3, 1, 3, 4, 7, 23, 'Power generation and transmission', TRUE),
('ELE3103', 'Control Systems I', 3, 1, 3, 4, 7, 23, 'Control theory and applications', TRUE),
('ELE3104', 'Digital Electronics', 3, 1, 3, 4, 7, 23, 'Digital logic and circuits', TRUE),

-- Year 3, Semester 2
('ELE3201', 'Power Systems II', 3, 2, 3, 4, 7, 23, 'Power distribution and protection', TRUE),
('ELE3202', 'Control Systems II', 3, 2, 3, 4, 7, 23, 'Advanced control systems', TRUE),
('ELE3203', 'Microprocessors and Microcontrollers', 3, 2, 3, 4, 7, 23, 'Embedded systems programming', TRUE),
('ELE3204', 'Communication Systems', 3, 2, 3, 4, 7, 23, 'Analog and digital communication', TRUE),

-- Year 4, Semester 1
('ELE4101', 'Power Electronics', 4, 1, 3, 4, 7, 23, 'Power conversion and drives', TRUE),
('ELE4102', 'Electrical Installation Design', 4, 1, 3, 4, 7, 23, 'Electrical system design', TRUE),
('ELE4103', 'Renewable Energy Systems', 4, 1, 3, 4, 7, 23, 'Solar, wind, and alternative energy', TRUE),
('ELE4104', 'Project I', 4, 1, 3, 4, 7, 23, 'Electrical engineering project phase 1', TRUE),

-- Year 4, Semester 2
('ELE4201', 'High Voltage Engineering', 4, 2, 3, 4, 7, 23, 'High voltage systems and insulation', TRUE),
('ELE4202', 'Industrial Automation', 4, 2, 3, 4, 7, 23, 'PLC and SCADA systems', TRUE),
('ELE4203', 'Project II', 4, 2, 6, 4, 7, 23, 'Electrical engineering final project', TRUE),
('ELE4204', 'Engineering Management', 4, 2, 3, 4, 7, 23, 'Engineering project and operations management', TRUE),

-- ============================================================================
-- CEODL (CENTER FOR EXTERNAL AND OPEN DISTANCE LEARNING) COURSES
-- ============================================================================

-- Postgraduate Diploma in Education
-- Year 1, Semester 1
('PDE1101', 'Foundations of Education', 1, 1, 3, 10, 32, 48, 'Educational philosophy and theory', TRUE),
('PDE1102', 'Educational Psychology', 1, 1, 3, 10, 32, 48, 'Learning theories and development', TRUE),
('PDE1103', 'Curriculum Development', 1, 1, 3, 10, 32, 48, 'Curriculum design and implementation', TRUE),
('PDE1104', 'Methods of Teaching', 1, 1, 3, 10, 32, 48, 'Pedagogical methods and strategies', TRUE),

-- Year 1, Semester 2
('PDE1201', 'Educational Assessment and Evaluation', 1, 2, 3, 10, 32, 48, 'Assessment techniques and evaluation', TRUE),
('PDE1202', 'Educational Technology', 1, 2, 3, 10, 32, 48, 'Technology integration in teaching', TRUE),
('PDE1203', 'Classroom Management', 1, 2, 3, 10, 32, 48, 'Behavior management and discipline', TRUE),
('PDE1204', 'Teaching Practice', 1, 2, 6, 10, 32, 48, 'Supervised teaching experience', TRUE),

-- Postgraduate Diploma in Educational Management and Administration
-- Year 1, Semester 1
('PDEMA1101', 'Principles of Educational Management', 1, 1, 3, 10, 35, 43, 'Educational management concepts', TRUE),
('PDEMA1102', 'Educational Leadership', 1, 1, 3, 10, 35, 43, 'Leadership in educational institutions', TRUE),
('PDEMA1103', 'Human Resource Management in Education', 1, 1, 3, 10, 35, 43, 'HR practices in schools', TRUE),
('PDEMA1104', 'Educational Planning and Policy', 1, 1, 3, 10, 35, 43, 'Policy development and planning', TRUE),

-- Year 1, Semester 2
('PDEMA1201', 'Financial Management in Education', 1, 2, 3, 10, 35, 43, 'School finance and budgeting', TRUE),
('PDEMA1202', 'School-Community Relations', 1, 2, 3, 10, 35, 43, 'Stakeholder engagement', TRUE),
('PDEMA1203', 'Educational Law and Ethics', 1, 2, 3, 10, 35, 43, 'Legal and ethical issues in education', TRUE),
('PDEMA1204', 'Research in Educational Management', 1, 2, 3, 10, 35, 43, 'Research methods in education', TRUE),

-- Master of Education in Education Management and Administration
-- Year 1, Semester 1
('MEMA1101', 'Advanced Educational Management', 1, 1, 3, 10, 35, 43, 'Advanced management theories', TRUE),
('MEMA1102', 'Strategic Planning in Education', 1, 1, 3, 10, 35, 43, 'Strategic management for schools', TRUE),
('MEMA1103', 'Organizational Behavior in Education', 1, 1, 3, 10, 35, 43, 'Organizational dynamics', TRUE),
('MEMA1104', 'Research Methodology in Education', 1, 1, 3, 10, 32, 48, 'Educational research methods', TRUE),

-- Year 1, Semester 2
('MEMA1201', 'Educational Leadership and Change Management', 1, 2, 3, 10, 35, 43, 'Leading educational change', TRUE),
('MEMA1202', 'Quality Assurance in Education', 1, 2, 3, 10, 35, 43, 'Standards and quality management', TRUE),
('MEMA1203', 'Comparative Education Systems', 1, 2, 3, 10, 32, 48, 'International education comparison', TRUE),
('MEMA1204', 'Educational Finance and Resource Management', 1, 2, 3, 10, 35, 43, 'Financial planning and allocation', TRUE),

-- Year 2, Semester 1
('MEMA2101', 'Curriculum Leadership', 2, 1, 3, 10, 35, 43, 'Leading curriculum development', TRUE),
('MEMA2102', 'Educational Technology Management', 2, 1, 3, 10, 35, 43, 'Managing ICT in education', TRUE),
('MEMA2103', 'Thesis/Research Project I', 2, 1, 6, 10, 35, 43, 'Research proposal and literature review', TRUE),

-- Master of Arts in Linguistics
-- Year 2, Semester 1
('MAL2101', 'Advanced Phonetics and Phonology', 2, 1, 3, 10, 34, 42, 'Sound systems and patterns', TRUE),
('MAL2102', 'Advanced Syntax and Morphology', 2, 1, 3, 10, 34, 42, 'Grammatical structures', TRUE),
('MAL2103', 'Sociolinguistics', 2, 1, 3, 10, 34, 42, 'Language in social context', TRUE),
('MAL2104', 'Applied Linguistics', 2, 1, 3, 10, 34, 42, 'Linguistics in practical applications', TRUE),
('MAL2105', 'Discourse Analysis', 2, 1, 3, 10, 34, 42, 'Analysis of spoken and written discourse', TRUE),

-- Master of Arts in English
-- Year 2, Semester 1
('MAE2101', 'Advanced Literary Theory', 2, 1, 3, 10, 33, 49, 'Contemporary literary criticism', TRUE),
('MAE2102', 'Shakespeare Studies', 2, 1, 3, 10, 33, 49, 'Shakespearean literature analysis', TRUE),
('MAE2103', 'Postcolonial Literature', 2, 1, 3, 10, 33, 49, 'Literature from postcolonial perspectives', TRUE),
('MAE2104', 'English Language Teaching Methodology', 2, 1, 3, 10, 33, 49, 'Advanced ELT techniques', TRUE),
('MAE2105', 'Research in English Studies', 2, 1, 3, 10, 33, 49, 'Research methods in English', TRUE),

-- PhD in Management Sciences - Educational Administration
-- Year 1, Semester 1
('PHDEA1101', 'Advanced Educational Administration Theory', 1, 1, 3, 10, 35, 43, 'Doctoral-level administration theory', TRUE),
('PHDEA1102', 'Policy Analysis in Education', 1, 1, 3, 10, 35, 43, 'Educational policy research', TRUE),
('PHDEA1103', 'Seminar in Educational Leadership', 1, 1, 3, 10, 35, 43, 'Contemporary leadership issues', TRUE),

-- ============================================================================
-- CHSS (COLLEGE OF HUMANITIES AND SOCIAL SCIENCES) COURSES
-- ============================================================================

-- Bachelor of Guidance and Counselling
-- Year 1, Semester 1
('BGC1101', 'Introduction to Guidance and Counselling', 1, 1, 3, 11, 37, 49, 'Foundations of counseling', TRUE),
('BGC1102', 'Developmental Psychology', 1, 1, 3, 11, 38, 50, 'Human development across lifespan', TRUE),
('BGC1103', 'Introduction to Psychology', 1, 1, 3, 11, 38, 50, 'Basic psychological concepts', TRUE),
('BGC1104', 'Communication Skills for Counsellors', 1, 1, 3, 11, 37, 49, 'Effective counseling communication', TRUE),

-- Year 1, Semester 2
('BGC1201', 'Theories of Counselling', 1, 2, 3, 11, 37, 49, 'Major counseling theories', TRUE),
('BGC1202', 'Abnormal Psychology', 1, 2, 3, 11, 38, 50, 'Psychopathology and mental disorders', TRUE),
('BGC1203', 'Educational Psychology', 1, 2, 3, 11, 38, 50, 'Psychology in educational settings', TRUE),
('BGC1204', 'Group Dynamics and Counselling', 1, 2, 3, 11, 37, 49, 'Group counseling techniques', TRUE),

-- Year 2, Semester 1
('BGC2101', 'Career Guidance and Counselling', 2, 1, 3, 11, 37, 49, 'Vocational guidance and career development', TRUE),
('BGC2102', 'Family and Marriage Counselling', 2, 1, 3, 11, 37, 49, 'Family therapy and marriage counseling', TRUE),
('BGC2103', 'Psychological Testing and Assessment', 2, 1, 3, 11, 38, 50, 'Assessment instruments and interpretation', TRUE),
('BGC2104', 'Child and Adolescent Counselling', 2, 1, 3, 11, 37, 49, 'Counseling young people', TRUE),

-- Year 2, Semester 2
('BGC2201', 'Counselling Practicum I', 2, 2, 6, 11, 37, 49, 'Supervised counseling practice', TRUE),
('BGC2202', 'Substance Abuse Counselling', 2, 2, 3, 11, 37, 49, 'Addiction counseling', TRUE),
('BGC2203', 'Crisis Intervention and Trauma Counselling', 2, 2, 3, 11, 37, 49, 'Emergency counseling techniques', TRUE),

-- Bachelor of Social Work and Community Development (Upgrading)
-- Year 3, Semester 1
('BSWCD3101', 'Advanced Social Work Practice', 3, 1, 3, 11, 36, 48, 'Advanced practice methods', TRUE),
('BSWCD3102', 'Community Development Theories', 3, 1, 3, 11, 39, 50, 'Community development approaches', TRUE),
('BSWCD3103', 'Social Policy and Administration', 3, 1, 3, 11, 42, 50, 'Social welfare policy', TRUE),
('BSWCD3104', 'Program Planning and Evaluation', 3, 1, 3, 11, 39, 50, 'Social program design', TRUE),
('BSWCD3105', 'Research Methods in Social Work', 3, 1, 3, 11, 36, 48, 'Social work research', TRUE),

-- Diploma in Guidance and Counselling
-- Year 2, Semester 2
('DGC2201', 'Basic Counselling Skills', 2, 2, 3, 11, 37, 49, 'Fundamental counseling techniques', TRUE),
('DGC2202', 'Psychology of Guidance', 2, 2, 3, 11, 38, 50, 'Psychological foundations of guidance', TRUE),
('DGC2203', 'Counselling Ethics and Professional Practice', 2, 2, 3, 11, 37, 49, 'Ethics in counseling', TRUE),
('DGC2204', 'Practicum in Guidance and Counselling', 2, 2, 6, 11, 37, 49, 'Practical counseling experience', TRUE),

-- Diploma in Mass Communication
-- Year 2, Semester 1
('DMC2101', 'Introduction to Mass Communication', 2, 1, 3, 11, 41, 50, 'Mass media theory and practice', TRUE),
('DMC2102', 'News Writing and Reporting', 2, 1, 3, 11, 41, 50, 'Journalism fundamentals', TRUE),
('DMC2103', 'Media Ethics and Law', 2, 1, 3, 11, 41, 50, 'Legal and ethical issues in media', TRUE),
('DMC2104', 'Public Relations and Advertising', 2, 1, 3, 11, 41, 50, 'PR and advertising principles', TRUE),
('DMC2105', 'Broadcasting Techniques', 2, 1, 3, 11, 41, 50, 'Radio and TV production', TRUE),

-- Postgraduate Diploma in Development Studies
-- Year 1, Semester 1
('PDDS1101', 'Theories of Development', 1, 1, 3, 11, 39, 50, 'Development paradigms and approaches', TRUE),
('PDDS1102', 'Development Economics', 1, 1, 3, 11, 39, 50, 'Economic aspects of development', TRUE),
('PDDS1103', 'Social Development and Change', 1, 1, 3, 11, 39, 50, 'Social dimensions of development', TRUE),
('PDDS1104', 'Research Methods in Development Studies', 1, 1, 3, 11, 39, 50, 'Development research approaches', TRUE),

-- Year 1, Semester 2
('PDDS1201', 'Project Planning and Management', 1, 2, 3, 11, 39, 50, 'Development project management', TRUE),
('PDDS1202', 'Sustainable Development', 1, 2, 3, 11, 39, 50, 'Sustainability principles', TRUE),
('PDDS1203', 'Gender and Development', 1, 2, 3, 11, 39, 50, 'Gender issues in development', TRUE),
('PDDS1204', 'Monitoring and Evaluation', 1, 2, 3, 11, 39, 50, 'M&E frameworks and tools', TRUE),

-- Master of Arts in Conflict Resolution and Peace Building
-- Year 2, Semester 1
('MACRPB2101', 'Advanced Conflict Analysis', 2, 1, 3, 11, 40, 50, 'Complex conflict dynamics', TRUE),
('MACRPB2102', 'Peacebuilding Theories and Practice', 2, 1, 3, 11, 40, 50, 'Peace intervention strategies', TRUE),
('MACRPB2103', 'Mediation and Negotiation', 2, 1, 3, 11, 40, 50, 'Dispute resolution techniques', TRUE),
('MACRPB2104', 'Transitional Justice', 2, 1, 3, 11, 40, 50, 'Post-conflict justice mechanisms', TRUE),
('MACRPB2105', 'Humanitarian Response and Intervention', 2, 1, 3, 11, 40, 50, 'Humanitarian operations', TRUE),

-- PhD in Management Sciences - Public Management
-- Year 2, Semester 2
('PHDPM2201', 'Public Policy Analysis and Implementation', 2, 2, 3, 11, 42, 50, 'Advanced policy studies', TRUE),
('PHDPM2202', 'Governance and Public Sector Reform', 2, 2, 3, 11, 42, 50, 'Public sector transformation', TRUE),
('PHDPM2203', 'Research Seminar in Public Management', 2, 2, 3, 11, 42, 50, 'Contemporary public management issues', TRUE),
('PHDPM2204', 'Dissertation Research', 2, 2, 12, 11, 42, 50, 'Doctoral dissertation work', TRUE);