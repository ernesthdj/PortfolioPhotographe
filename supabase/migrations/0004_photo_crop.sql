-- Cadrage manuel (zoom + position) par photo/slot — voir plan "Recadrage" du 2026-07-30.
-- Colonnes nullables : une photo sans crop garde le rendu object-cover centré actuel
-- (rétrocompatible, aucune migration de données requise sur les photos existantes).
-- crop_x/y/width/height sont exprimés en pixels de l'image originale (image_width/height).
alter table photos
  add column image_width int,
  add column image_height int,
  add column crop_x int,
  add column crop_y int,
  add column crop_width int,
  add column crop_height int;
