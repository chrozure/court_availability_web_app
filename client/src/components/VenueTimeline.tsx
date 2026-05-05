import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import CourtTimeline from './CourtTimeline'
import { VenueAvailability } from '../types'

interface VenueTimelineProps {
  venue: VenueAvailability;
  date: string;
  slotMinutes?: number;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  if (m === 0) {
    if (h === 0) return '12am'
    if (h === 12) return '12pm'
    return h < 12 ? `${h}am` : `${h - 12}pm`
  }
  return ''
}

function mergeSlots(slots: { time: string; status: string }[], factor: number) {
  const merged: { time: string; status: string }[] = []
  for (let i = 0; i < slots.length; i += factor) {
    const group = slots.slice(i, i + factor)
    const hasBooked = group.some((s) => s.status === 'booked')
    const allClosed = group.every((s) => s.status === 'closed')
    merged.push({
      time: group[0].time,
      status: allClosed ? 'closed' : hasBooked ? 'booked' : group[0].status,
    })
  }
  return merged
}

function VenueTimeline({ venue, date, slotMinutes = 15, collapsed: controlledCollapsed, onToggleCollapsed }: VenueTimelineProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const collapsed = controlledCollapsed ?? internalCollapsed
  const toggleCollapsed = onToggleCollapsed ?? (() => setInternalCollapsed(c => !c))
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const isToday = date === todayStr
  const isPastDate = date < todayStr
  const currentMinutesOfDay = now.getHours() * 60 + now.getMinutes()

  const mergeFactor = Math.max(1, Math.round(slotMinutes / 15))

  // Build time header from the first court's slots
  const rawTimeSlots = venue.courts.length > 0 ? venue.courts[0].slots : []
  const timeSlots = mergeFactor > 1 ? mergeSlots(rawTimeSlots, mergeFactor) : rawTimeSlots

  // Scroll to roughly current time on mount
  useEffect(() => {
    if (scrollRef.current && timeSlots.length > 0) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const [fh, fm] = timeSlots[0].time.split(':').map(Number)
      const firstMinutes = fh * 60 + fm
      const offsetSlots = Math.max(0, Math.floor((currentMinutes - firstMinutes) / (15 * mergeFactor)) - 4)
      const slotWidth = 28 * mergeFactor
      scrollRef.current.scrollLeft = offsetSlots * slotWidth
    }
  }, [timeSlots])

  return (
    <section className="venue-section">
      <div className="venue-header" onClick={toggleCollapsed} style={{ cursor: 'pointer' }}>
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

      <div
        ref={contentRef}
        className="venue-collapsible"
        style={{
          maxHeight: collapsed ? 0 : contentHeight,
          opacity: collapsed ? 0 : 1,
        }}
      >
        {venue.error && (
          <div className="venue-error">
            Failed to load: {venue.error}
          </div>
        )}

        {venue.courts.length === 0 && !venue.error && (
          <div className="venue-empty">No courts available for this date.</div>
        )}

        {venue.courts.length > 0 && (
        <div className="venue-grid">
          <div className="labels-column">
            <div className="time-header-spacer" />
            {venue.courts.map((court) => (
              <div key={court.id} className="court-label">
                <span className="court-name" title={court.name}>{court.name}</span>
                {court.hasLighting && <span className="court-lighting" title="Has floodlights">💡</span>}
              </div>
            ))}
          </div>
          <div className="timeline-scroll" ref={scrollRef}>
            <div className="time-header">
              {timeSlots.map((slot) => {
                const label = formatTime(slot.time)
                const isHourStart = slot.time.endsWith(':00')
                return (
                  <div
                    key={slot.time}
                    className={`time-header-cell ${isHourStart ? 'hour-start' : ''}`}
                    style={mergeFactor > 1 ? { width: 28 * mergeFactor, minWidth: 28 * mergeFactor } : undefined}
                  >
                    {label && <span className="time-header-label">{label}</span>}
                  </div>
                )
              })}
            </div>
            {venue.courts.map((court) => (
              <CourtTimeline
                key={court.id}
                court={court}
                isToday={isToday}
                isPastDate={isPastDate}
                currentMinutesOfDay={currentMinutesOfDay}
                mergeFactor={mergeFactor}
              />
            ))}
          </div>
        </div>
      )}

      {venue.courts.length > 0 && (
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
      </div>
    </section>
  )
}

export default VenueTimeline
