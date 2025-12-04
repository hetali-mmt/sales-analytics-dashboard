import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/services/api'
import { ScoreTrendsChart } from '@/components/charts/ScoreTrendsChart'
import { Button } from '@/components/ui/Button'
import { DATE_RANGES } from '@/lib/constants'

export function Dashboard() {
  const [selectedDays, setSelectedDays] = useState(30)

  const { data: scoreTrends = [], isLoading } = useQuery({
    queryKey: ['scoreTrends', selectedDays],
    queryFn: () => apiService.getScoreTrends(selectedDays),
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Score Trends</h1>
        <div className="flex gap-2">
          {DATE_RANGES.map(({ label, value }) => (
            <Button
              key={value}
              variant={selectedDays === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDays(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : scoreTrends.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No data available for the selected period</p>
          </div>
        ) : (
          <ScoreTrendsChart data={scoreTrends} days={selectedDays} />
        )}
      </div>
    </div>
  )
}