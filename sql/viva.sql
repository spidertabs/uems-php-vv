-- ============================================================ viva.sql
--  SEED DATA — PhD VIVA VOCE ADMINISTRATION  (Section 11)
--  UEMS-PHD-VV  |  Kampala International University
--  Spider Tabs Ltd © 2026
-- ============================================================
--
--  Depends on: the full UEMS seed already loaded
--  (colleges, departments, programmes, users)
--
--  Covers:
--    1. viva_coordinator users        (ids 227–230)
--    2. phd_candidates                (10 candidates, ids 1–10)
--    3. thesis_submissions            (one per candidate + 2 re-submissions)
--    4. viva_schedules                (8 vivás in various states)
--    5. viva_examiners                (3-panel per viva)
--    6. viva_evaluations              (submitted for completed vivás)
--    7. viva_recommendations          (outcomes for completed vivás)
-- ============================================================

-- Store the password hash in a reusable session variable (PostgreSQL style)
DO $$
BEGIN
  PERFORM set_config('app.password_hash',
    '$2b$12$hsqbYaw0n/FY9M7hU0i9ju.8/dxPP03CGh4zeZy6xGCX4qAFBYRgu',
    FALSE);
END $$;

-- ============================================================
-- 1. VIVA COORDINATORS  (new users, IDs 227–230)
--    Role: 'viva_coordinator' — manages scheduling & outcomes
-- ============================================================

INSERT INTO users
    (email, password_hash, first_name, last_name, role, department_id, college_id, phone)
VALUES
('viva.coord1@uems.ac.ug',  current_setting('app.password_hash'), 'Agnes',    'Nakamya',   'viva_coordinator', NULL, NULL, '0708000001'),
('viva.coord2@uems.ac.ug',  current_setting('app.password_hash'), 'Bernard',  'Ssebunya',  'viva_coordinator', NULL, NULL, '0708000002'),
('viva.coord3@uems.ac.ug',  current_setting('app.password_hash'), 'Florence', 'Atuhaire',  'viva_coordinator', NULL, NULL, '0708000003'),
('viva.coord4@uems.ac.ug',  current_setting('app.password_hash'), 'Kenneth',  'Mubangizi', 'viva_coordinator', NULL, NULL, '0708000004')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 2. PhD CANDIDATES
--    Each candidate must first have a user account.
--    We create 10 candidate user accounts (ids 231–240),
--    then the phd_candidates rows that reference them.
-- ============================================================

INSERT INTO users
    (email, password_hash, first_name, last_name, role, department_id, college_id, phone)
VALUES
-- PhD Computer Science candidates (dept 14, college 6)
('phd.cs001@uems.ac.ug',   current_setting('app.password_hash'), 'David',    'Ochieng',   'lecturer', 14, 6,  '0709100001'),
('phd.cs002@uems.ac.ug',   current_setting('app.password_hash'), 'Miriam',   'Namaganda', 'lecturer', 14, 6,  '0709100002'),
('phd.cs003@uems.ac.ug',   current_setting('app.password_hash'), 'Ronald',   'Mugabi',    'lecturer', 14, 6,  '0709100003'),

-- PhD Physics candidates (dept 19, college 7)
('phd.phy001@uems.ac.ug',  current_setting('app.password_hash'), 'Grace',    'Akello',    'lecturer', 19, 7,  '0709100004'),
('phd.phy002@uems.ac.ug',  current_setting('app.password_hash'), 'Patrick',  'Okwir',     'lecturer', 19, 7,  '0709100005'),

-- PhD Chemistry candidate (dept 20, college 7)
('phd.chem001@uems.ac.ug', current_setting('app.password_hash'), 'Susan',    'Nabirye',   'lecturer', 20, 7,  '0709100006'),

-- PhD Public Health candidates (dept 22, college 8)
('phd.ph001@uems.ac.ug',   current_setting('app.password_hash'), 'Isaac',    'Tumwine',   'lecturer', 22, 8,  '0709100007'),
('phd.ph002@uems.ac.ug',   current_setting('app.password_hash'), 'Lydia',    'Atim',      'lecturer', 22, 8,  '0709100008'),

-- PhD Educational Admin candidate (dept 35, college 10)
('phd.ea001@uems.ac.ug',   current_setting('app.password_hash'), 'Stephen',  'Mwesigwa',  'lecturer', 35, 10, '0709100009'),

-- PhD Public Management candidate (dept 42, college 11)
('phd.pm001@uems.ac.ug',   current_setting('app.password_hash'), 'Harriet',  'Nakayiza',  'lecturer', 42, 11, '0709100010')
ON CONFLICT (email) DO NOTHING;


INSERT INTO phd_candidates
    (user_id, registration_number, thesis_title, programme_id,
     supervisor_id, co_supervisor_id, enrolment_year, status)
VALUES
-- ── Computer Science ──────────────────────────────────────────────────────────
(231, 'KIU/PHD/CS/2021/001',
 'Deep Learning Approaches for Malaria Parasite Detection in Thick Blood Smears',
 7, 30, 108, 2021, 'viva_completed'),

(232, 'KIU/PHD/CS/2022/002',
 'Federated Machine Learning for Privacy-Preserving Health Data Analytics in Resource-Constrained Environments',
 7, 30, 110, 2022, 'viva_scheduled'),

(233, 'KIU/PHD/CS/2022/003',
 'Blockchain-Based Land Registry System for Fraud Prevention in Sub-Saharan Africa',
 7, 32, 118, 2022, 'corrections_pending'),

-- ── Physics ────────────────────────────────────────────────────────────────
(234, 'KIU/PHD/PHY/2020/001',
 'Optimisation of Hybrid Solar-Wind Energy Systems for Rural Off-Grid Communities in Uganda',
 14, 35, 132, 2020, 'awarded'),

(235, 'KIU/PHD/PHY/2022/002',
 'Characterisation of Perovskite Solar Cell Degradation Under Tropical Climate Conditions',
 14, 35, 133, 2022, 'thesis_submitted'),

-- ── Chemistry ──────────────────────────────────────────────────────────────
(236, 'KIU/PHD/CHEM/2021/001',
 'Synthesis and Characterisation of Silver Nanoparticles from Indigenous Plant Extracts for Antimicrobial Applications',
 15, 36, 136, 2021, 'viva_completed'),

-- ── Public Health ──────────────────────────────────────────────────────────
(237, 'KIU/PHD/PH/2021/001',
 'Determinants of Maternal Mortality in Rural Northern Uganda: A Mixed-Methods Study',
 18, 38, 144, 2021, 'corrections_submitted'),

(238, 'KIU/PHD/PH/2022/002',
 'Effectiveness of Community Health Worker Interventions on Under-Five Malnutrition in Karamoja Sub-Region',
 18, 38, 145, 2022, 'viva_scheduled'),

-- ── Educational Administration ─────────────────────────────────────────────
(239, 'KIU/PHD/EA/2021/047',
 'Transformational Leadership and School Performance in Government-Aided Secondary Schools in Uganda',
 33, 51, 194, 2021, 'viva_completed'),

-- ── Public Management ─────────────────────────────────────────────────────
(240, 'KIU/PHD/PM/2022/001',
 'E-Government Implementation and Service Delivery in Uganda: Barriers, Enablers and Citizen Perception',
 40, 58, 219, 2022, 'enrolled')
ON CONFLICT (registration_number) DO NOTHING;


-- ============================================================
-- 3. THESIS SUBMISSIONS
-- ============================================================

INSERT INTO thesis_submissions
    (candidate_id, file_name, file_path, file_size_kb, submission_notes, submitted_at)
VALUES
(1, 'KIU_PHD_CS_2021_001_v1.pdf',
 '/uploads/theses/2021/cs/KIU_PHD_CS_2021_001_v1.pdf', 4820,
 'First and final submission. All chapters reviewed by supervisor.',
 '2024-01-15 09:00:00'),

(2, 'KIU_PHD_CS_2022_002_v1.pdf',
 '/uploads/theses/2022/cs/KIU_PHD_CS_2022_002_v1.pdf', 5230,
 'Initial submission after supervisor sign-off.',
 '2024-06-10 10:30:00'),

(3, 'KIU_PHD_CS_2022_003_v1.pdf',
 '/uploads/theses/2022/cs/KIU_PHD_CS_2022_003_v1.pdf', 3980,
 'Initial submission.',
 '2023-11-20 08:00:00'),
(3, 'KIU_PHD_CS_2022_003_v2.pdf',
 '/uploads/theses/2022/cs/KIU_PHD_CS_2022_003_v2.pdf', 4100,
 'Revised — addressed supervisor comments on Chapter 3 methodology.',
 '2024-02-14 11:00:00'),

(4, 'KIU_PHD_PHY_2020_001_v1.pdf',
 '/uploads/theses/2020/phy/KIU_PHD_PHY_2020_001_v1.pdf', 6100,
 'Final submission approved by supervisory committee.',
 '2023-03-05 08:00:00'),

(5, 'KIU_PHD_PHY_2022_002_v1.pdf',
 '/uploads/theses/2022/phy/KIU_PHD_PHY_2022_002_v1.pdf', 5570,
 'Submitted after internal departmental review.',
 '2024-09-02 14:00:00'),

(6, 'KIU_PHD_CHEM_2021_001_v1.pdf',
 '/uploads/theses/2021/chem/KIU_PHD_CHEM_2021_001_v1.pdf', 4450,
 'Comprehensive thesis with full experimental data appendix.',
 '2024-02-28 09:30:00'),

(7, 'KIU_PHD_PH_2021_001_v1.pdf',
 '/uploads/theses/2021/ph/KIU_PHD_PH_2021_001_v1.pdf', 5920,
 'Initial submission with full field data from Northern Uganda.',
 '2023-09-10 10:00:00'),
(7, 'KIU_PHD_PH_2021_001_v2.pdf',
 '/uploads/theses/2021/ph/KIU_PHD_PH_2021_001_v2.pdf', 6050,
 'Corrections: expanded discussion section; refined statistical models.',
 '2024-04-05 13:00:00'),

(8, 'KIU_PHD_PH_2022_002_v1.pdf',
 '/uploads/theses/2022/ph/KIU_PHD_PH_2022_002_v1.pdf', 5100,
 'Submitted following 3-year data collection phase.',
 '2024-07-22 11:00:00'),

(9, 'KIU_PHD_EA_2021_001_v1.pdf',
 '/uploads/theses/2021/ea/KIU_PHD_EA_2021_001_v1.pdf', 4630,
 'Thesis encompasses 12 case-study schools across 4 districts.',
 '2024-03-18 09:00:00'),

-- Candidate 10 has no submission yet (enrolled only)

-- Candidate 1 post-viva corrected version
(1, 'KIU_PHD_CS_2021_001_v2.pdf',
 '/uploads/theses/2021/cs/KIU_PHD_CS_2021_001_v2.pdf', 4890,
 'Post-viva corrections: minor typographic fixes and bibliography update.',
 '2024-06-01 10:00:00');


-- ============================================================
-- 4. VIVA SCHEDULES
--    created_by = viva coordinator ids (227–230)
-- ============================================================

INSERT INTO viva_schedules
    (candidate_id, thesis_id, scheduled_date, scheduled_time,
     venue, duration_minutes, status, postponement_reason, created_by)
VALUES
(1, 1, '2024-05-10', '09:00:00',
 'Senate Building, Board Room 1, Main Campus', 120, 'completed', NULL, 227),

(3, 4, '2024-04-08', '10:00:00',
 'SOMAC Conference Hall, Block B', 120, 'completed', NULL, 227),

(4, 5, '2023-06-15', '08:30:00',
 'SONAS Seminar Room 2', 90, 'completed', NULL, 228),

(6, 7, '2024-05-22', '09:00:00',
 'SONAS Seminar Room 1', 120, 'completed', NULL, 228),

(7, 8, '2024-01-25', '10:00:00',
 'SPH Conference Hall', 120, 'completed', NULL, 229),

(9, 11, '2024-06-14', '09:30:00',
 'CEODL Boardroom, Block A', 120, 'completed', NULL, 229),

(2, 2, '2026-05-20', '09:00:00',
 'Senate Building, Board Room 1, Main Campus', 120, 'scheduled', NULL, 227),

(8, 10, '2026-05-28', '10:00:00',
 'SPH Conference Hall', 120, 'scheduled', NULL, 229),

(5, 6, '2025-11-10', '09:00:00',
 'SONAS Seminar Room 2', 90, 'postponed',
 'External examiner travel visa delayed. Rescheduling in progress.', 228);


-- ============================================================
-- 5. VIVA EXAMINERS
-- ============================================================

INSERT INTO viva_examiners
    (viva_id, examiner_id, role, confirmed, confirmed_at, notified_at)
VALUES
-- ── Viva 1: CS Candidate 1 ─────────────────────────────────────────────────
(1, 31,  'chairperson',       TRUE, '2024-04-20 08:00:00', '2024-04-15 09:00:00'),
(1, 108, 'internal_examiner', TRUE, '2024-04-21 10:00:00', '2024-04-15 09:00:00'),
(1, 33,  'external_examiner', TRUE, '2024-04-22 14:00:00', '2024-04-15 09:00:00'),

-- ── Viva 2: CS Candidate 3 ─────────────────────────────────────────────────
(2, 32,  'chairperson',       TRUE, '2024-03-10 09:00:00', '2024-03-05 09:00:00'),
(2, 109, 'internal_examiner', TRUE, '2024-03-11 11:00:00', '2024-03-05 09:00:00'),
(2, 34,  'external_examiner', TRUE, '2024-03-12 15:00:00', '2024-03-05 09:00:00'),

-- ── Viva 3: Physics Candidate 4 ────────────────────────────────────────────
(3, 34,  'chairperson',       TRUE, '2023-05-20 08:00:00', '2023-05-15 09:00:00'),
(3, 132, 'internal_examiner', TRUE, '2023-05-21 10:00:00', '2023-05-15 09:00:00'),
(3, 36,  'external_examiner', TRUE, '2023-05-22 14:00:00', '2023-05-15 09:00:00'),

-- ── Viva 4: Chemistry Candidate 6 ──────────────────────────────────────────
(4, 37,  'chairperson',       TRUE, '2024-05-05 09:00:00', '2024-04-28 09:00:00'),
(4, 136, 'internal_examiner', TRUE, '2024-05-06 10:00:00', '2024-04-28 09:00:00'),
(4, 35,  'external_examiner', TRUE, '2024-05-07 14:00:00', '2024-04-28 09:00:00'),

-- ── Viva 5: Public Health Candidate 7 ──────────────────────────────────────
(5, 39,  'chairperson',       TRUE, '2024-01-10 09:00:00', '2024-01-05 09:00:00'),
(5, 144, 'internal_examiner', TRUE, '2024-01-11 11:00:00', '2024-01-05 09:00:00'),
(5, 58,  'external_examiner', TRUE, '2024-01-12 14:00:00', '2024-01-05 09:00:00'),

-- ── Viva 6: Educational Admin Candidate 9 ──────────────────────────────────
(6, 58,  'chairperson',       TRUE, '2024-05-25 09:00:00', '2024-05-20 09:00:00'),
(6, 194, 'internal_examiner', TRUE, '2024-05-26 10:00:00', '2024-05-20 09:00:00'),
(6, 39,  'external_examiner', TRUE, '2024-05-27 14:00:00', '2024-05-20 09:00:00'),

-- ── Viva 7: CS Candidate 2 (upcoming — not yet confirmed) ──────────────────
(7, 31,  'chairperson',       FALSE, NULL, '2026-04-25 09:00:00'),
(7, 110, 'internal_examiner', FALSE, NULL, '2026-04-25 09:00:00'),
(7, 123, 'external_examiner', FALSE, NULL, '2026-04-25 09:00:00'),

-- ── Viva 8: Public Health Candidate 8 (upcoming — not yet confirmed) ────────
(8, 38,  'chairperson',       FALSE, NULL, '2026-04-28 09:00:00'),
(8, 145, 'internal_examiner', FALSE, NULL, '2026-04-28 09:00:00'),
(8, 209, 'external_examiner', FALSE, NULL, '2026-04-28 09:00:00'),

-- ── Viva 9: Physics Candidate 5 (postponed) ─────────────────────────────────
(9, 34,  'chairperson',       TRUE,  '2025-10-20 09:00:00', '2025-10-15 09:00:00'),
(9, 133, 'internal_examiner', TRUE,  '2025-10-21 11:00:00', '2025-10-15 09:00:00'),
(9, 36,  'external_examiner', FALSE, NULL,                  '2025-10-15 09:00:00')
ON CONFLICT (viva_id, examiner_id) DO NOTHING;


-- ============================================================
-- 6. VIVA EVALUATIONS
--    Only for completed vivás (viva_ids 1–6)
-- ============================================================

INSERT INTO viva_evaluations
    (viva_id, examiner_id,
     originality_score, methodology_score, presentation_score, literature_score,
     strengths, weaknesses, recommended_corrections, general_comments,
     submitted_at, is_submitted)
VALUES
-- ═══════════════════════════════════════════════════════════════
-- VIVA 1 — CS Candidate 1: Deep Learning & Malaria Detection
-- ═══════════════════════════════════════════════════════════════
(1, 31,
 22, 21, 23, 22,
 'Exceptional novelty in applying attention-based CNN architectures to thick smear images. Clear clinical relevance.',
 'Discussion of model generalisability to other plasmodium species could be expanded.',
 'Add a one-paragraph limitation note on dataset diversity in Chapter 5.',
 'A well-executed doctoral thesis with strong real-world application. Recommended for publication in a Q1 journal.',
 '2024-05-10 12:30:00', TRUE),

(1, 108,
 23, 22, 21, 23,
 'Rigorous experimental design; ablation studies convincingly demonstrate component contributions.',
 'Minor inconsistency in Table 4.3 notation.',
 'Correct Table 4.3 notation and cross-check with Figure 4.5.',
 'Solid contribution to medical AI. Candidate handled all technical questions with confidence.',
 '2024-05-10 12:45:00', TRUE),

(1, 33,
 21, 23, 22, 20,
 'Statistical validation framework is thorough; F1-score analysis across class imbalance scenarios is commendable.',
 'Literature review slightly under-references recent 2023 works on vision transformers.',
 'Update literature review to include at least 3 vision-transformer papers from 2023.',
 'Cross-disciplinary collaboration between CS and medical sciences is well reflected.',
 '2024-05-10 13:00:00', TRUE),

-- ═══════════════════════════════════════════════════════════════
-- VIVA 2 — CS Candidate 3: Blockchain & Land Registry
-- ═══════════════════════════════════════════════════════════════
(2, 32,
 18, 14, 17, 16,
 'Problem is highly relevant to Uganda context; prototype implementation is functional.',
 'Chapter 3 methodology lacks formal security threat model. Scalability not empirically tested.',
 'Provide a formal threat model (e.g. STRIDE). Run load tests with 10k+ simulated transactions. Rewrite Chapter 3 Section 2.',
 'The research idea is sound but the execution requires significant strengthening before award.',
 '2024-04-08 13:00:00', TRUE),

(2, 109,
 17, 13, 18, 15,
 'Candidate demonstrated good knowledge of smart contract fundamentals during Q&A.',
 'Comparative analysis with existing Ugandan land systems is superficial.',
 'Expand comparative analysis in Chapter 2. Add quantitative benchmarking against manual registry process.',
 'With major corrections this can become a strong contribution to e-governance literature.',
 '2024-04-08 13:20:00', TRUE),

(2, 34,
 16, 15, 16, 14,
 'Novel application of distributed ledger technology in an African governance context.',
 'Privacy implications of storing land ownership on a public chain are insufficiently addressed.',
 'Add a dedicated section on GDPR/data protection compliance and propose a permissioned chain alternative.',
 'Interdisciplinary perspective welcomed but requires deeper legal and policy grounding.',
 '2024-04-08 13:40:00', TRUE),

-- ═══════════════════════════════════════════════════════════════
-- VIVA 3 — Physics Candidate 4: Solar-Wind Hybrid Systems
-- ═══════════════════════════════════════════════════════════════
(3, 34,
 24, 23, 22, 23,
 'Comprehensive field study across 6 rural villages; optimisation model validated against real operational data.',
 'Economic viability analysis could include sensitivity to exchange rate fluctuations.',
 'Add a sensitivity analysis paragraph in Chapter 6 discussion.',
 'Outstanding doctoral work with immediate policy implications for Uganda electrification strategy.',
 '2023-06-15 11:30:00', TRUE),

(3, 132,
 23, 24, 23, 22,
 'HOMER Pro modelling is expertly applied; candidate clearly understands system dynamics.',
 'Battery degradation modelling uses simplified assumptions.',
 'Acknowledge battery degradation assumptions as a study limitation.',
 'Among the strongest PhD theses in the department in recent years.',
 '2023-06-15 11:50:00', TRUE),

(3, 36,
 22, 22, 24, 23,
 'Interdisciplinary approach combining energy engineering with socioeconomic analysis is exemplary.',
 'Minor formatting inconsistencies in Appendix B.',
 'Correct Appendix B formatting.',
 'Highly recommended for publication and policy uptake.',
 '2023-06-15 12:10:00', TRUE),

-- ═══════════════════════════════════════════════════════════════
-- VIVA 4 — Chemistry Candidate 6: Silver Nanoparticles
-- ═══════════════════════════════════════════════════════════════
(4, 37,
 21, 20, 19, 21,
 'Green synthesis approach using local plant extracts is innovative and environmentally sound.',
 'MIC values should be compared against a wider panel of clinical isolates.',
 'Include data from at least 2 additional clinical bacterial strains in the antimicrobial assay.',
 'Valuable contribution to green nanotechnology with clear public health application.',
 '2024-05-22 12:00:00', TRUE),

(4, 136,
 20, 21, 20, 22,
 'XRD and FTIR characterisation is thorough; particle size analysis well-documented.',
 'Stability studies limited to 30 days; longer-term data would strengthen claims.',
 'Add a note on required longer-term stability studies as future work.',
 'Well-structured thesis; candidate answered characterisation questions confidently.',
 '2024-05-22 12:20:00', TRUE),

(4, 35,
 22, 19, 21, 20,
 'Rigorous statistical analysis of particle distribution; use of TEM imaging is appropriate.',
 'Mechanism of antimicrobial action section is brief and speculative.',
 'Expand mechanistic discussion with reference to membrane disruption literature.',
 'Good cross-disciplinary work; publication in a nanotechnology journal is encouraged.',
 '2024-05-22 12:40:00', TRUE),

-- ═══════════════════════════════════════════════════════════════
-- VIVA 5 — Public Health Candidate 7: Maternal Mortality
-- ═══════════════════════════════════════════════════════════════
(5, 39,
 20, 22, 21, 21,
 'Mixed-methods design is appropriately applied; qualitative findings enrich the quantitative data.',
 'Multivariate logistic regression model does not account for clustering at facility level.',
 'Re-run regression using multilevel modelling to account for facility-level clustering.',
 'Timely and policy-relevant research. Candidate showed strong command of epidemiological methods.',
 '2024-01-25 13:00:00', TRUE),

(5, 144,
 19, 21, 22, 20,
 'Community-level fieldwork is extensive; saturation achieved in qualitative component.',
 'Discussion chapter does not sufficiently link findings to Uganda national maternal health policy.',
 'Add a policy implications subsection in Chapter 5 referencing Uganda RMNCAH policy 2021.',
 'Strong public health research with direct applicability to district health planning.',
 '2024-01-25 13:20:00', TRUE),

(5, 58,
 21, 20, 20, 21,
 'Governance and health systems perspective is well integrated, reflecting interdisciplinary strength.',
 'Ethical approval documentation in appendix is incomplete — consent forms not attached.',
 'Attach all IRB consent form templates as required appendices.',
 'Sound research overall; the minor corrections are manageable within the stipulated period.',
 '2024-01-25 13:40:00', TRUE),

-- ═══════════════════════════════════════════════════════════════
-- VIVA 6 — Educational Admin Candidate 9: Transformational Leadership
-- ═══════════════════════════════════════════════════════════════
(6, 58,
 21, 22, 23, 22,
 'Conceptual framework is original; integration of distributed leadership theory with Ugandan school context is insightful.',
 'Sample size justification for the qualitative phase could be stronger.',
 'Add a brief sample size rationale paragraph in Chapter 3.',
 'A mature and well-written thesis. Candidate is clearly ready for academic contribution.',
 '2024-06-14 12:30:00', TRUE),

(6, 194,
 20, 21, 22, 21,
 'Case study schools are purposively selected and well-justified; triangulation of data sources is commendable.',
 'Limitations section does not address researcher positionality adequately.',
 'Expand limitations to include a positionality reflection as per qualitative research norms.',
 'Excellent grasp of educational management literature; ready for publication.',
 '2024-06-14 12:50:00', TRUE),

(6, 39,
 22, 20, 21, 23,
 'Cross-case analysis in Chapter 4 is systematic and well-presented.',
 'Minor: reference list has a few inconsistencies in APA formatting.',
 'Proof-read and correct the reference list for APA consistency.',
 'Strong interdisciplinary perspective from a public health viewpoint was appreciated.',
 '2024-06-14 13:10:00', TRUE)
ON CONFLICT (viva_id, examiner_id) DO NOTHING;


-- ============================================================
-- 7. VIVA RECOMMENDATIONS
-- ============================================================

INSERT INTO viva_recommendations
    (viva_id, outcome, correction_deadline, final_comments, issued_by, issued_at)
VALUES
(1, 'pass',
 NULL,
 'The panel unanimously recommends the award of the degree of Doctor of Philosophy in Computer Science. The candidate is encouraged to publish findings in a peer-reviewed Q1 journal within six months.',
 227, '2024-05-10 15:00:00'),

(2, 'pass_with_major_corrections',
 '2024-10-08',
 'The panel recommends that the candidate undertake major corrections as detailed in the individual examiner reports. A formal security threat model and empirical scalability testing are mandatory. The revised thesis must be re-examined by the internal examiner before final award.',
 227, '2024-04-08 15:00:00'),

(3, 'pass',
 NULL,
 'The panel unanimously recommends the award of the degree of Doctor of Philosophy in Physics. This thesis represents a significant contribution to the field of hybrid renewable energy systems and is recommended for policy uptake by the Ministry of Energy and Mineral Development.',
 228, '2023-06-15 14:00:00'),

(4, 'pass_with_minor_corrections',
 '2024-08-22',
 'The panel recommends award subject to minor corrections: inclusion of additional antimicrobial assay data and an expanded mechanistic discussion section. Corrections to be reviewed and approved by the primary supervisor.',
 228, '2024-05-22 14:30:00'),

(5, 'pass_with_minor_corrections',
 '2024-04-25',
 'The panel recommends award subject to minor corrections: multilevel statistical re-analysis, policy implications subsection, and complete IRB documentation. Corrections to be certified by the internal examiner.',
 229, '2024-01-25 15:30:00'),

(6, 'pass',
 NULL,
 'The panel unanimously recommends the award of the degree of Doctor of Philosophy in Management Sciences (Educational Administration). The candidate demonstrated exceptional command of the subject matter and is encouraged to develop a journal article from Chapter 4.',
 229, '2024-06-14 15:00:00')
ON CONFLICT (viva_id) DO NOTHING;

-- ============================================================
--  END OF SEED — PhD VIVA VOCE ADMINISTRATION
--  Records summary:
--    users (new)          :  14  (4 coordinators + 10 candidates)
--    phd_candidates       :  10
--    thesis_submissions   :  12  (10 initial + 2 re-submissions)
--    viva_schedules       :   9  (6 completed, 2 scheduled, 1 postponed)
--    viva_examiners       :  27  (3 per viva × 9)
--    viva_evaluations     :  18  (3 per completed viva × 6)
--    viva_recommendations :   6  (one per completed viva)
--  UEMS-PHD-VV v3.1  |  © 2026 Spider Tabs Ltd
-- ============================================================