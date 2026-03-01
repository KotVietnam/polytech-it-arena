import type { ChangeEvent } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface FiltersProps {
  trackOptions: FilterOption[]
  levelOptions: FilterOption[]
  selectedTrack: string
  selectedLevel: string
  onTrackChange: (value: string) => void
  onLevelChange: (value: string) => void
}

const selectClassName =
  'focus-ring mono h-10 w-full rounded-none border border-zinc-700 bg-black px-3 text-xs text-white'

export const Filters = ({
  trackOptions,
  levelOptions,
  selectedTrack,
  selectedLevel,
  onTrackChange,
  onLevelChange,
}: FiltersProps) => {
  const handleTrackChange = (event: ChangeEvent<HTMLSelectElement>) =>
    onTrackChange(event.target.value)

  const handleLevelChange = (event: ChangeEvent<HTMLSelectElement>) =>
    onLevelChange(event.target.value)

  return (
    <div className="grid gap-3 border border-red-700/70 bg-black p-4 sm:grid-cols-2">
      <label className="mono space-y-1 text-xs font-medium text-zinc-300">
        Направление
        <select
          aria-label="Фильтр по направлению"
          className={selectClassName}
          value={selectedTrack}
          onChange={handleTrackChange}
        >
          {trackOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="mono space-y-1 text-xs font-medium text-zinc-300">
        Уровень
        <select
          aria-label="Фильтр по уровню"
          className={selectClassName}
          value={selectedLevel}
          onChange={handleLevelChange}
        >
          {levelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
