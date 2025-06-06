import { integer } from 'drizzle-orm/pg-core'
import { timestamp } from 'drizzle-orm/pg-core'
import { text } from 'drizzle-orm/pg-core'
import { pgTable } from 'drizzle-orm/pg-core'

export const invoices = pgTable('orders', {
  id: text().primaryKey(),
  orderId: text().notNull(),
  amount: integer().notNull(),
  createdAt: timestamp().defaultNow().notNull()
})
