import React, { useState, useMemo } from 'react'
import { Friendship, Conversation } from '../types'
import { saveLocalFriendships, saveLocalConversations } from '../../../lib/db'
import { getAuthHeaders } from '../authUtils'

export function useFriendshipManager({
  currentUser,
  friendships,
  setFriendships,
  setConversations,
  setActiveConv,
}: {
  currentUser: { id: string; handle: string; display_name: string }
  friendships: Friendship[]
  setFriendships: React.Dispatch<React.SetStateAction<Friendship[]>>
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
  setActiveConv: (conv: Conversation | null) => void
}) {
  const [showAddFriendModal, setShowAddFriendModal] = useState(false)
  const [friendHandle, setFriendHandle] = useState('')
  const [friendDomain, setFriendDomain] = useState('')
  const [friendPinInput, setFriendPinInput] = useState('')
  const [myFriendPin, setMyFriendPin] = useState('')
  const [sendingRequest, setSendingRequest] = useState(false)
  const [addFriendError, setAddFriendError] = useState('')

  // Send Contact Connection Request
  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!friendHandle.trim() || !friendDomain.trim()) return

    setSendingRequest(true)
    setAddFriendError('')

    try {
      const res = await fetch('/api/federation/requests', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          remoteHandle: friendHandle.trim(),
          remoteInstanceUrl: friendDomain.trim(),
          senderId: currentUser.id,
          myHandle: currentUser.handle,
          myDisplayName: currentUser.display_name,
          myInstanceUrl: window.location.origin,
          pin: friendPinInput.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setFriendHandle('')
        setFriendDomain('')
        setFriendPinInput('')
        setShowAddFriendModal(false)

        if (data.friendship) {
          setFriendships((prev) => {
            const updated = [data.friendship, ...prev.filter((f) => f.id !== data.friendship.id)]
            saveLocalFriendships(updated).catch(() => {})
            return updated
          })
        }
        if (data.conversation) {
          const newConv: Conversation = {
            id: data.conversation.id,
            otherUser: {
              id: data.conversation.user_b,
              username: data.conversation.remote_handle,
              displayName: `@${data.conversation.remote_handle}`,
            },
            status: 'pending',
            remoteInstanceUrl: data.conversation.remote_instance_url,
            lastMessage: { content: data.conversation.last_message_snippet, createdAt: Date.now() },
          }
          setConversations((prev) => {
            const updated = [newConv, ...prev.filter((c) => c.id !== newConv.id)]
            saveLocalConversations(updated).catch(() => {})
            return updated
          })
          setActiveConv(newConv)
        }
      } else {
        setAddFriendError(data.error || 'Failed to send request')
      }
    } catch (err: any) {
      setAddFriendError(err?.message || 'Network error')
    } finally {
      setSendingRequest(false)
    }
  }

  // Accept Inbound Request
  const handleAcceptFriendRequest = async (remoteHandle: string, remoteInstanceUrl: string) => {
    try {
      setFriendships((prev) => {
        const updated = prev.map((f) => (f.remote_handle === remoteHandle ? { ...f, status: 'active' } : f))
        saveLocalFriendships(updated).catch(() => {})
        return updated
      })
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.otherUser.username === remoteHandle
            ? { ...c, status: 'active', lastMessage: { content: 'Connected! You can now message each other.', createdAt: Date.now() } }
            : c
        )
        saveLocalConversations(updated).catch(() => {})
        return updated
      })

      await fetch('/api/federation/requests/accept', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          remoteHandle,
          remoteInstanceUrl,
          myHandle: currentUser.handle,
        }),
      })
    } catch (err) {
      console.error('Accept error', err)
    }
  }

  // Decline Inbound Request
  const handleRejectFriendRequest = async (remoteHandle: string, blockDomain = false, remoteInstanceUrl = '') => {
    try {
      setFriendships((prev) => {
        const updated = prev.filter((f) => f.remote_handle !== remoteHandle)
        saveLocalFriendships(updated).catch(() => {})
        return updated
      })
      setConversations((prev) => {
        const updated = prev.filter((c) => c.otherUser.username !== remoteHandle)
        saveLocalConversations(updated).catch(() => {})
        return updated
      })

      await fetch('/api/federation/requests/reject', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ remoteHandle, blockDomain, remoteInstanceUrl }),
      })
    } catch (err) {
      console.error('Reject error', err)
    }
  }

  const incomingRequests = useMemo(() => {
    return friendships.filter((f) => f.status === 'pending' && f.direction === 'incoming')
  }, [friendships])

  return {
    showAddFriendModal,
    setShowAddFriendModal,
    friendHandle,
    setFriendHandle,
    friendDomain,
    setFriendDomain,
    friendPinInput,
    setFriendPinInput,
    myFriendPin,
    setMyFriendPin,
    sendingRequest,
    addFriendError,
    handleSendFriendRequest,
    handleAcceptFriendRequest,
    handleRejectFriendRequest,
    incomingRequests,
  }
}
