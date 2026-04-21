# Setup — Supabase

Guide en 7 étapes pour brancher la base de données et l'auth email + mot de passe.

---

## 1. Créer le projet Supabase

1. Va sur https://supabase.com → **New project**.
2. Région : `eu-west-3` (Paris) ou `eu-central-1` (Francfort).
3. Mot de passe DB : garde-le dans ton password manager.
4. Attends que le projet soit provisionné (~1 min).

---

## 2. Récupérer les clés

Dans le projet : **Settings → API**. Note :

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Crée un fichier `.env.local` à la racine du repo (copie de `.env.example`) :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...
```

---

## 3. Exécuter le schéma SQL

Dans Supabase : **SQL Editor → New query**.

Exécute dans l'ordre :

1. `supabase/migrations/0001_init.sql` — schéma users/projects/time_entries + RLS + trigger
2. `supabase/migrations/0002_active_timer.sql` — table `active_timers` pour la persistance cross-device du timer

Vérifie dans **Table Editor** que les 4 tables apparaissent avec l'icône RLS active.

---

## 4. Configurer l'auth email + password

**Authentication → Providers → Email** :

- **Enable Email provider** : ON
- **Confirm email** : OFF (recommandé pour un usage privé 2 personnes — la création de compte donne une session immédiate, pas besoin de cliquer sur un lien dans un email)
- **Enable sign ups** : ON pendant la création des comptes Diego + Ismaël, puis tu peux le couper pour bloquer toute inscription future

Si tu laisses *Confirm email* sur ON, la création de compte enverra un mail — dans ce cas va à l'étape 6 pour configurer les Redirect URLs.

---

## 5. Créer les comptes

Deux façons :

**(a) Depuis l'app** — une fois les env vars posées et l'app lancée, ouvre `/login` → onglet **Créer un compte** → renseigne nom + email + mot de passe (min 6 car). Diego et Ismaël chacun leur tour.

**(b) Depuis le dashboard Supabase** — **Authentication → Users → Add user → Create new user** → renseigne email + password + clique *Auto Confirm User* pour skipper la confirmation.

> Le trigger SQL `handle_new_user` crée automatiquement la ligne dans `public.users` avec nom/initiales dérivés (du `raw_user_meta_data.name` s'il est fourni, sinon du préfixe de l'email).

---

## 6. (Optionnel) Seed de projets

Une fois qu'au moins un utilisateur est créé, tu peux préremplir 5 projets :

**SQL Editor** → copie `supabase/seed/projects.sql` → **Run**.

---

## 7. Configurer les URLs (seulement si confirm email = ON)

**Authentication → URL Configuration** :

- **Site URL** : `http://localhost:3000` (dev) ou ton URL Vercel (prod).
- **Redirect URLs** : ajoute `http://localhost:3000/auth/callback` et `https://<ton-projet>.vercel.app/auth/callback`.

Sinon le lien de confirmation refusera de rediriger.

---

## 8. Lancer le dev

```bash
npm run dev
```

L'app détecte les variables d'env : toute route non authentifiée redirige vers `/login`. Tape email + mot de passe, connecte-toi.

---

## Résumé des fichiers créés

```
supabase/
  migrations/
    0001_init.sql             ← schéma + RLS + trigger
    0002_active_timer.sql     ← timer persisté côté serveur
  seed/projects.sql           ← projets initiaux (optionnel)
lib/
  supabase/                   ← clients browser / server / middleware
  db/queries.ts               ← lectures (users, projects, entries, timer)
  actions/
    entries.ts                ← add/update/delete entry
    projects.ts               ← add/rename/delete project
    user.ts                   ← updateProfile / signOut
    timer.ts                  ← start/pause/set/reset/stop+save
app/
  (auth)/login/               ← login email + password (+ signup)
  auth/callback/route.ts      ← utilisé par la confirmation email si activée
```
