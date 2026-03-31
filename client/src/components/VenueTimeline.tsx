import { useState } from 'react'
import CourtTimeline from './CourtTimeline'
import { VenueAvailability } from '../types'

interface VenueTimelineProps {
  venue: VenueAvailability;
  date: string;
}

function VenueTimeline({ venue, date }: VenueTimelineProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <section className="venue-section">
      <div className="venue-header" onClick={() => setCollapsed(!collapsed)} style={{ cursor: 'pointer' }}>
        <div className="venue-header-left">
          <span className={`collapse-icon ${collapsed ? 'collapsed' : ''}`}>&#9660;</span>
          <h2>{venue.venueName}</h2>
        </div>
        <a
          href={venue.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="booking-link"
          onClick={(e) => e.stopPropagation()}
        >
          Book on site &rarr;
        </a>
      </div>

      {!collapsed && venue.error && (
        <div className="venue-error">
          Failed to load: {venue.error}
        </div>
      )}

      {!collapsed && venue.courts.length === 0 && !venue.error && (
        <div className="venue-empty">No courts available for this date.</div>
      )}

      {!collapsed && (
        <div className="courts-container">
          {venue.courts.map((court) => (
            <CourtTimeline key={court.id} court={court} date={date} />
          ))}
        </div>
      )}

      {!collapsed && venue.courts.length > 0 && (
        <div className="legend">
          <div className="legend-item">
            <div className="legend-swatch available" />
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-swatch booked" />
            <span>Booked</span>
          </div>
          <div className="legend-item">
            <div className="legend-swatch past-available" />
            <span>Past (was available)</span>
          </div>
          <div className="legend-item">
            <div className="legend-swatch past-booked" />
            <span>Past (was booked)</span>
          </div>
          <div className="legend-item">
            <div className="legend-swatch closed" />
            <span>Closed</span>
          </div>
        </div>
      )}
    </section>
  )
}

export default VenueTimeline
