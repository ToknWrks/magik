'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Boundary } from '@/components/ui/boundary'
import * as Astronomy from 'astronomy-engine'

// ── Types ─────────────────────────────────────────────────────────────────────

interface User {
  id: string
  email: string
  username: string
  role: string
  avatar_url: string | null
  bio: string | null
}

interface Reading {
  id: string
  birth_date: string
  birth_time: string | null
  birth_location: string
  report: string
  created_at: string
}

// ── Astrology utilities ───────────────────────────────────────────────────────

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
const ASPECTS = [
  { name: 'Conjunction', angle: 0 },
  { name: 'Sextile', angle: 60 },
  { name: 'Square', angle: 90 },
  { name: 'Trine', angle: 120 },
  { name: 'Opposition', angle: 180 },
]
const ORB_LIMIT = 15
const ZODIAC = [
  { name: 'Aries', symbol: '♈' },
  { name: 'Taurus', symbol: '♉' },
  { name: 'Gemini', symbol: '♊' },
  { name: 'Cancer', symbol: '♋' },
  { name: 'Leo', symbol: '♌' },
  { name: 'Virgo', symbol: '♍' },
  { name: 'Libra', symbol: '♎' },
  { name: 'Scorpio', symbol: '♏' },
  { name: 'Sagittarius', symbol: '♐' },
  { name: 'Capricorn', symbol: '♑' },
  { name: 'Aquarius', symbol: '♒' },
  { name: 'Pisces', symbol: '♓' },
]

function getPlanetLon(planet: string, date: Date): number {
  const vec = Astronomy.GeoVector(planet as any, date, false)
  return Astronomy.Ecliptic(vec).elon
}

function lonToZodiac(lon: number) {
  const n = ((lon % 360) + 360) % 360
  const idx = Math.floor(n / 30)
  return { ...ZODIAC[idx], degree: parseFloat((n % 30).toFixed(1)) }
}

function calculateNatalPositions(birthDate: string, birthTime?: string | null): Record<string, number> {
  const [year, month, day] = birthDate.split('-').map(Number)
  let hours = 12, minutes = 0
  if (birthTime) [hours, minutes] = birthTime.split(':').map(Number)
  const date = new Date(year, month - 1, day, hours, minutes)
  const positions: Record<string, number> = {}
  for (const planet of PLANETS) {
    try { positions[planet] = getPlanetLon(planet, date) } catch { /* skip */ }
  }
  return positions
}

function findActiveTransits(natalPositions: Record<string, number>) {
  const today = new Date()
  const tomorrow = new Date(today.getTime() + 86_400_000)
  const transits: { transitPlanet: string; natalPlanet: string; aspect: string; orb: number }[] = []

  for (const transitPlanet of PLANETS) {
    const lon = getPlanetLon(transitPlanet, today)
    for (const [natalPlanet, natalLon] of Object.entries(natalPositions)) {
      for (const asp of ASPECTS) {
        let diff = Math.abs(lon - natalLon)
        diff = Math.min(diff, 360 - diff)
        const orb = Math.abs(diff - asp.angle)
        if (orb <= ORB_LIMIT) {
          transits.push({ transitPlanet, natalPlanet, aspect: asp.name, orb: parseFloat(orb.toFixed(2)) })
        }
      }
    }
  }
  return transits.sort((a, b) => a.orb - b.orb).slice(0, 6)
}

// ── Image compression ─────────────────────────────────────────────────────────

function compressImage(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = url
  })
}

// ── Section: Natal Chart ──────────────────────────────────────────────────────

function NatalChartSection({ reading }: { reading: Reading }) {
  const natal = calculateNatalPositions(reading.birth_date, reading.birth_time)
  const transits = findActiveTransits(natal)

  return (
    <div className="space-y-4">
      {/* Natal Positions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Natal Chart</h2>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{reading.birth_date} · {reading.birth_location}</span>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PLANETS.map(planet => {
            const pos = natal[planet]
            if (pos === undefined) return null
            const z = lonToZodiac(pos)
            return (
              <div key={planet} className="flex items-center gap-2">
                <span className="text-lg leading-none text-gray-300 dark:text-gray-600 w-6 text-center select-none">{z.symbol}</span>
                <div>
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-tight">{planet}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{z.name} {z.degree}°</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Transits */}
      {transits.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Active Transits Today</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {transits.map((t, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t.transitPlanet} {t.aspect} {t.natalPlanet}
                  </span>
                </div>
                <span className="text-xs text-gray-400 tabular-nums">{t.orb}° orb</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
            <Link href="/settings/readings" className="text-xs text-yellow-700 dark:text-yellow-500 hover:underline font-medium">
              View full reading with charts →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfileClient() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [latestReading, setLatestReading] = useState<Reading | null>(null)
  const [credits, setCredits] = useState<number | null>(null)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/astrology/readings', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/credits/balance', { credentials: 'include' }).then(r => r.json()).catch(() => ({ balance: null })),
    ]).then(([authData, readingsData, creditsData]) => {
      if (creditsData.balance !== undefined) setCredits(creditsData.balance);
      if (authData.user) {
        setUser(authData.user)
        setUsername(authData.user.username)
        setBio(authData.user.bio || '')
      } else {
        router.push('/signin')
      }
      if (readingsData.readings?.length > 0) {
        setLatestReading(readingsData.readings[0])
      }
      setLoading(false)
    }).catch(() => {
      router.push('/signin')
      setLoading(false)
    })
  }, [router])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setAvatarPreview(await compressImage(file))
    } catch {
      setSaveError('Failed to process image')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const body: any = {}
      if (username !== user?.username) body.username = username
      if (bio !== (user?.bio || '')) body.bio = bio
      if (avatarPreview) body.avatar_url = avatarPreview

      if (Object.keys(body).length === 0) { setEditing(false); setSaving(false); return }

      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) { setSaveError(data.error); return }
      setUser(data.user)
      setUsername(data.user.username)
      setBio(data.user.bio || '')
      setAvatarPreview(null)
      setEditing(false)
    } catch {
      setSaveError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setUsername(user?.username || '')
    setBio(user?.bio || '')
    setAvatarPreview(null)
    setSaveError('')
    setEditing(false)
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== user?.username) return
    setDeleting(true)
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        router.push('/')
      }
    } catch {
      setDeleting(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    router.push('/signin')
  }

  if (loading) {
    return (
      <Boundary label="My Profile">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm">Loading...</p>
        </div>
      </Boundary>
    )
  }

  if (!user) return null

  const avatarSrc = avatarPreview || user.avatar_url

  return (
    <Boundary label="My Profile">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Profile Header ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-gray-400 dark:text-gray-500">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {editing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-yellow-700 hover:bg-yellow-800 rounded-full flex items-center justify-center shadow-sm transition-colors"
                    title="Upload photo"
                  >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </>
              )}
            </div>

            {/* Name / info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      maxLength={30}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bio</label>
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      rows={3}
                      maxLength={300}
                      placeholder="A little about yourself..."
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 resize-none"
                    />
                  </div>
                  {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-1.5 bg-yellow-700 hover:bg-yellow-800 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{user.username}</h1>
                    <button
                      onClick={() => setEditing(true)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                      title="Edit profile"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{user.email}</p>
                  {user.bio && <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{user.bio}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {user.role === 'admin' ? 'Administrator' : 'Member'}
                    </span>
                    {credits !== null && (
                      <Link href="/credits" className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs font-medium text-yellow-700 dark:text-yellow-500 hover:bg-yellow-100 transition-colors">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                        </svg>
                        {credits} credits
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Natal Chart + Active Transits ── */}
        {latestReading && <NatalChartSection reading={latestReading} />}

        {!latestReading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
            <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No readings yet. Get a personal transit reading to see your natal chart and active transits here.</p>
            <Link
              href="/astrology/personal-reading"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Get a Reading — $9
            </Link>
          </div>
        )}

        {/* ── Quick Links ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">

            <Link href="/enlightenment" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07l-.71.71M6.34 17.66l-.71.71m12.73 0l-.71-.71M6.34 6.34l-.71-.71M12 7a5 5 0 110 10A5 5 0 0112 7z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Enlightenment</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Browse spiritual teachings</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link href="/astrology" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Archetypal Astrology</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Explore planetary combinations</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link href="/coaching" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Session with Solomon</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Voice coaching · 100 credits / 10 min</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link href="/credits" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Credits</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {credits !== null ? `${credits} credits remaining` : 'Buy credits for coaching & dialogue'}
                  </p>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link href="/store/my/orders" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">My Orders</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">View your order history</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link href="/settings/readings" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">My Readings</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">View your astrology readings</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link href="/astrology/personal-reading" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07l-.71.71M6.34 17.66l-.71.71m12.73 0l-.71-.71M6.34 6.34l-.71-.71M12 7a5 5 0 110 10A5 5 0 0112 7z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">New Reading</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Get a fresh personal transit reading</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link href="/reset-password" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Change Password</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Update your password</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {user.role === 'admin' && (
              <Link href="/ecommerce/orders" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Admin Dashboard</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Manage orders and products</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* ── Sign Out ── */}
        <button
          onClick={handleLogout}
          className="w-full py-2.5 px-6 bg-yellow-700 hover:bg-yellow-800 text-white font-medium rounded-xl transition-colors text-sm"
        >
          Sign Out
        </button>

        {/* ── Danger Zone ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-900/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-red-100 dark:border-red-900/40">
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
          </div>
          <div className="p-5">
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Delete Account</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Permanently remove your account and all data. This cannot be undone.</p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="ml-4 flex-shrink-0 px-3 py-1.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Type <strong>{user.username}</strong> to confirm deletion.
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder={user.username}
                  className="w-full px-3 py-2 text-sm border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleteConfirmText !== user.username || deleting}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-colors"
                  >
                    {deleting ? 'Deleting...' : 'Delete My Account'}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                    className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 text-sm rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </Boundary>
  )
}
