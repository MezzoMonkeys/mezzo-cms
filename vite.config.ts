import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Windows mapped-drive fix: fs.realpathSync.native converts M:\ to \\server\share\
// which Vite then mis-converts back to M:\server\share\ (mangled path).
// Preserve drive-letter paths as-is so Vite can open the files correctly.
const _origNativeSync = fs.realpathSync.native.bind(fs.realpathSync)
;(fs.realpathSync as any).native = (p: unknown) => {
  const r = _origNativeSync(p as string)
  if (typeof p === 'string' && /^[A-Za-z]:\\/.test(p) && r.startsWith('\\\\')) return p
  return r
}
const _origRealpathAsync = fs.promises.realpath
const _patched = async (p: unknown, opts?: unknown) => {
  const r = await _origRealpathAsync(p as string, opts as fs.ObjectEncodingOptions)
  if (typeof p === 'string' && /^[A-Za-z]:\\/.test(p) && r.startsWith('\\\\')) return p
  return r
}
;(_patched as any).native = async (p: unknown, opts?: unknown) => {
  const r = await (_origRealpathAsync as any).native(p, opts)
  if (typeof p === 'string' && /^[A-Za-z]:\\/.test(p) && r.startsWith('\\\\')) return p
  return r
}
;(fs.promises as any).realpath = _patched

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(process.cwd(), 'src'),
    },
  },
  server: {
    fs: {
      strict: false,
      allow: ['M:/'],
    },
  },
  optimizeDeps: {
    noDiscovery: true,
    include: [
      'react', 'react-dom', 'react-dom/client',
      'react/jsx-dev-runtime', 'react/jsx-runtime',
      '@supabase/supabase-js', 'react-router-dom',
      'react-hot-toast', 'lucide-react',
      '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities',
    ],
  },
})
