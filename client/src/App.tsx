import { useState, useEffect, useCallback } from 'react'
import VenueTimeline from './components/VenueTimeline'
import DatePicker from './components/DatePicker'
import { VenueAvailability } from './types'

function App() {
  const [date, setDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const [venues, setVenues] = useState<VenueAvailability[]>([])
  const [badmintonVenues, setBadmintonVenues] = useState<VenueAvailability[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tennisCollapsed, setTennisCollapsed] = useState<Record<number, boolean>>({})
  const [badmintonCollapsed, setBadmintonCollapsed] = useState<Record<number, boolean>>({})

  const fetchAll = useCallback(async (selectedDate: string) => {
    setLoading(true)
    setError(null)
    try {
      const [tennisRes, badmintonRes] = await Promise.all([
        fetch(`/api/availability?date=${selectedDate}`),
        fetch(`/api/badminton/availability?date=${selectedDate}`),
      ])
      if (!tennisRes.ok) throw new Error('Failed to fetch tennis availability')
      if (!badmintonRes.ok) throw new Error('Failed to fetch badminton availability')
      setVenues(await tennisRes.json())
      setBadmintonVenues(await badmintonRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll(date)
  }, [date, fetchAll])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Court Availability</h1>
        <div className="header-controls">
          <DatePicker value={date} onChange={setDate} />
          <button
            className="today-btn"
            onClick={() => {
              const now = new Date()
              setDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`)
            }}
          >
            Today
          </button>
          <button
            className="refresh-btn"
            onClick={() => fetchAll(date)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="app-main">
        {error && <div className="error-banner">{error}</div>}

        {loading && venues.length === 0 && (
          <div className="loading">Loading availability...</div>
        )}

        <div className="section-header">
          <h2 className="section-title">🎾 Tennis</h2>
          <button
            className="collapse-all-btn"
            onClick={() => {
              const allCollapsed = venues.every((_, i) => tennisCollapsed[i])
              const next: Record<number, boolean> = {}
              venues.forEach((_, i) => next[i] = !allCollapsed)
              setTennisCollapsed(next)
            }}
          >
            {venues.every((_, i) => tennisCollapsed[i]) ? 'Expand All' : 'Collapse All'}
          </button>
        </div>
        {venues.map((venue, i) => (
          <VenueTimeline
            key={venue.venueId}
            venue={venue}
            date={date}
            collapsed={tennisCollapsed[i] ?? false}
            onToggleCollapsed={() => setTennisCollapsed(prev => ({ ...prev, [i]: !prev[i] }))}
          />
        ))}

        <div className="section-header">
          <h2 className="section-title">🏸 Badminton</h2>
          <button
            className="collapse-all-btn"
            onClick={() => {
              const allCollapsed = badmintonVenues.every((_, i) => badmintonCollapsed[i])
              const next: Record<number, boolean> = {}
              badmintonVenues.forEach((_, i) => next[i] = !allCollapsed)
              setBadmintonCollapsed(next)
            }}
          >
            {badmintonVenues.every((_, i) => badmintonCollapsed[i]) ? 'Expand All' : 'Collapse All'}
          </button>
        </div>
        {badmintonVenues.map((venue, i) => (
          <VenueTimeline
            key={`badminton-${venue.venueId}`}
            venue={venue}
            date={date}
            slotMinutes={30}
            collapsed={badmintonCollapsed[i] ?? false}
            onToggleCollapsed={() => setBadmintonCollapsed(prev => ({ ...prev, [i]: !prev[i] }))}
          />
        ))}
      </main>
    </div>
  )
}

export default App
