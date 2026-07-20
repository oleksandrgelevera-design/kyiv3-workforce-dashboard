-- ============================================================================
-- Seed data: current district state, exported from the working application
-- (11 original stores + 3 added from later screenshots = 14 stores, 43 vacancies)
-- Safe to re-run: uses ON CONFLICT DO NOTHING so it won't duplicate or clobber
-- data that's already been edited in production.
-- ============================================================================

insert into public.stores
  (code, name, base_stakes, base_headcount, season_stakes, season_headcount,
   actual_stakes, actual_headcount, cpd_count, risky_count, has_disability_employee, comment)
values
  ('J017', 'Arkadia Shuliavka, Kyiv', 6.5, 9, 8.5, 12, NULL, NULL, NULL, NULL, NULL, ''),
  ('J019', 'Passage, Gatne', 6, 9, 7.75, 11, NULL, NULL, NULL, NULL, NULL, ''),
  ('J030', 'April City, Kyiv', 5, 7, 6.5, 9, NULL, NULL, NULL, NULL, NULL, ''),
  ('J061', 'Lobanovskiy, Kyiv', 6.5, 9, 8.5, 12, NULL, NULL, NULL, NULL, NULL, ''),
  ('J063', 'Nashe Nebo, Kryukovshchyna', 6.25, 9, 8.25, 12, NULL, NULL, NULL, NULL, NULL, ''),
  ('J068', 'Promenada, Kyiv', 4.5, 7, 5.75, 8, NULL, NULL, NULL, NULL, NULL, ''),
  ('J087', 'Respublica, Kyiv', 10.25, 15, 13.25, 19, NULL, NULL, NULL, NULL, NULL, ''),
  ('J097', 'Sofia Mall, S.Borschahivka', 7.25, 11, 9.5, 14, NULL, NULL, NULL, NULL, NULL, ''),
  ('J099', 'Rostok, Kyiv', 4.5, 6, 5.25, 8, NULL, NULL, NULL, NULL, NULL, ''),
  ('J100', 'Hlybochytsky, Kyiv', 4.5, 6, 5.25, 8, NULL, NULL, NULL, NULL, NULL, ''),
  ('J116', 'Promenada Park', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ''),
  ('J010', 'Ukraina, Kyiv', 6.5, 9, 8.5, 12, 5.75, 7, NULL, NULL, NULL, ''),
  ('J022', 'Gulliver, Kyiv', 8, 12, 10.5, 15, 9.25, 13, NULL, NULL, NULL, ''),
  ('J080', 'Good Life, Kyiv', 6.75, 10, 8.75, 13, 6.5, 8, NULL, NULL, NULL, '')
on conflict (code) do nothing;

insert into public.vacancies
  (id, store_code, vacancy_name, position, employment_share, opened_date, hired_date, hire_status,
   responsible_person, priority, minor_employee_present, search_channels, marketing_presence,
   ambassador_actions, comments, work_ua_contacts, work_ua_updated_at)
values
  ('v_seed_01', 'J017', NULL, 'LR', 1, '2026-03-23'::date, '2026-05-18'::date, 'filled', 'SM', NULL, NULL, '{"ворк","приведи друга"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', 'знайти людину)))', 'Один раз на тиждень дзвінок від амасадора', NULL, NULL),
  ('v_seed_02', 'J017', NULL, 'AR', 0.75, '2026-04-09'::date, '2026-04-14'::date, 'filled', 'SM', NULL, NULL, '{"ворк","приведи друга"}', '', '', '', NULL, NULL),
  ('v_seed_03', 'J017', NULL, 'SA', 0.5, '2026-05-13'::date, '2026-06-17'::date, 'filled', 'SM', NULL, 1, '{"ворк","особиста реклама","приведи друга"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', NULL, NULL),
  ('v_seed_04', 'J017', NULL, 'AR', 0.5, '2026-06-09'::date, '2026-07-01'::date, 'filled', NULL, NULL, 1, '{}', '', '', '', NULL, NULL),
  ('v_seed_05', 'J017', NULL, 'SA', 0.5, '2026-06-30'::date, NULL, 'open', 'SM', NULL, 1, '{}', '', '', '', 21, NULL),
  ('v_seed_06', 'J019', NULL, 'LR', 0.75, '2026-02-22'::date, NULL, 'transferred', 'SM', NULL, NULL, '{"ворк","телеграм канали","тік ток"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', NULL, NULL),
  ('v_seed_07', 'J030', NULL, 'AR', 0.75, '2026-05-27'::date, '2026-06-22'::date, 'filled', 'SM', NULL, 1, '{}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', 19, NULL),
  ('v_seed_08', 'J030', NULL, 'AR', 0.75, '2026-02-02'::date, NULL, 'transferred', 'SM', NULL, NULL, '{"ворк"}', 'А1,брошурки на касах, А4 по залу', 'справляється сам', '', 19, NULL),
  ('v_seed_09', 'J030', NULL, 'SA', 0.5, '2026-05-19'::date, '2026-07-01'::date, 'filled', 'SM', NULL, 1, '{"ворк","особиста реклама","приведи друга"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', 7, NULL),
  ('v_seed_10', 'J030', NULL, 'AR', 0.75, '2026-02-02'::date, NULL, 'transferred', 'SM', NULL, NULL, '{"ворк"}', 'А1,брошурки на касах, А4 по залу', 'справляється сам', '', 7, NULL),
  ('v_seed_11', 'J061', NULL, 'LR', 0.75, '2026-03-25'::date, '2026-06-07'::date, 'filled', 'SM', NULL, 2, '{"ворк","особиста реклама","приведи друга"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', 'знайти людину)))', 'Один раз на тиждень дзвінок від амасадора', 7, NULL),
  ('v_seed_12', 'J061', NULL, 'SA', 0.5, '2026-05-12'::date, '2026-05-22'::date, 'filled', 'SM.DepSM', NULL, NULL, '{"ворк","особиста реклама","приведи друга"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', NULL, NULL),
  ('v_seed_13', 'J061', NULL, 'SA', 0.5, '2026-05-19'::date, '2026-06-23'::date, 'filled', 'SM.DepSM', NULL, 2, '{"ворк","особиста реклама","приведи друга"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', 22, NULL),
  ('v_seed_14', 'J061', NULL, 'SA', 0.5, '2026-05-19'::date, NULL, 'unclear', 'SM.DepSM', NULL, 2, '{"ворк","особиста реклама","приведи друга"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', 22, NULL),
  ('v_seed_15', 'J063', NULL, 'AR', 0.75, '2026-05-07'::date, NULL, 'open', 'SM.DepSM', 1, 2, '{"ворк","особиста реклама","приведи друга"}', 'А1, брошурки на касах', '', '', NULL, NULL),
  ('v_seed_16', 'J063', NULL, 'AR', 0.75, '2026-05-07'::date, NULL, 'open', 'SM.DepSM', 1, 2, '{"ворк","особиста реклама","приведи друга"}', 'А1, брошурки на касах', '', '', NULL, NULL),
  ('v_seed_17', 'J068', NULL, 'AR', 0.75, '2026-01-27'::date, '2026-04-21'::date, 'filled', 'SM.DepSM', NULL, NULL, '{"ворк","приведи друга(плануєш)"}', '', 'справляється сам', '', NULL, NULL),
  ('v_seed_18', 'J068', NULL, 'AR', 0.75, '2026-01-27'::date, '2026-04-18'::date, 'filled', 'SM.DepSM', NULL, NULL, '{"ворк","приведи друга(плануєш)"}', 'А1,брошурки на касах, А4 по залу', '', 'Один раз на тиждень дзвінок від амасадора', NULL, NULL),
  ('v_seed_19', 'J068', NULL, 'AR', 0.75, '2026-04-18'::date, '2026-06-15'::date, 'filled', 'SM.DepSM', NULL, 2, '{"ворк","особиста реклама","приведи друга"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', 18, NULL),
  ('v_seed_20', 'J068', NULL, 'LR', 0.5, '2026-05-14'::date, '2026-06-15'::date, 'filled', 'SM.DepSM', NULL, 2, '{"ворк","особиста реклама","приведи друга"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', 18, NULL),
  ('v_seed_21', 'J087', NULL, 'SA', 0.75, '2026-03-17'::date, '2026-06-01'::date, 'filled', 'SMT', NULL, 3, '{"ворк","телеграм канали","маркетинг"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', 'сама собі поможу', 'Один раз на тиждень дзвінок від амасадора', NULL, NULL),
  ('v_seed_22', 'J087', NULL, 'SA', 0.5, '2026-05-28'::date, '2026-06-23'::date, 'filled', 'SMT', NULL, 3, '{"ворк","телеграм канали","маркетинг"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', 38, NULL),
  ('v_seed_23', 'J087', NULL, 'SA', 0.75, '2026-05-28'::date, '2026-06-29'::date, 'filled', 'SMT', NULL, 3, '{"ворк","телеграм канали","маркетинг"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', NULL, NULL),
  ('v_seed_24', 'J087', NULL, 'SA', 0.5, '2026-06-25'::date, NULL, 'open', 'SMT', NULL, 3, '{}', '', '', '', 43, NULL),
  ('v_seed_25', 'J097', NULL, 'LR', 1, '2026-02-05'::date, '2026-06-08'::date, 'filled', 'DepSM', NULL, NULL, '{"ворк","телеграм канали"}', 'А1,брошурки на касах, А4 по залу + брендування скла + павук в ТЦ', '', 'Два рази на тиждень розвома з Олексієм, важливо щоб DepSM теж цим займався', NULL, NULL),
  ('v_seed_26', 'J097', NULL, 'SA', 0.75, '2026-04-18'::date, '2026-06-22'::date, 'filled', 'DepSM', NULL, NULL, '{"ворк","телеграм канали"}', 'А1,брошурки на касах, А4 по залу + брендування скла + павук в ТЦ', '', '', 18, NULL),
  ('v_seed_27', 'J097', NULL, 'SA', 0.5, '2026-06-08'::date, '2026-07-03'::date, 'filled', 'DepSM', NULL, NULL, '{}', '', '', '', NULL, NULL),
  ('v_seed_28', 'J099', NULL, 'AR', 0.75, '2026-02-03'::date, NULL, 'transferred', 'SM', NULL, NULL, '{"ворк"}', 'А1,брошурки на касах, А4 по залу', '', 'новий керуючий', 18, NULL),
  ('v_seed_29', 'J099', NULL, 'AR', 0.75, '2026-06-30'::date, NULL, 'open', 'SM', NULL, NULL, '{}', '', '', '', 10, NULL),
  ('v_seed_30', 'J099', NULL, 'LR', 0.75, '2026-06-24'::date, NULL, 'open', 'SM', 1, NULL, '{}', '', '', '', 10, NULL),
  ('v_seed_31', 'J116', NULL, 'LR', 0.75, '2026-02-26'::date, '2026-05-04'::date, 'filled', 'SM', NULL, NULL, '{"ворк","телеграм канали"}', 'Великий постер на весь фасад', 'допомога з рекламою', '', NULL, NULL),
  ('v_extra_01', 'J010', NULL, 'LR', 0.75, '2026-05-28'::date, '2026-07-13'::date, 'filled', 'DepSM', 2, NULL, '{}', '', '', '', 39, NULL),
  ('v_extra_02', 'J010', NULL, 'SA', 0.75, '2026-03-04'::date, '2026-07-02'::date, 'filled', 'SM', NULL, NULL, '{"ворк","приведи друга + стажери"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', 'знайти людину)))', '', 39, NULL),
  ('v_extra_03', 'J022', NULL, 'LR', 1, '2026-02-24'::date, '2026-05-28'::date, 'filled', 'SMT', NULL, NULL, '{"ворк"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4+павук', '', 'Два рази на тиждень розвома з Сергієм, важливо щоб DepSM теж цим займався', NULL, NULL),
  ('v_extra_04', 'J022', NULL, 'SA', 0.75, '2026-04-09'::date, '2026-05-04'::date, 'filled', 'SMT', NULL, NULL, '{"ворк"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', NULL, NULL),
  ('v_extra_05', 'J080', NULL, 'SA', 0.5, '2026-03-12'::date, '2026-05-18'::date, 'filled', 'SM', NULL, NULL, '{}', 'А1,брошурки на касах, А4 по залу + постер в ТЦ великий', 'справляється сам', 'Один раз на тиждень дзвінок від амасадора', NULL, NULL),
  ('v_extra_06', 'J080', NULL, 'SA', 0.25, '2026-05-13'::date, '2026-05-28'::date, 'filled', 'SM', NULL, NULL, '{"ворк","особиста реклама","приведи друга"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', NULL, NULL),
  ('v_extra_07', 'J080', NULL, 'SA', 0.75, '2026-05-13'::date, NULL, 'open', 'SM', NULL, NULL, '{"ворк","особиста реклама","приведи друга"}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', NULL, NULL),
  ('v_extra_08', 'J080', NULL, 'SA', 0.5, '2026-05-27'::date, NULL, 'open', 'SM.DepSM', NULL, NULL, '{}', 'А1,брошурки на касах, А4 по залу + стажери А1,А4', '', '', NULL, NULL),
  ('v_extra_09', 'J022', NULL, 'SA', 0.5, '2026-06-30'::date, NULL, 'open', 'SMT', NULL, NULL, '{}', '', '', '', NULL, NULL),
  ('v_extra_10', 'J080', NULL, 'SA', 0.75, '2026-05-28'::date, '2026-07-04'::date, 'filled', NULL, NULL, NULL, '{}', '', '', '', NULL, NULL),
  ('v_extra_11', 'J080', NULL, 'SA', 0.75, '2026-07-08'::date, NULL, 'open', NULL, NULL, NULL, '{}', '', '', '', NULL, NULL),
  ('v_extra_12', 'J010', NULL, 'SA', 0.5, '2026-07-12'::date, NULL, 'open', NULL, NULL, NULL, '{}', '', '', '', NULL, NULL)
on conflict (id) do nothing;
