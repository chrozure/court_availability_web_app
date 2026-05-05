import { Court } from '../types'

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

interface CourtTimelineProps {
  court: Court;
  isToday: boolean;
  isPastDate: boolean;
  currentMinutesOfDay: number;
  mergeFactor?: number;
}

function CourtTimeline({ court, isToday, isPastDate, currentMinutesOfDay, mergeFactor = 1 }: CourtTimelineProps) {
  const slots = mergeFactor > 1 ? mergeSlots(court.slots, mergeFactor) : court.slots
  return (
    <div className="timeline-slots">
      {slots.map((slot) => {
        const isHourStart = slot.time.endsWith(':00')
        const [sh, sm] = slot.time.split(':').map(Number)
        const slotMinutes = sh * 60 + sm
        const isPast = isPastDate || (isToday && slotMinutes < currentMinutesOfDay)
        return (
          <div
            key={slot.time}
            className={`slot ${slot.status} ${isPast ? 'past' : ''} ${isHourStart ? 'hour-start' : ''}`}
            title={`${slot.time} - ${isPast ? `past (${slot.status})` : slot.status}`}
            style={mergeFactor > 1 ? { width: 28 * mergeFactor, minWidth: 28 * mergeFactor } : undefined}
          />
        )
      })}
    </div>
  )
}

export default CourtTimeline
