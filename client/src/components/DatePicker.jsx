function formatLocalDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function DatePicker({ value, onChange }) {
  return (
    <div className="date-picker">
      <button
        className="date-nav-btn"
        onClick={() => {
          const d = new Date(value + 'T12:00:00')
          d.setDate(d.getDate() - 1)
          onChange(formatLocalDate(d))
        }}
      >
        &larr;
      </button>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        className="date-nav-btn"
        onClick={() => {
          const d = new Date(value + 'T12:00:00')
          d.setDate(d.getDate() + 1)
          onChange(formatLocalDate(d))
        }}
      >
        &rarr;
      </button>
    </div>
  )
}

export default DatePicker
