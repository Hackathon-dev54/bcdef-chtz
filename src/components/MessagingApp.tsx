import React, { useState, useEffect, useRef, useMemo } from 'react'
import { MessageSquare, UserPlus, Check } from 'lucide-react'
import { NotificationPermissionBanner } from './NotificationPermissionBanner'
import { OfflineIndicator } from './OfflineIndicator'
import { ProfileSettingsModal } from './ProfileSettingsModal'
import { SettingsPage } from './SettingsPage'
import {
  type Conversation,
  type InboxFilter,
  getOptimizedImageUrl,
  parseMessageContent,
  compressImageToWebP,
  getAuthHeaders,
  useThemeMode,
  useChatScroll,
  useMediaAttachment,
  useInquiriesManager,
  useFriendshipManager,
  useMessagingSync,
  TopNavbar,
  SidebarHeader,
  SidebarFooter,
  IncomingRequestsBanner,
  InquiriesFeed,
  ConversationList,
  ChatHeader,
  ChatStreamView,
  ChatComposer,
  ConnectContactModal,
  IdentityAddressModal,
  PaymentQrModal,
  ImageSendModal,
  ImageLightboxModal,
  ContactDetailSidebar,
} from './messaging'

// Re-export utilities so external code importing from MessagingApp continues to work seamlessly
export { getOptimizedImageUrl, parseMessageContent, compressImageToWebP }

export function MessagingApp({
  currentUser,
  businessName,
  onLogout,
}: {
  currentUser: { id: string; handle: string; display_name: string; role?: string }
  businessName: string
  onLogout: () => void
}) {
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all')
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal')
  const [showIdentityModal, setShowIdentityModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentDisplayName, setCurrentDisplayName] = useState(businessName || currentUser.display_name)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [showContactSidebar, setShowContactSidebar] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // 1. Theme Mode Hook
  const { theme, toggleTheme } = useThemeMode()

  // 2. Chat Scroll & Viewport Hook
  const {
    messagesContainerRef,
    messagesEndRef,
    showScrollBottom,
    hasNewUnreadWhileScrolled,
    setHasNewUnreadWhileScrolled,
    handleScroll,
    scrollToBottom,
  } = useChatScroll()

  // 3. Live SSE & Local-First IndexedDB Delta-Sync Hook
  const {
    conversations,
    setConversations,
    activeConv,
    setActiveConv,
    messages,
    friendships,
    setFriendships,
    streamConnected,
    loadConversations,
    runSync,
    handleSendMessage: sendMessageSync,
  } = useMessagingSync({
    currentUser,
    onNewInquiry: () => fetchInquiries(),
    scrollToBottom,
    setHasNewUnreadWhileScrolled,
    messagesContainerRef,
  })

  // 4. Inquiries & Shop Letterbox Hook
  const {
    inquiries,
    pendingInquiryCount,
    replyingInquiryId,
    copiedShopLink,
    inquiryActionToast,
    fetchInquiries,
    handleReplyInquiry,
    handleDismissInquiry,
    shopPortfolioUrl,
    handleCopyShopUrl,
    handleShareShopUrl,
  } = useInquiriesManager({
    currentDisplayName,
    onAfterReply: async () => {
      await runSync()
      await loadConversations()
    },
    setInboxFilter,
  })

  // 5. Friendships & Federation Hook
  const {
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
  } = useFriendshipManager({
    currentUser,
    friendships,
    setFriendships,
    setConversations,
    setActiveConv,
  })

  // Send Message Orchestrator
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault()
    const textToSend = customText || inputText.trim()
    if (!textToSend || !activeConv) return
    await sendMessageSync(textToSend, () => {
      if (!customText) setInputText('')
    })
  }

  // 6. Media Attachment & Upload Hook
  const {
    selectedImageFile,
    setSelectedImageFile,
    isUploadingImage,
    lightboxUrl,
    setLightboxUrl,
    fileInputRef,
    handleFileInputChange,
    handlePaste,
    handleSendImage,
  } = useMediaAttachment({
    activeConv,
    onSendMessage: handleSendMessage,
  })

  // Global ⌘K / Ctrl+K keyboard shortcut to open Connect Contact modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setShowAddFriendModal(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Profile, Mode & URL Handshake Initialization
  useEffect(() => {
    fetch('/api/profile', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setAccountType(data.profile.accountType || 'personal')
          if (data.profile.friendPin) setMyFriendPin(data.profile.friendPin)
        }
      })
      .catch(() => {})

    fetchInquiries()

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const addParam = params.get('add')
      const pinParam = params.get('pin')
      if (addParam) {
        setFriendHandle(addParam.replace(/^@/, ''))
        if (pinParam) setFriendPinInput(pinParam)
        setShowAddFriendModal(true)
      }
      if (params.get('tab') === 'inquiries' || params.get('tab') === 'letterbox') {
        setInboxFilter('letterbox')
      }
    }
  }, [])

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesSearch =
        c.otherUser.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
      if (!matchesSearch) return false
      if (inboxFilter === 'pending') return c.status === 'pending'
      if (inboxFilter === 'unread') return (c.unreadCount || 0) > 0
      if (inboxFilter === 'friends') return c.status !== 'letterbox'
      if (inboxFilter === 'letterbox') return c.status === 'letterbox'
      return true
    })
  }, [conversations, searchQuery, inboxFilter])

  const hasLetterboxActivity = Boolean(
    conversations.some((c) => c.status === 'letterbox') ||
      inquiries.some((i) => i.status === 'pending')
  )

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} flex flex-col h-screen w-full bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans select-none transition-colors`}>
      {/* 0. Top Full-Width Navbar (Spans 100% of the viewport) */}
      <TopNavbar
        currentUser={currentUser}
        currentDisplayName={currentDisplayName}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onFocusSearch={() => {
          setIsSettingsOpen(false)
          searchInputRef.current?.focus()
        }}
      />

      <NotificationPermissionBanner userHandle={currentUser.handle} />

      <div className="flex flex-1 w-full overflow-hidden">
        {/* 1. Left Sidebar */}
        <aside
          className={`${
            (activeConv || isSettingsOpen) ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-96 border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] flex-col shrink-0 h-full transition-colors`}
        >
          {/* Header Bar */}
          <SidebarHeader
            currentUser={currentUser}
            currentDisplayName={currentDisplayName}
            accountType={accountType}
            shopPortfolioUrl={shopPortfolioUrl}
            copiedShopLink={copiedShopLink}
            handleCopyShopUrl={handleCopyShopUrl}
            handleShareShopUrl={handleShareShopUrl}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            inboxFilter={inboxFilter}
            setInboxFilter={setInboxFilter}
            pendingInquiryCount={pendingInquiryCount}
            inquiriesCount={inquiries.length}
            totalChatsCount={conversations.length}
            hasLetterboxActivity={hasLetterboxActivity}
            onOpenConnectContact={() => setShowAddFriendModal(true)}
            searchInputRef={searchInputRef}
          />

          {/* Incoming Connection Requests Banner */}
          <IncomingRequestsBanner
            incomingRequests={incomingRequests}
            handleAcceptFriendRequest={handleAcceptFriendRequest}
            handleRejectFriendRequest={handleRejectFriendRequest}
          />

          {/* Chats or Inquiries Feed */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/40">
            {inboxFilter === 'letterbox' || inboxFilter === 'inquiries' ? (
              <InquiriesFeed
                accountType={accountType}
                currentUser={currentUser}
                inquiries={inquiries}
                conversations={conversations}
                filteredConversations={filteredConversations}
                activeConv={activeConv}
                setActiveConv={(conv) => {
                  setIsSettingsOpen(false)
                  setActiveConv(conv)
                }}
                handleReplyInquiry={handleReplyInquiry}
                handleDismissInquiry={handleDismissInquiry}
                replyingInquiryId={replyingInquiryId}
                onOpenProfile={() => setIsSettingsOpen(true)}
              />
            ) : (
              <ConversationList
                conversations={filteredConversations}
                activeConv={activeConv}
                setActiveConv={(conv) => {
                  setIsSettingsOpen(false)
                  setActiveConv(conv)
                }}
                inboxFilter={inboxFilter}
                onOpenConnectContact={() => setShowAddFriendModal(true)}
              />
            )}
          </div>

          {/* Bottom Pinned User Profile Footer */}
          <SidebarFooter
            currentUser={currentUser}
            currentDisplayName={currentDisplayName}
            onOpenProfile={() => setIsSettingsOpen(true)}
          />
        </aside>

        {/* 2. Main Panel: Settings Page or Active Chat */}
        <main
          className={`${
            (!activeConv && !isSettingsOpen) ? 'hidden md:flex' : 'flex'
          } flex-1 flex-col bg-zinc-50/50 dark:bg-[#0e0e10] min-w-0 relative w-full h-full transition-colors`}
        >
          {isSettingsOpen ? (
            <SettingsPage
              currentUser={currentUser}
              currentDisplayName={currentDisplayName}
              onBack={() => setIsSettingsOpen(false)}
              onProfileUpdated={(updated) => {
                setCurrentDisplayName(updated.displayName)
                setAccountType(updated.accountType)
              }}
              onOpenIdentityModal={() => setShowIdentityModal(true)}
              onOpenPaymentQrModal={() => setShowQrModal(true)}
              onLogout={onLogout}
              shopPortfolioUrl={shopPortfolioUrl}
            />
          ) : activeConv ? (
            <>
              {/* Active Header */}
              <ChatHeader
                activeConv={activeConv}
                accountType={accountType}
                currentUser={currentUser}
                streamConnected={streamConnected}
                onBack={() => setActiveConv(null)}
                onToggleSidebar={() => setShowContactSidebar(!showContactSidebar)}
                isSidebarOpen={showContactSidebar}
              />

              {/* Message Stream */}
              <ChatStreamView
                activeConv={activeConv}
                currentUser={currentUser}
                messages={messages}
                messagesContainerRef={messagesContainerRef}
                messagesEndRef={messagesEndRef}
                handleScroll={handleScroll}
                showScrollBottom={showScrollBottom}
                hasNewUnreadWhileScrolled={hasNewUnreadWhileScrolled}
                scrollToBottom={scrollToBottom}
                onOpenLightbox={(url) => setLightboxUrl(url)}
              />

              {/* Message Composer */}
              <ChatComposer
                activeConv={activeConv}
                inputText={inputText}
                setInputText={setInputText}
                handleSendMessage={handleSendMessage}
                handlePaste={handlePaste}
                handleFileInputChange={handleFileInputChange}
                fileInputRef={fileInputRef}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-4 max-w-sm mx-auto">
              <div className="p-4 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Independent WhatsApp at Edge</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Connect with any user across Cloudflare instances by adding their username and subdomain/domain.
              </p>
              <button
                onClick={() => setShowAddFriendModal(true)}
                className="py-2.5 px-4 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Connect Contact
              </button>
            </div>
          )}
        </main>

        {/* 3. Contact Detail Right Sidebar (Collapsible) */}
        {activeConv && (
          <ContactDetailSidebar
            activeConv={activeConv}
            messages={messages}
            isOpen={showContactSidebar}
            onClose={() => setShowContactSidebar(false)}
            onOpenLightbox={(url) => setLightboxUrl(url)}
          />
        )}
      </div>

      {/* 3. Connect Contact Modal */}
      <ConnectContactModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        accountType={accountType}
        myFriendPin={myFriendPin}
        friendHandle={friendHandle}
        setFriendHandle={setFriendHandle}
        friendDomain={friendDomain}
        setFriendDomain={setFriendDomain}
        friendPinInput={friendPinInput}
        setFriendPinInput={setFriendPinInput}
        addFriendError={addFriendError}
        sendingRequest={sendingRequest}
        handleSendFriendRequest={handleSendFriendRequest}
      />

      {/* 4. My Instance Address Modal */}
      <IdentityAddressModal
        isOpen={showIdentityModal}
        onClose={() => setShowIdentityModal(false)}
        currentUser={currentUser}
        copiedLink={copiedLink}
        setCopiedLink={setCopiedLink}
      />

      {/* 5. Payment QR Modal */}
      <PaymentQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        currentUser={currentUser}
        activeConv={activeConv}
        handleSendMessage={handleSendMessage}
      />

      {/* 6. Image Preview & Send Modal */}
      <ImageSendModal
        selectedImageFile={selectedImageFile}
        setSelectedImageFile={setSelectedImageFile}
        isUploadingImage={isUploadingImage}
        handleSendImage={handleSendImage}
      />

      {/* 7. Image Lightbox Modal */}
      <ImageLightboxModal
        lightboxUrl={lightboxUrl}
        onClose={() => setLightboxUrl(null)}
      />

      {/* Profile & Privacy Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentDisplayName(updated.displayName)
        }}
      />

      {/* Offline Connectivity Status Pill */}
      <OfflineIndicator />

      {/* Floating Action Toast Notification */}
      {inquiryActionToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 z-50 border border-zinc-800 dark:border-zinc-200 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{inquiryActionToast}</span>
        </div>
      )}
    </div>
  )
}
