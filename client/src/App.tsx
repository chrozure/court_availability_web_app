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

        <h2 className="section-title">🎾 Tennis</h2>
        {venues.map((venue) => (
          <VenueTimeline key={venue.venueId} venue={venue} date={date} />
        ))}

        <h2 className="section-title">🏸 Badminton</h2>
        {badmintonVenues.map((venue) => (
          <VenueTimeline key={`badminton-${venue.venueId}`} venue={venue} date={date} />
        ))}
      </main>
    </div>
  )
}

export default App
