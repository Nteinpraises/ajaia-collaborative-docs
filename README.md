# Ajaia Docs

Ajaia Docs is a collaborative document workspace. Signed-in users create and edit rich-text documents, share them with other Ajaia Docs users, and manage uploaded files.

> Note: Ajaia Docs does **not** support real-time simultaneous editing. Collaboration happens through document sharing.

## Features

- **Authentication** with Supabase Auth (sign up / sign in).
- **Protected routes**: all app pages live under an authenticated layout (`src/routes/_authenticated`) that redirects signed-out visitors to `/auth`.
- **Documents**: create, open, rename, edit, delete. Content autosaves shortly after you stop typing.
- **Rich-text editing** with Tiptap (StarterKit).
- **Sharing**: a document owner can share a document by entering another registered user's email address. Shared users get **view-only** access; only the owner can edit, rename, delete or share.
- **Shared with me** page listing documents others have shared with you.
- **File uploads** with Supabase Storage (`document-uploads` bucket): upload, list and delete your own files. Files are stored privately per user. Attaching uploaded files to documents is not implemented yet.
- **Account** page for editing your profile.
- **Responsive interface** for desktop and mobile.
- **Row Level Security** on all tables and storage: users can only read their own documents or documents shared with them, and only access files in their own storage folder.

## Tech stack

- React 19, TypeScript
- TanStack Start / TanStack Router (file-based routing, server functions), TanStack Query
- Vite
- Tailwind CSS v4, shadcn/ui (Radix UI)
- Tiptap rich-text editor
- Supabase (PostgreSQL, Auth, Storage, RLS)
- Zod for input validation
- Vitest + Testing Library, ESLint, Prettier

## Project structure

```
src/
  components/            Shared UI (app shell, document list, shadcn/ui)
  integrations/supabase/ Supabase clients, auth middleware, generated types
  lib/                   Server functions (documents.functions.ts) and utilities
  routes/
    auth.tsx             Sign in / sign up
    index.tsx            Landing page
    _authenticated/      Protected pages: documents, document editor,
                         shared, uploads, account
  test/                  Vitest tests and setup
supabase/
  migrations/            Database schema, RLS policies, storage bucket
```



