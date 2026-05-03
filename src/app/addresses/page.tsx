'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PreciousPostLogo } from '@/components/Logo'
import { Address } from '@/types'

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('addresses').select('*').order('name')
    setAddresses(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function deleteAddress(id: string) {
    if (!confirm('Delete this address?')) return
    const supabase = createClient()
    await supabase.from('addresses').delete().eq('id', id)
    load()
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-blush)' }}>
      <nav className="bg-white border-b px-4 py-3" style={{ borderColor: 'var(--color-blush-dark)' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <PreciousPostLogo size="sm" />
          <Link href="/dashboard" className="text-sm" style={{ color: 'var(--color-charcoal-light)' }}>← Dashboard</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
            Address Book
          </h1>
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="px-4 py-2 rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--color-mauve)' }}
          >
            + Add address
          </button>
        </div>

        {(showForm || editing) && (
          <AddressForm
            initial={editing}
            onSave={() => { setShowForm(false); setEditing(null); load() }}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        )}

        {loading ? (
          <p className="text-sm" style={{ color: 'var(--color-charcoal-light)' }}>Loading…</p>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-3xl mb-3">📬</p>
            <p className="font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>No addresses yet</p>
            <p className="text-sm" style={{ color: 'var(--color-charcoal-light)' }}>Add a recipient to start sending letters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-white rounded-xl px-4 py-4 shadow-sm flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--color-charcoal)' }}>{addr.name}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-charcoal-light)' }}>
                    {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}<br />
                    {addr.city}, {addr.state} {addr.zip} · {addr.country}
                  </p>
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => { setEditing(addr); setShowForm(false) }}
                    className="text-xs underline"
                    style={{ color: 'var(--color-mauve)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAddress(addr.id)}
                    className="text-xs underline text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function AddressForm({ initial, onSave, onCancel }: { initial: Address | null; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    address_line1: initial?.address_line1 ?? '',
    address_line2: initial?.address_line2 ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
    zip: initial?.zip ?? '',
    country: initial?.country ?? 'US',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function update(field: string, value: string) {
    const titleCaseFields = ['name', 'address_line1', 'address_line2', 'city']
    const formatted =
      titleCaseFields.includes(field) ? toTitleCase(value) :
      field === 'state' ? value.toUpperCase() :
      value
    setForm(f => ({ ...f, [field]: formatted }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    let error
    if (initial) {
      ;({ error } = await supabase.from('addresses').update(form).eq('id', initial.id))
    } else {
      ;({ error } = await supabase.from('addresses').insert({ ...form, user_id: user.id }))
    }

    setSaving(false)
    if (error) { alert('Could not save address: ' + error.message); return }
    setSaved(true)
    setTimeout(() => { onSave() }, 1200)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm mb-4">
      <h2 className="font-semibold mb-4" style={{ color: 'var(--color-charcoal)' }}>
        {initial ? 'Edit address' : 'New address'}
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Recipient name" value={form.name} onChange={v => update('name', v)} required colSpan />
        <Field label="Address line 1" value={form.address_line1} onChange={v => update('address_line1', v)} required colSpan />
        <Field label="Address line 2 (optional)" value={form.address_line2} onChange={v => update('address_line2', v)} colSpan />
        <Field label="City" value={form.city} onChange={v => update('city', v)} required />
        <Field label="State" value={form.state} onChange={v => update('state', v)} required />
        <Field label="ZIP code" value={form.zip} onChange={v => update('zip', v)} required />
        <Field label="Country" value={form.country} onChange={v => update('country', v)} required />
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button
          type="submit"
          disabled={saving || saved}
          className="px-5 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-mauve)' }}
        >
          {saving ? 'Saving…' : 'Save address'}
        </button>
        {saved && (
          <span className="text-sm font-medium" style={{ color: '#22c55e' }}>✓ Saved!</span>
        )}
        {!saved && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-full text-sm" style={{ color: 'var(--color-charcoal-light)' }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

// Capitalizes the first letter of every word, lowercases the rest
function toTitleCase(str: string) {
  return str.replace(/\b(\w)(\w*)/g, (_, first, rest) => first.toUpperCase() + rest.toLowerCase())
}

function Field({ label, value, onChange, required, colSpan }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; colSpan?: boolean }) {
  return (
    <div className={colSpan ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
        style={{ borderColor: '#e5e7eb' }}
      />
    </div>
  )
}
