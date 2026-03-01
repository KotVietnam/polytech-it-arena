import { Button } from '../components/Button'
import { Card } from '../components/Card'

export const NotFoundPage = () => (
  <Card className="mx-auto max-w-2xl space-y-4 text-center">
    <h1 className="font-heading text-3xl font-bold text-text">Страница не найдена</h1>
    <p className="text-sm text-muted">
      Запрошенный раздел не существует или был перемещен.
    </p>
    <div className="flex justify-center gap-3">
      <Button to="/home">На главную</Button>
      <Button to="/calendar" variant="outline">
        Календарь
      </Button>
    </div>
  </Card>
)
