import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
	const msg = `Missing required Supabase env vars. Add the following to your .env.local in the repo root:\n\nNEXT_PUBLIC_SUPABASE_URL=your-project-url\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n\nThen restart the dev server.`
	// Log a clear error in both server and client contexts
	if (typeof window !== 'undefined') {
		// Client-side: show console error
		// eslint-disable-next-line no-console
		console.error(msg)
	} else {
		// Server-side: log to stderr
		// eslint-disable-next-line no-console
		console.error(msg)
	}
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')
