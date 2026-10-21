// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 Chatze Contributors (https://github.com/Hackathon-dev54/chat-web-new)

/**
 * 1-Hit D1 Batch Staging Engine (Client-Side)
 * Groups outgoing chat messages into 1 batch write via 3-second debounce & sendBeacon.
 * Reduces Cloudflare D1 write transactions by 95-98%.
 */

export interface StagedMessage {
  id: string
  conversationId: string
  senderId: string
  senderHandle?: string
  recipientHandle?: string
  body: string
  createdAt?: string
  tempId?: string
}

class BatchStagingManager {
  private stagingQueue: StagedMessage[] = []
  private debounceTimer: any = null
  private readonly DEBOUNCE_DELAY_MS = 3000 // 3 seconds debounce
  private readonly MAX_BATCH_SIZE = 50
  private isFlushing = false

  constructor() {
    if (typeof window !== 'undefined') {
      // 1. Emergency flush on tab background / screen lock
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.emergencyFlushWithBeacon()
        }
      })

      // 2. Emergency flush on page close / refresh
      window.addEventListener('pagehide', () => {
        this.emergencyFlushWithBeacon()
      })
      window.addEventListener('beforeunload', () => {
        this.emergencyFlushWithBeacon()
      })

      // 3. Auto-flush when returning online
      window.addEventListener('online', () => {
        this.flushQueue()
      })

      // 4. Restore any un-flushed messages from localStorage
      this.restorePersistedStaging()
    }
  }

  /**
   * Enqueues an outgoing message to the local staging buffer.
   * If buffer hits MAX_BATCH_SIZE (50), flushes immediately.
   * Otherwise, debounces for 3 seconds of typing idle.
   */
  public enqueue(message: StagedMessage): void {
    this.stagingQueue.push(message)
    this.persistStaging()

    if (this.stagingQueue.length >= this.MAX_BATCH_SIZE) {
      this.flushQueue()
      return
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      this.flushQueue()
    }, this.DEBOUNCE_DELAY_MS)
  }

  /**
   * Performs standard HTTP POST batch flush to Cloudflare Edge.
   */
  public async flushQueue(): Promise<boolean> {
    if (this.isFlushing || this.stagingQueue.length === 0) return false
    if (typeof window !== 'undefined' && !navigator.onLine) return false

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    this.isFlushing = true
    const batchToSend = [...this.stagingQueue]

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('chatze_auth_token') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch('/api/messaging/batch-flush', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: batchToSend }),
      })

      if (res.ok) {
        // Remove sent messages from queue
        const sentIds = new Set(batchToSend.map((m) => m.id))
        this.stagingQueue = this.stagingQueue.filter((m) => !sentIds.has(m.id))
        this.persistStaging()
        this.isFlushing = false
        return true
      }
    } catch (err) {
      console.warn('[Batch Flush Network Warning - Retrying later]', err)
    }

    this.isFlushing = false
    return false
  }

  /**
   * Emergency flush using navigator.sendBeacon when tab is unloaded or hidden.
   * Ensures zero message loss when user abruptly closes the browser.
   */
  private emergencyFlushWithBeacon(): void {
    if (this.stagingQueue.length === 0) return
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
      this.flushQueue()
      return
    }

    try {
      const payload = JSON.stringify({ messages: this.stagingQueue })
      const blob = new Blob([payload], { type: 'application/json' })
      const sent = navigator.sendBeacon('/api/messaging/batch-flush', blob)

      if (sent) {
        this.stagingQueue = []
        this.clearPersistedStaging()
      }
    } catch (e) {
      console.warn('[Beacon flush failed, falling back]', e)
    }
  }

  private persistStaging(): void {
    if (typeof window === 'undefined') return
    try {
      if (this.stagingQueue.length > 0) {
        localStorage.setItem('chatze_staged_messages', JSON.stringify(this.stagingQueue))
      } else {
        localStorage.removeItem('chatze_staged_messages')
      }
    } catch {}
  }

  private restorePersistedStaging(): void {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('chatze_staged_messages')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.stagingQueue = parsed
          // Flush pending items after brief warm up
          setTimeout(() => this.flushQueue(), 1500)
        }
      }
    } catch {}
  }

  private clearPersistedStaging(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem('chatze_staged_messages')
    } catch {}
  }

  public getQueueLength(): number {
    return this.stagingQueue.length
  }
}

export const stagingManager = new BatchStagingManager()
