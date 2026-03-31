import { Court } from '../types'

interface CourtTimelineProps {
  court: Court;
  isToday: boolean;
  isPastDate: boolean;
  currentMinutesOfDay: number;
}

function CourtTimeline({ court, isToday, isPastDate, currentMinutesOfDay }: CourtTimelineProps) {
  return (
    <div className="timeline-slots">
      {court.slots.map((slot) => {
        const isHourStart = slot.time.endsWith(':00')
        const [sh, sm] = slot.time.split(':').map(Number)
        const slotMinutes = sh * 60 + sm
        const isPast = isPastDate || (isToday && slotMinutes < currentMinutesOfDay)
        return (
          <div
            key={slot.time}
            className={`slot ${slot.status} ${isPast ? 'past' : ''} ${isHourStart ? 'hour-start' : ''}`}
            title={`${slot.time} - ${isPast ? `past (${slot.status})` : slot.status}`}
          />
        )
      })}
    </div>
  )
}

export default CourtTimeline
