-- ============================================================
--  FIX 1: Add the missing PHD-ENG programme
-- ============================================================
INSERT INTO programmes (code, name, level, duration_years, department_id, college_id, description, is_active) VALUES
('PHD-ENG', 'PhD in Engineering by Research', 'phd', 3, 6, 4, 'Doctoral research programme in engineering (Civil & Electrical)', TRUE);


-- ============================================================
--  FIX 2: Students  COMMON PASSWORD: uems@2026
--  programme_id uses actual SERIAL ids (or dynamic lookups)
--  ALL 30 PhD candidates from phd_candidates are included here
-- ============================================================
WITH pw(hash) AS (
    VALUES ('$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu'::TEXT)
)
INSERT INTO students (registration_number, email, password_hash, first_name, last_name, phone, programme_id, college_id, department_id, enrolment_year, study_year, semester)
SELECT v.reg_no, v.email, pw.hash, v.first_name, v.last_name, v.phone, v.programme_id, v.college_id, v.department_id, v.enrolment_year, v.study_year, v.semester
FROM pw
CROSS JOIN (
    VALUES
    -- =====================================================================
    -- PhD TRACK STUDENTS (30 total — matches phd_candidates table)
    -- =====================================================================

    -- -------------------------------------------------------
    -- Dept 14 — Computer Science  programme_id = 7
    -- -------------------------------------------------------
    ('KIU/2020/1001', 'john.mukasa@student.uems.ac.ug',      'John',     'Mukasa',      '0778001001', 7, 6, 14, 2020, 4, 2),
    ('KIU/2020/1002', 'sarah.nabunya@student.uems.ac.ug',     'Sarah',    'Nabunya',     '0778001002', 7, 6, 14, 2020, 4, 2),
    ('KIU/2019/P001', 'adam.sekitto@student.uems.ac.ug',      'Adam',     'Sekitto',     '0778001003', 7, 6, 14, 2019, 6, 1),
    ('KIU/2019/P002', 'beatrice.atim@student.uems.ac.ug',     'Beatrice', 'Atim',        '0778001004', 7, 6, 14, 2019, 6, 2),
    ('KIU/2019/P003', 'charles.lubega@student.uems.ac.ug',    'Charles',  'Lubega',      '0778001005', 7, 6, 14, 2019, 6, 2),

    -- -------------------------------------------------------
    -- Dept 22 — Public Health  programme_id = 18
    -- -------------------------------------------------------
    ('KIU/2019/2001', 'peter.okello@student.uems.ac.ug',      'Peter',        'Okello',        '0778002001', 18, 8, 22, 2019, 5, 1),
    ('KIU/2019/2002', 'grace.ainomugisha@student.uems.ac.ug', 'Grace',        'Ainomugisha',   '0778002002', 18, 8, 22, 2019, 5, 1),
    ('KIU/2019/P004', 'nicholas.oryem@student.uems.ac.ug',    'Nicholas',     'Oryem',         '0778002003', 18, 8, 22, 2019, 6, 1),
    ('KIU/2020/P005', 'diana.namugosa@student.uems.ac.ug',    'Diana',        'Namugosa',      '0778002004', 18, 8, 22, 2020, 5, 1),
    ('KIU/2020/P006', 'simon.anywar@student.uems.ac.ug',      'Simon',        'Anywar',        '0778002005', 18, 8, 22, 2020, 4, 2),

    -- -------------------------------------------------------
    -- Dept 10 — Law  programme_id = 47
    -- -------------------------------------------------------
    ('KIU/2021/3001', 'david.tumwesigye@student.uems.ac.ug',  'David',   'Tumwesigye', '0778003001', 47, 5, 10, 2021, 3, 2),
    ('KIU/2021/P007', 'ruth.nankya@student.uems.ac.ug',       'Ruth',    'Nankya',      '0778003002', 47, 5, 10, 2021, 4, 1),
    ('KIU/2021/P008', 'richard.mugabi@student.uems.ac.ug',    'Richard', 'Mugabi',      '0778003003', 47, 5, 10, 2021, 4, 1),
    ('KIU/2022/P009', 'christine.apio@student.uems.ac.ug',    'Christine','Apio',       '0778003004', 47, 5, 10, 2022, 3, 1),
    ('KIU/2022/P010', 'morris.ochieng@student.uems.ac.ug',    'Morris',  'Ochieng',     '0778003005', 47, 5, 10, 2022, 2, 2),

    -- -------------------------------------------------------
    -- Dept 26 — Business Administration  programme_id = 49
    -- -------------------------------------------------------
    ('KIU/2020/4001', 'jane.nakamya@student.uems.ac.ug',      'Jane',      'Nakamya',           '0778004001', 49, 9, 26, 2020, 4, 2),
    ('KIU/2020/P011', 'felix.barigye@student.uems.ac.ug',     'Felix',     'Barigye',           '0778004002', 49, 9, 26, 2020, 5, 1),
    ('KIU/2021/P012', 'lydia.nantume@student.uems.ac.ug',     'Lydia',     'Nantume',           '0778004003', 49, 9, 26, 2021, 3, 2),
    ('KIU/2021/P013', 'diana.nakyejwe@student.uems.ac.ug',    'Diana',     'Nakyejwe',          '0778004004', 49, 9, 26, 2021, 4, 1),
    ('KIU/2022/P014', 'emmanuel.byaruhanga@student.uems.ac.ug','Emmanuel', 'Byaruhanga',        '0778004005', 49, 9, 26, 2022, 3, 1),

    -- -------------------------------------------------------
    -- Dept 32 — Education  programme_id = 33
    -- -------------------------------------------------------
    ('KIU/2021/5001', 'samuel.olupot@student.uems.ac.ug',     'Samuel',   'Olupot',      '0778005001', 33, 10, 32, 2021, 3, 1),
    ('KIU/2021/P015', 'irene.nassali@student.uems.ac.ug',     'Irene',    'Nassali',     '0778005002', 33, 10, 32, 2021, 3, 2),
    ('KIU/2021/P016', 'andrew.kirunda@student.uems.ac.ug',    'Andrew',   'Kirunda',     '0778005003', 33, 10, 32, 2021, 4, 1),
    ('KIU/2022/P017', 'florence.adong@student.uems.ac.ug',    'Florence', 'Adong',       '0778005004', 33, 10, 32, 2022, 2, 2),
    ('KIU/2022/P018', 'richard.ojok@student.uems.ac.ug',      'Richard',  'Ojok',        '0778005005', 33, 10, 32, 2022, 3, 1),

    -- -------------------------------------------------------
    -- Dept 6 — Civil Engineering  (Dynamic lookup for PHD-ENG)
    -- -------------------------------------------------------
    ('KIU/2020/P019', 'oliver.namutebi@student.uems.ac.ug',   'Oliver',   'Namutebi',    '0778007001', (SELECT id FROM programmes WHERE code = 'PHD-ENG'), 4, 6, 2020, 5, 1),
    ('KIU/2020/P020', 'lawrence.okidi@student.uems.ac.ug',    'Lawrence', 'Okidi',       '0778007002', (SELECT id FROM programmes WHERE code = 'PHD-ENG'), 4, 6, 2020, 5, 2),
    ('KIU/2021/P021', 'caroline.tumusiime@student.uems.ac.ug', 'Caroline', 'Tumusiime',  '0778007003', (SELECT id FROM programmes WHERE code = 'PHD-ENG'), 4, 6, 2021, 4, 1),

    -- -------------------------------------------------------
    -- Dept 7 — Electrical Engineering  (Dynamic lookup for PHD-ENG)
    -- -------------------------------------------------------
    ('KIU/2021/P022', 'isaac.mwebaze@student.uems.ac.ug',     'Isaac',    'Mwebaze',     '0778007004', (SELECT id FROM programmes WHERE code = 'PHD-ENG'), 4, 7, 2021, 3, 2),
    ('KIU/2022/P023', 'pamela.achan@student.uems.ac.ug',      'Pamela',   'Achan',       '0778007005', (SELECT id FROM programmes WHERE code = 'PHD-ENG'), 4, 7, 2022, 2, 2),

    -- =====================================================================
    -- MASTERS STUDENTS
    -- =====================================================================
    -- MIT → programme_id = 43
    ('KIU/2023/6001', 'ronald.ssejjemba@student.uems.ac.ug',  'Ronald',  'Ssejjemba', '0778006001', 43, 6, 15, 2023, 2, 1),
    ('KIU/2023/6002', 'maria.babirye@student.uems.ac.ug',     'Maria',   'Babirye',   '0778006002', 43, 6, 15, 2023, 2, 1),
    -- MBA → programme_id = 48
    ('KIU/2023/6003', 'philip.kawooya@student.uems.ac.ug',    'Philip',  'Kawooya',   '0778006003', 48, 9, 26, 2023, 2, 2),
    -- MED → programme_id = 32
    ('KIU/2023/6004', 'juliet.nabukeera@student.uems.ac.ug',  'Juliet',  'Nabukeera', '0778006004', 32, 10, 32, 2023, 2, 2),

    -- =====================================================================
    -- UNDERGRADUATE STUDENTS (Year 1 & 2)
    -- =====================================================================
    -- BSc. Computer Science → programme_id = 5
    ('KIU/2024/0001', 'michael.kato@student.uems.ac.ug',      'Michael',  'Kato',       '0780000001', 5, 6, 14, 2024, 1, 1),
    ('KIU/2024/0002', 'fiona.nakamya@student.uems.ac.ug',     'Fiona',    'Nakamya',    '0780000002', 5, 6, 14, 2024, 1, 1),
    ('KIU/2024/0003', 'james.okello@student.uems.ac.ug',      'James',    'Okello',     '0780000003', 5, 6, 14, 2024, 1, 2),
    ('KIU/2024/0004', 'hope.asiimwe@student.uems.ac.ug',      'Hope',     'Asiimwe',    '0780000004', 5, 6, 14, 2024, 1, 2),
    ('KIU/2023/0005', 'allan.mugisha@student.uems.ac.ug',     'Allan',    'Mugisha',    '0780000005', 5, 6, 14, 2023, 2, 1),
    ('KIU/2023/0006', 'linda.nabwire@student.uems.ac.ug',     'Linda',    'Nabwire',    '0780000006', 5, 6, 14, 2023, 2, 1),
    ('KIU/2023/0007', 'ivan.tumusiime@student.uems.ac.ug',    'Ivan',     'Tumusiime',  '0780000007', 5, 6, 14, 2023, 2, 2),

    -- BIT → programme_id = 2
    ('KIU/2024/0008', 'brian.aol@student.uems.ac.ug',         'Brian',    'Aol',        '0780000008', 2, 6, 15, 2024, 1, 1),
    ('KIU/2024/0009', 'diana.nabukenya@student.uems.ac.ug',   'Diana',    'Nabukenya',  '0780000009', 2, 6, 15, 2024, 1, 2),
    ('KIU/2023/0010', 'emmanuel.watmon@student.uems.ac.ug',   'Emmanuel', 'Watmon',     '0780000010', 2, 6, 15, 2023, 2, 1),

    -- BSc. Software Engineering → programme_id = 3
    ('KIU/2024/0011', 'joshua.mukisa@student.uems.ac.ug',    'Joshua',   'Mukisa',     '0780000011', 3, 6, 16, 2024, 1, 1),
    ('KIU/2024/0012', 'patricia.nanyonjo@student.uems.ac.ug', 'Patricia', 'Nanyonjo',   '0780000012', 3, 6, 16, 2024, 1, 2),
    ('KIU/2023/0013', 'peter.ssemanda@student.uems.ac.ug',   'Peter',    'Ssemanda',   '0780000013', 3, 6, 16, 2023, 2, 2),

    -- LLB Law → programme_id = 19
    ('KIU/2024/0014', 'robert.bwire@student.uems.ac.ug',     'Robert',   'Bwire',      '0780000014', 19, 5, 10, 2024, 1, 1),
    ('KIU/2024/0015', 'sandra.nakalungi@student.uems.ac.ug',  'Sandra',   'Nakalungi',  '0780000015', 19, 5, 10, 2024, 1, 1),
    ('KIU/2023/0016', 'kenneth.odong@student.uems.ac.ug',    'Kenneth',  'Odong',      '0780000016', 19, 5, 10, 2023, 2, 2),
    ('KIU/2023/0017', 'sharon.namuddu@student.uems.ac.ug',   'Sharon',   'Namuddu',    '0780000017', 19, 5, 10, 2023, 2, 2),

    -- BBA → programme_id = 24
    ('KIU/2024/0018', 'grace.akello@student.uems.ac.ug',     'Grace',    'Akello',     '0780000018', 24, 9, 26, 2024, 1, 1),
    ('KIU/2024/0019', 'daniel.tumusiime@student.uems.ac.ug', 'Daniel',   'Tumusiime',  '0780000019', 24, 9, 26, 2024, 1, 1),
    ('KIU/2024/0020', 'judith.nabukeera@student.uems.ac.ug', 'Judith',   'Nabukeera',  '0780000020', 24, 9, 26, 2024, 1, 2),
    ('KIU/2023/0021', 'samuel.kakuru@student.uems.ac.ug',    'Samuel',   'Kakuru',     '0780000021', 24, 9, 26, 2023, 2, 1),

    -- BSc. Civil Engineering → programme_id = 41
    ('KIU/2024/0022', 'henry.lutaaya@student.uems.ac.ug',    'Henry',    'Lutaaya',    '0780000022', 41, 4, 6, 2024, 1, 1),
    ('KIU/2024/0023', 'patricia.ayebare@student.uems.ac.ug', 'Patricia', 'Ayebare',    '0780000023', 41, 4, 6, 2024, 1, 1),
    ('KIU/2023/0024', 'geoffrey.okot@student.uems.ac.ug',    'Geoffrey', 'Okot',       '0780000024', 41, 4, 6, 2023, 2, 2),

    -- BSc. Electrical Engineering → programme_id = 42
    ('KIU/2024/0025', 'adrian.muwonge@student.uems.ac.ug',   'Adrian',   'Muwonge',    '0780000025', 42, 4, 7, 2024, 1, 1),
    ('KIU/2024/0026', 'proscovia.nalubega@student.uems.ac.ug','Proscovia','Nalubega',   '0780000026', 42, 4, 7, 2024, 1, 2),
    ('KIU/2023/0027', 'julius.mugerwa@student.uems.ac.ug',   'Julius',   'Mugerwa',    '0780000027', 42, 4, 7, 2023, 2, 1),

    -- Bachelor of Public Health → programme_id = 46
    ('KIU/2024/0028', 'happiness.nakiganda@student.uems.ac.ug','Happiness','Nakiganda', '0780000028', 46, 8, 22, 2024, 1, 1),
    ('KIU/2024/0029', 'dennis.oroni@student.uems.ac.ug',     'Dennis',   'Oroni',      '0780000029', 46, 8, 22, 2024, 1, 1),
    ('KIU/2023/0030', 'catherine.amongo@student.uems.ac.ug', 'Catherine','Amongo',     '0780000030', 46, 8, 22, 2023, 2, 1),

    -- BA Education → programme_id = 50
    ('KIU/2024/0031', 'mark.ssekiziyivu@student.uems.ac.ug', 'Mark',     'Ssekiziyivu','0780000031', 50, 10, 32, 2024, 1, 1),
    ('KIU/2024/0032', 'esther.akumu@student.uems.ac.ug',     'Esther',   'Akumu',      '0780000032', 50, 10, 32, 2024, 1, 1),
    ('KIU/2023/0033', 'victor.kawooya@student.uems.ac.ug',   'Victor',   'Kawooya',    '0780000033', 50, 10, 32, 2023, 2, 2),

    -- Bachelor of Social Work → programme_id = 38
    ('KIU/2024/0034', 'mercy.nabasirye@student.uems.ac.ug',  'Mercy',    'Nabasirye',  '0780000034', 38, 11, 36, 2024, 1, 1),
    ('KIU/2024/0035', 'paul.omara@student.uems.ac.ug',       'Paul',     'Omara',      '0780000035', 38, 11, 36, 2024, 1, 2),

    -- Bachelor of Agriculture → programme_id = 44
    ('KIU/2024/0036', 'gerald.tumwebaze@student.uems.ac.ug', 'Gerald',   'Tumwebaze',  '0780000036', 44, 1, 1, 2024, 1, 1),
    ('KIU/2024/0037', 'florence.nabisi@student.uems.ac.ug',  'Florence', 'Nabisi',     '0780000037', 44, 1, 1, 2024, 1, 1),
    ('KIU/2023/0038', 'phoenix.kakuru@student.uems.ac.ug',   'Phoenix',  'Kakuru',     '0780000038', 44, 1, 1, 2023, 2, 1),

    -- BSc. Biology → programme_id = 45
    ('KIU/2024/0039', 'patience.nankinga@student.uems.ac.ug', 'Patience', 'Nankinga',   '0780000039', 45, 7, 21, 2024, 1, 1),
    ('KIU/2024/0040', 'luke.akello@student.uems.ac.ug',      'Luke',     'Akello',     '0780000040', 45, 7, 21, 2024, 1, 2),
    ('KIU/2023/0041', 'denis.mugisha@student.uems.ac.ug',    'Denis',    'Mugisha',    '0780000041', 45, 7, 21, 2023, 2, 1),

    -- Bachelor of Accounting → programme_id = 51
    ('KIU/2024/0042', 'frida.nalubega@student.uems.ac.ug',   'Frida',    'Nalubega',   '0780000042', 51, 9, 25, 2024, 1, 1),
    ('KIU/2024/0043', 'jonathan.okot@student.uems.ac.ug',    'Jonathan', 'Okot',       '0780000043', 51, 9, 25, 2024, 1, 1),
    ('KIU/2023/0044', 'susan.nakamya@student.uems.ac.ug',    'Susan',    'Nakamya',    '0780000044', 51, 9, 25, 2023, 2, 2)
) AS v(reg_no, email, first_name, last_name, phone, programme_id, college_id, department_id, enrolment_year, study_year, semester);