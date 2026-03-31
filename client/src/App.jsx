import { useState, useEffect, useCallback } from 'react'
import VenueTimeline from './components/VenueTimeline'
import DatePicker from './components/DatePicker'

function App() {
  const [date, setDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAvailability = useCallback(async (selectedDate) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/availability?date=${selectedDate}`)
      if (!res.ok) throw new Error('Failed to fetch availability')
      const data = await res.json()
      setVenues(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAvailability(date)
  }, [date, fetchAvailability])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tennis Court Availability</h1>
        <div className="header-controls">
          <DatePicker value={date} onChange={setDate} />
          <button
            className="refresh-btn"
            onClick={() => fetchAvailability(date)}
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

        {venues.map((venue) => (
          <VenueTimeline key={venue.venueId} venue={venue} date={date} />
        ))}
      </main>
    </div>
  )
}

export default App
