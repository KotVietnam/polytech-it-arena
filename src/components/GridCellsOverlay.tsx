import { useEffect, useRef } from 'react'

interface GlowCell {
  col: number
  row: number
  alpha: number
  decayPerMs: number
  shade: number
}

export const GridCellsOverlay = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const cellSize = 40
    const gridLine = '#222'
    const cells: GlowCell[] = []
    let rafId = 0
    let spawnElapsed = 0
    let lastTime = performance.now()

    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = window.devicePixelRatio || 1

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = () => {
      const cols = Math.ceil(window.innerWidth / cellSize) + 2
      const rows = Math.ceil(window.innerHeight / cellSize) + 2
      const batch = Math.max(3, Math.min(10, Math.floor((cols * rows) / 180)))

      for (let i = 0; i < batch; i += 1) {
        const col = Math.floor(Math.random() * cols) - 1
        const row = Math.floor(Math.random() * rows) - 1
        cells.push({
          col,
          row,
          alpha: 0.11 + Math.random() * 0.12,
          decayPerMs: 0.00014 + Math.random() * 0.0002,
          shade: 92 + Math.floor(Math.random() * 30),
        })
      }
    }

    const drawGrid = (width: number, height: number, offsetX: number, offsetY: number) => {
      ctx.strokeStyle = gridLine
      ctx.lineWidth = 1
      ctx.beginPath()

      for (let x = -offsetX; x <= width + cellSize; x += cellSize) {
        ctx.moveTo(x + 0.5, 0)
        ctx.lineTo(x + 0.5, height)
      }

      for (let y = -offsetY; y <= height + cellSize; y += cellSize) {
        ctx.moveTo(0, y + 0.5)
        ctx.lineTo(width, y + 0.5)
      }

      ctx.stroke()
    }

    const draw = (time: number) => {
      const width = window.innerWidth
      const height = window.innerHeight
      const delta = time - lastTime
      lastTime = time
      spawnElapsed += delta
      const seconds = time / 1000

      const speedX = 6
      const speedY = 3
      const offsetX = ((seconds * speedX) % cellSize + cellSize) % cellSize
      const offsetY = ((seconds * speedY) % cellSize + cellSize) % cellSize

      if (spawnElapsed >= 190) {
        spawn()
        spawnElapsed = 0
      }

      ctx.clearRect(0, 0, width, height)
      drawGrid(width, height, offsetX, offsetY)

      for (let i = cells.length - 1; i >= 0; i -= 1) {
        const cell = cells[i]
        cell.alpha -= cell.decayPerMs * delta
        if (cell.alpha <= 0) {
          cells.splice(i, 1)
          continue
        }

        const x = cell.col * cellSize - offsetX + 1
        const y = cell.row * cellSize - offsetY + 1
        ctx.fillStyle = `rgba(${cell.shade},${cell.shade},${cell.shade},${cell.alpha.toFixed(3)})`
        ctx.fillRect(x, y, cellSize - 2, cellSize - 2)
      }

      rafId = requestAnimationFrame(draw)
    }

    resize()
    spawn()
    rafId = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[2]"
      ref={canvasRef}
    />
  )
}
