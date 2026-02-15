# Vercel & Supabase Setup Guide

To fix the "Failed to fetch" error on Vercel, you must configure the environment
variables that are present in your local `.env` file.

## 1. Configure Vercel Environment Variables

1. Go to your **Vercel Dashboard** and select your project (`vsl-haven-V1`).
2. Navigate to **Settings** > **Environment Variables**.
3. Add the following variables (copy values from your local `.env` file):

   | Key                             | Value Description                                           |
   | :------------------------------ | :---------------------------------------------------------- |
   | `VITE_SUPABASE_URL`             | Your Supabase project URL (e.g., `https://xyz.supabase.co`) |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase Anon/Public Key                               |

   _Note: Ensure you uncheck "Automatically expose System Environment Variables"
   if it conflicts, but usually just adding these two is enough._

## 2. Configure Supabase Redirect URLs

Authentication often fails if the redirect URL is not whitelisted.

1. Go to your **Supabase Dashboard** > **Authentication** > **URL
   Configuration**.
2. Add your Vercel deployment URL to **Site URL** or **Redirect URLs**.
   - Example: `https://vsl-haven-v1.vercel.app/**`
   - It is recommended to add `https://<your-project>.vercel.app/**` to allow
     all subpaths.

## 3. Redeploy

After adding the environment variables, you must **Redeploy** your application
on Vercel for the changes to take effect.

1. Go to **Deployments**.
2. Click the three dots (`...`) on the latest deployment.
3. Select **Redeploy**.
