import express from 'express'
import cors from 'cors'
import {
  approveWorkOrder,
  dispatchWorkOrder,
  getWorkOrder,
  listWorkOrders,
} from './store'

const app = express()
const PORT = Number(process.env.PORT ?? 5174)

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptimeSec: process.uptime() })
})

app.get('/api/work-orders', (_req, res) => {
  res.json({ items: listWorkOrders() })
})

app.get('/api/work-orders/:id', (req, res) => {
  const wo = getWorkOrder(req.params.id)
  if (!wo) return res.status(404).json({ error: 'work_order_not_found', id: req.params.id })
  res.json(wo)
})

app.post('/api/work-orders/:id/approve', (req, res) => {
  const state = approveWorkOrder(req.params.id)
  if (!state) return res.status(404).json({ error: 'work_order_not_found', id: req.params.id })
  res.json({ id: req.params.id, state })
})

app.post('/api/work-orders/:id/dispatch', (req, res) => {
  const state = dispatchWorkOrder(req.params.id)
  if (!state) return res.status(404).json({ error: 'work_order_not_found', id: req.params.id })
  res.json({ id: req.params.id, state })
})

app.use((_req, res) => {
  res.status(404).json({ error: 'not_found' })
})

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`)
})

