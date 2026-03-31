import { useRef, useEffect } from 'react'

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  if (m === 0) {
    if (h === 0) return '12am'
    if (h === 12) return '12pm'
    return h < 12 ? `${h}am` : `${h - 12}pm`
  }
  return ''
}

function CourtTimeline({ court, date }) {
  const scrollRef = useRef(null)
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const isToday = date === todayStr
  const isPastDate = date < todayStr
  const currentMinutesOfDay = now.getHours() * 60 + now.getMinutes()

  // Scroll to roughly current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const firstSlot = court.slots[0]
      if (firstSlot) {
        const [fh, fm] = firstSlot.time.split(':').map(Number)
        const firstMinutes = fh * 60 + fm
        const offsetSlots = Math.max(0, Math.floor((currentMinutes - firstMinutes) / 15) - 4)
        const slotWidth = 28 // matches CSS
        scrollRef.current.scrollLeft = offsetSlots * slotWidth
      }
    }
  }, [court.slots])

  return (
    <div className="court-row">
      <div className="court-label">
        <span className="court-name">{court.name}</span>
        {court.hasLighting && <span className="court-lighting" title="Has floodlights">💡</span>}
      </div>
      <div className="timeline-scroll" ref={scrollRef}>
        <div className="timeline-slots">
          {court.slots.map((slot) => {
            const label = formatTime(slot.time)
            const isHourStart = slot.time.endsWith(':00')
            const [sh, sm] = slot.time.split(':').map(Number)
            const slotMinutes = sh * 60 + sm
            const isPast = isPastDate || (isToday && slotMinutes < currentMinutesOfDay)
            return (
              <div
                key={slot.time}
                className={`slot ${slot.status} ${isPast ? 'past' : ''} ${isHourStart ? 'hour-start' : ''}`}
                title={`${slot.time} - ${isPast ? `past (${slot.status})` : slot.status}`}
              >
                {label && <span className="slot-label">{label}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CourtTimeline
