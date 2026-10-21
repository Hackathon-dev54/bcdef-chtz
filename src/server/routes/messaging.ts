import { Hono } from 'hono'
import { ensureD1Database, normalizeUrl } from '../db'
import { memoryStore, emitUserEvent, broadcastAllStreams } from '../store'
import { extractRootDomain } from '../domain'
import { sendPushNotification } from '../webpush'
import { getWriteShard, getReadShardForThread, getCoreDb, recordThreadShardMapping } from '../sharding'
import { isValidIdentifier, sanitizeInputText, isValidHandle, checkRateLimit } from '../security'
import type { Bindings, MemConversation } from '../types'

const messagingRoutes = new Hono<{ Bindings: Bindings }>()

// Messages: Read Sharding + 0ms Local-First Resolution
messagingRoutes.get('/api/messaging', async (c) => {
  const conversationId = c.req.query('conversationId')
  if (!conversationId || !isValidIdentifier(conversationId)) {
    return c.json({ messages: [] })
  }

  // Bidirectional resolution: look up participants from conversation record
  let reverseConvId = conversationId
  const existingConv = memoryStore.conversations.get(conversationId)
  if (existingConv && existingConv.remote_handle) {
    reverseConvId = 'conv_' + existingConv.remote_handle
  }

  // Resolve shard for reading this conversation
  const readDb = await getReadShardForThread(conversationId, c.env)

  if (readDb) {
    try {
      await ensureD1Database(readDb)
      const rows: any = await readDb.prepare(
        'SELECT * FROM messages WHERE conversation_id = ? OR conversation_id = ? ORDER BY created_at ASC'
      ).bind(conversationId, reverseConvId).all()

      if (rows?.results) {
        const seen = new Set<string>()
        const mapped: any[] = []
        for (const r of rows.results) {
          if (!seen.has(r.id)) {
            seen.add(r.id)
            mapped.push({
              id: r.id,
              conversationId: r.conversation_id,
              senderId: r.sender_id,
              body: r.content,
              createdAt: new Date(r.created_at).toISOString(),
              readAt: r.read_at ? new Date(r.read_at).toISOString() : null,
            })
          }
        }
        return c.json({ messages: mapped })
      }
    } catch (d1Err: any) {
      console.warn('[D1 Sharded Messages Warning]', d1Err?.message)
    }
  }

  const seen = new Set<string>()
  const msgs = memoryStore.messages
    .filter((m) => m.conversation_id === conversationId || m.conversation_id === reverseConvId)
    .sort((a, b) => a.created_at - b.created_at)
    .filter((m) => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
    .map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      body: m.content,
      createdAt: new Date(m.created_at).toISOString(),
      readAt: m.read_at ? new Date(m.read_at).toISOString() : null,
    }))

  return c.json({ messages: msgs })
})

// 1-Hit D1 Batch Flush Endpoint: Reduces D1 DB writes by up to 98%
messagingRoutes.post('/api/messaging/batch-flush', async (c) => {
  try {
    const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'local'
    const rateCheck = checkRateLimit(`batch_${clientIp}`, 120, 60000)
    if (!rateCheck.allowed) {
      return c.json({ error: 'Rate limit exceeded. Too many batch flushes.' }, 429)
    }

    const payload = await c.req.json()
    const { messages } = payload

    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: 'Messages array is required and cannot be empty' }, 400)
    }

    if (messages.length > 50) {
      return c.json({ error: 'Batch limit exceeded: Maximum 50 messages allowed per flush' }, 400)
    }

    const coreDb = getCoreDb(c.env)
    const { db: writeDb, shardId } = await getWriteShard(c.env)
    const now = Date.now()

    const sanitizedBatch: any[] = []
    const d1Statements: any[] = []
    const coreStatements: any[] = []

    for (const raw of messages) {
      const convId = sanitizeInputText(raw.conversationId || 'conv_general', 64)
      const cleanBody = sanitizeInputText(raw.body, 2000)
      if (!cleanBody) continue

      const senderId = sanitizeInputText(raw.senderId || 'usr_admin', 64)
      const senderHandle = sanitizeInputText((raw.senderHandle || raw.myHandle || '').replace(/^@/, '').toLowerCase(), 32)
      const recipientHandle = sanitizeInputText((raw.recipientHandle || raw.remoteHandle || '').replace(/^@/, '').toLowerCase(), 32)
      const msgId = raw.id && isValidIdentifier(raw.id) ? raw.id : 'msg_' + Math.random().toString(36).slice(2, 9)
      const msgTime = raw.createdAt ? new Date(raw.createdAt).getTime() : now

      const messageRecord = {
        id: msgId,
        conversationId: convId,
        senderId,
        senderHandle,
        recipientHandle,
        body: cleanBody,
        createdAt: new Date(msgTime).toISOString(),
        readAt: null,
        tempId: raw.tempId || null,
      }

      sanitizedBatch.push(messageRecord)

      // In-memory update for 0ms local reads
      memoryStore.messages.push({
        id: messageRecord.id,
        conversation_id: messageRecord.conversationId,
        sender_id: messageRecord.senderId,
        content: messageRecord.body,
        created_at: msgTime,
        read_at: null,
      })

      const conv = memoryStore.conversations.get(convId)
      if (conv) {
        conv.last_message_snippet = cleanBody
        conv.last_message_at = msgTime
      }

      // Prepare D1 insert statement on the active shard
      if (writeDb && typeof writeDb.prepare === 'function') {
        d1Statements.push(
          writeDb.prepare(
            'INSERT OR REPLACE INTO messages (id, conversation_id, sender_id, content, created_at, read_at) VALUES (?, ?, ?, ?, ?, NULL)'
          ).bind(messageRecord.id, messageRecord.conversationId, messageRecord.senderId, messageRecord.body, msgTime)
        )
      }

      // Update master index on DB_CORE
      if (coreDb && typeof coreDb.prepare === 'function') {
        coreStatements.push(
          coreDb.prepare(`
            INSERT INTO conversation_index (
              thread_id, 
              customer_name, 
              customer_handle, 
              shard_id, 
              last_message_snippet, 
              last_message_at, 
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(thread_id) DO UPDATE SET
              last_message_snippet = excluded.last_message_snippet,
              last_message_at = excluded.last_message_at,
              shard_id = excluded.shard_id
          `).bind(convId, recipientHandle || 'Customer', recipientHandle || 'anonymous', shardId, cleanBody.slice(0, 80), msgTime, msgTime)
        )
      }
    }

    // Execute background batch flush via D1 batch API
    const executeBatch = async () => {
      try {
        if (writeDb && d1Statements.length > 0) {
          await writeDb.batch(d1Statements)
        }
        if (coreDb && coreStatements.length > 0) {
          await coreDb.batch(coreStatements)
        }
      } catch (err: any) {
        console.error('[1-Hit D1 Batch Save Execution Error]', err?.message)
      }
    }

    if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
      c.executionCtx.waitUntil(executeBatch())
    } else {
      await executeBatch()
    }

    // Broadcast messages over SSE for real-time sync across connected tabs
    for (const msg of sanitizedBatch) {
      emitUserEvent(msg.senderId, 'new_message', msg)
      await broadcastAllStreams('new_message', msg, c.env)
    }

    return c.json({
      success: true,
      flushedCount: sanitizedBatch.length,
      shardId,
      timestamp: now,
    })
  } catch (err: any) {
    return c.json({ error: err.message || 'Batch flush failed' }, 400)
  }
})

// Single Message Send: 0ms Optimistic Delivery + Auto-Sharded D1 Write
messagingRoutes.post('/api/messaging', async (c) => {
  try {
    const raw = await c.req.json()
    const { conversationId, body, senderId, tempId, remoteInstanceUrl, remoteHandle, myHandle } = raw

    const cleanBody = sanitizeInputText(body, 2000)
    if (!cleanBody) {
      return c.json({ error: 'Message body cannot be empty' }, 400)
    }

    const convId = sanitizeInputText(conversationId || 'conv_general', 64)
    const messageId = 'msg_' + Math.random().toString(36).slice(2, 9)
    const now = Date.now()
    const actualSender = sanitizeInputText(senderId || 'usr_admin', 64)
    const cleanSenderHandle = sanitizeInputText((myHandle || '').replace(/^@/, '').toLowerCase(), 32)
    const cleanRemoteHandle = sanitizeInputText((remoteHandle || '').replace(/^@/, '').toLowerCase(), 32)

    const messageRecord = {
      id: messageId,
      conversationId: convId,
      senderId: actualSender,
      senderHandle: cleanSenderHandle,
      recipientHandle: cleanRemoteHandle,
      body: cleanBody,
      createdAt: new Date(now).toISOString(),
      readAt: null,
      tempId: tempId || null,
    }

    memoryStore.messages.push({
      id: messageRecord.id,
      conversation_id: messageRecord.conversationId,
      sender_id: messageRecord.senderId,
      content: messageRecord.body,
      created_at: now,
      read_at: null,
    })
    const conv = memoryStore.conversations.get(messageRecord.conversationId)
    if (conv) {
      conv.last_message_snippet = messageRecord.body
      conv.last_message_at = now
    }

    const reverseConvId = cleanSenderHandle ? 'conv_' + cleanSenderHandle : null
    const reverseConv = reverseConvId ? memoryStore.conversations.get(reverseConvId) : null
    if (reverseConv) {
      reverseConv.last_message_snippet = messageRecord.body
      reverseConv.last_message_at = now
    }

    // Auto-sharded D1 Persistence with 450 MB Hardcap rollover
    const coreDb = getCoreDb(c.env)
    const { db: writeDb, shardId } = await getWriteShard(c.env)

    if (writeDb) {
      try {
        await ensureD1Database(writeDb)
        await writeDb.prepare(
          'INSERT INTO messages (id, conversation_id, sender_id, content, created_at, read_at) VALUES (?, ?, ?, ?, ?, NULL)'
        ).bind(messageRecord.id, messageRecord.conversationId, messageRecord.senderId, messageRecord.body, now).run()

        // Update core database conversations list & cross-shard index
        if (coreDb) {
          await coreDb.prepare(
            'UPDATE conversations SET last_message_snippet = ?, last_message_at = ? WHERE id = ? OR (id = ? AND ? IS NOT NULL)'
          ).bind(messageRecord.body, now, messageRecord.conversationId, reverseConvId, reverseConvId).run()

          await recordThreadShardMapping(
            coreDb,
            messageRecord.conversationId,
            shardId,
            cleanRemoteHandle || 'Customer',
            cleanRemoteHandle || 'anonymous',
            messageRecord.body
          )
        }
      } catch (d1Err: any) {
        console.warn('[D1 Message Insert Warning]', d1Err?.message)
      }
    }

    emitUserEvent(actualSender, 'new_message', messageRecord)
    await broadcastAllStreams('new_message', messageRecord, c.env)

    // Ensure inquiry is marked accepted if this was a merchant message to a customer
    if (cleanRemoteHandle) {
      for (const [, inq] of memoryStore.inquiries) {
        if (inq.sender_handle === cleanRemoteHandle && inq.status !== 'accepted') {
          inq.status = 'accepted'
          inq.conversation_id = messageRecord.conversationId
        }
      }
      if (coreDb) {
        try {
          await coreDb.prepare("UPDATE static_inquiries SET status = 'accepted', conversation_id = ? WHERE sender_handle = ?").bind(messageRecord.conversationId, cleanRemoteHandle).run()
        } catch {}
      }
      await broadcastAllStreams('inquiry_status_updated', {
        status: 'accepted',
        conversationId: messageRecord.conversationId,
        customerHandle: cleanRemoteHandle,
      }, c.env)
    }

    // Web Push background dispatch (asynchronous, 0ms latency to SSE)
    const recipientToNotify = cleanRemoteHandle || (conv?.user_a === actualSender ? conv?.user_b : conv?.user_a) || null
    const pushNotification = {
      title: `@${cleanSenderHandle || 'User'}`,
      body: messageRecord.body,
      conversationId: messageRecord.conversationId,
      url: `/?conv=${messageRecord.conversationId}`,
    }
    try {
      await sendPushNotification(c.env, recipientToNotify, pushNotification)
    } catch (e: any) {
      console.warn('[Push Notification Error]', e?.message)
    }

    const currentOrigin = c.req.header('origin') || c.req.header('host') || ''
    const currentDomain = extractRootDomain(currentOrigin)
    const targetUrl = remoteInstanceUrl || memoryStore.conversations.get(conversationId)?.remote_instance_url
    
    // Only forward if targetUrl is a valid external URL and not the current instance domain
    const isTargetExternal = Boolean(
      targetUrl &&
      targetUrl !== 'direct-client' &&
      !targetUrl.includes('direct-client') &&
      (!currentDomain || !targetUrl.includes(currentDomain))
    )

    if (isTargetExternal && targetUrl) {
      let senderHandle = myHandle || ''
      if (coreDb && !senderHandle) {
        try {
          const adminRow: any = await coreDb.prepare("SELECT handle FROM users WHERE role = 'admin' LIMIT 1").first()
          if (adminRow) senderHandle = adminRow.handle
        } catch (e) {}
      }
      senderHandle = senderHandle || memoryStore.users.get(actualSender)?.handle || 'me'
      const targetHandle = remoteHandle || memoryStore.conversations.get(conversationId)?.remote_handle

      try {
        await fetch(`${normalizeUrl(targetUrl)}/api/federation/v1/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender_handle: senderHandle,
            recipient_handle: targetHandle,
            body: messageRecord.body,
            conversation_id: 'conv_' + senderHandle,
            timestamp: now,
          }),
        })
      } catch (err: any) {
        console.warn('[Remote Forward Warning]', err?.message)
      }
    }

    return c.json({ success: true, message: messageRecord }, 201)
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})

// Peer sent a message to us
messagingRoutes.post('/api/federation/v1/messages', async (c) => {
  try {
    const { sender_handle, body, timestamp } = await c.req.json()
    const cleanSender = (sender_handle || 'peer').replace(/^@/, '').trim().toLowerCase()
    const conversationId = 'conv_' + cleanSender
    const messageId = 'msg_in_' + Math.random().toString(36).slice(2, 9)
    const now = timestamp || Date.now()

    const adminUser = memoryStore.users.get('usr_admin')
    const adminHandle = adminUser?.handle || 'admin'

    const messageRecord = {
      id: messageId,
      conversationId,
      senderId: cleanSender,
      senderHandle: cleanSender,
      recipientHandle: adminHandle,
      body: body || '',
      createdAt: new Date(now).toISOString(),
      readAt: null,
    }

    memoryStore.messages.push({
      id: messageRecord.id,
      conversation_id: messageRecord.conversationId,
      sender_id: messageRecord.senderId,
      content: messageRecord.body,
      created_at: now,
      read_at: null,
    })

    let conv: MemConversation | undefined = memoryStore.conversations.get(conversationId)
    if (!conv) {
      conv = {
        id: conversationId,
        user_a: 'usr_admin',
        user_b: cleanSender,
        remote_handle: cleanSender,
        remote_instance_url: undefined,
        last_message_snippet: messageRecord.body,
        last_message_at: now,
        status: 'active',
      }
      memoryStore.conversations.set(conversationId, conv)
    } else {
      conv.last_message_snippet = messageRecord.body
      conv.last_message_at = now
      if (conv.status === 'pending') {
        conv.status = 'active'
      }
    }

    const coreDb = getCoreDb(c.env)
    const { db: writeDb, shardId } = await getWriteShard(c.env)

    if (writeDb) {
      try {
        await ensureD1Database(writeDb)
        await writeDb.prepare('INSERT INTO messages (id, conversation_id, sender_id, content, created_at, read_at) VALUES (?, ?, ?, ?, ?, NULL)')
          .bind(messageRecord.id, messageRecord.conversationId, messageRecord.senderId, messageRecord.body, now).run()

        if (coreDb) {
          await coreDb.prepare('INSERT OR REPLACE INTO conversations (id, user_a, user_b, remote_handle, remote_instance_url, last_message_snippet, last_message_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, "active")')
            .bind(conversationId, 'usr_admin', cleanSender, cleanSender, conv?.remote_instance_url || null, messageRecord.body, now).run()

          await recordThreadShardMapping(
            coreDb,
            conversationId,
            shardId,
            cleanSender,
            cleanSender,
            messageRecord.body
          )
        }
      } catch (d1Err: any) {
        console.warn('[D1 Peer Inbound Message Warning]', d1Err?.message)
      }
    }

    if (conv) {
      await broadcastAllStreams('conversation_updated', conv, c.env)
    }
    await broadcastAllStreams('new_message', messageRecord, c.env)

    // Web Push background alert for inbound peer message (asynchronous, never blocks HTTP response)
    const pushNotification = {
      title: `@${cleanSender}`,
      body: messageRecord.body,
      conversationId: messageRecord.conversationId,
      url: `/?conv=${messageRecord.conversationId}`,
    }
    try {
      await sendPushNotification(c.env, null, pushNotification)
    } catch (e: any) {
      console.warn('[Federation Inbound Push Error]', e?.message)
    }

    return c.json({ success: true, id: messageId }, 201)
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})

export default messagingRoutes
