import '@opentelemetry/auto-instrumentations-node/register'

import { fastify } from 'fastify'
import { randomUUID } from 'node:crypto'
import { setTimeout } from 'node:timers/promises'
import { fastifyCors } from '@fastify/cors'
import { trace } from '@opentelemetry/api'
import { z } from 'zod'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider
} from 'fastify-type-provider-zod'

import { channels } from '../broker/channels/index.ts'
import { schema } from '../db/schema/index.ts'
import { db } from '../db/client.ts'
import { dispatchOrderCreated } from '../broker/messages/order-created.ts'
import { tracer } from '../tracer/tracer.ts'
import { orders } from '../db/schema/orders.ts'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, { origin: '*' })

app.get('/health', () => {
  return 'OK'
})

app.post(
  '/orders',
  {
    schema: {
      body: z.object({
        amount: z.number()
      })
    }
  },
  async (request, reply) => {
    try {
      const { amount } = request.body

      console.log('Creating an order with amount', amount)

      const orderId = randomUUID()

      const span = tracer.startSpan('order_creation')
      span.setAttribute('amount', amount)
      span.setAttribute('order_id', orderId)

      // Aqui deve estar sua inserção no banco
      await db.insert(orders).values({
        id: orderId,
        amount,
        customerId: 'B9176D35-7276-4255-A323-D825CAEE03B5',
        createdAt: new Date()
      })

      span.end()

      return reply.status(201).send({
        id: orderId,
        amount,
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      return reply.status(500).send({ error: 'Erro ao criar pedido' })
    }
  }
)

app.listen({ host: '0.0.0.0', port: 3334 }).then(() => {
  console.log('[Orders] HTTP Server running!')
})
