'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

export function AccountClient({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ name, phone }).eq('user_id', profile.user_id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>Full name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: '#e5e7eb' }}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>Email</label>
        <input
          type="email"
          value={profile.email}
          disabled
          className="w-full px-3 py-2.5 rounded-xl border text-sm opacity-50 bg-gray-50"
          style={{ borderColor: '#e5e7eb' }}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>
          Phone <span className="font-normal opacity-60">(for SMS reminders)</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+1 555 555 5555"
          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: '#e5e7eb' }}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-mauve)' }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-sm" style={{ color: '#22c55e' }}>Saved ✓</span>}
      </div>
    </form>
  )
}
