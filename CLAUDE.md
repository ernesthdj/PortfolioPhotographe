# CLAUDE.md — PortfolioPhotographe

> **Projet :** PortfolioPhotographe
> **Slug :** portfolio-photographe
> **Type :** Web App
> **Cree le :** 2026-07-28
> **Description :** Mon site web vitrine en tant que photographe pour publier mes meilleurs photos, et permettre aux clients de se simuler des devis et me cotacter pour mes services.

---

## Contexte

Site personnel sur mesure (a distinguer de PhotoDeck, produit generique destine a d'autres photographes).
Voir `docs/FONDATION.md` (brainstorm complet) et `docs/PROMPT_DESIGN.md` (brief design).

## Stack

- Next.js 16 (App Router, TypeScript, `src/` dir) + Tailwind CSS v4 (config CSS-first via `@theme` dans `globals.css`, pas de `tailwind.config.js`)
- Framer Motion (animations scroll/transitions)
- Polices : Cormorant Garamond (serif, titres) + Manrope (sans-serif, corps) via `next/font/google`
- A venir : Supabase (DB+Auth admin), Cloudinary (photos), Resend (email), Vercel (hosting, domaine `ernestphotography.com`)

**Important** — `AGENTS.md` a la racine signale des breaking changes Next.js 16 vs les habitudes classiques : toujours verifier `node_modules/next/dist/docs/` ou le skill `vercel:nextjs` avant d'utiliser une API Next.js.

## Structure

```
portfolio-photographe/
├── CLAUDE.md
├── AGENTS.md          # Avertissement breaking changes Next.js 16
├── docs/
│   ├── JOURNAL.md
│   ├── FONDATION.md
│   └── PROMPT_DESIGN.md
├── src/app/           # App Router (layout, page, globals.css)
├── public/images/     # Photos extraites du mock Claude Design
└── tests/
```

## Regles specifiques

- Direction visuelle : voir mock Claude Design "Ernest H Photography" (direction 5a, "Direction finale") — projet `2300b657-e8df-473b-b3d1-8c938410c29b`, importe via DesignSync.
- Palette : `#EFE7D8` (fond crème), `#2B2521` (encre), `#8A5A2F`/`#C9A46B` (bronze/or), `#F4EEE4` (texte clair sur fond sombre), `#1C1712`/`#241E17` (fond sombre).
- Les regles globales de `~/.claude/CLAUDE.md` s'appliquent par defaut.

## Workflows actifs

- [x] Brainstorm initial (`/brainstorm`)
- [x] Session design (Claude Design)
- [ ] Implementation front-end (en cours)
- [ ] Backend devis/CMS (Supabase, a venir)
- [ ] Graphify projet (`/graphify`)
