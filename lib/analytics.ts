// Google Analytics event tracking utilities

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void
  }
}

export const GA_MEASUREMENT_ID = "G-QMPHXVV7TX"

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window.gtag !== "undefined") {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window.gtag !== "undefined") {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Specific event tracking functions for Numainda

export const trackChatMessage = (threadId?: string) => {
  trackEvent("send_message", "Chat", threadId)
}

export const trackNewChatThread = () => {
  trackEvent("create_thread", "Chat")
}

export const trackDocumentView = (documentType: string, documentId: string) => {
  trackEvent("view_document", "Documents", `${documentType}:${documentId}`)
}

export const trackSearch = (query: string, resultCount: number) => {
  trackEvent("search", "Search", query, resultCount)
}

export const trackPehchanLogin = (success: boolean) => {
  trackEvent(
    success ? "login_success" : "login_failure",
    "Authentication",
    "Pehchan"
  )
}

export const trackDocumentUpload = (documentType: string) => {
  trackEvent("upload_document", "Admin", documentType)
}

export const trackBillView = (billId: string) => {
  trackEvent("view_bill", "Bills", billId)
}

export const trackProceedingView = (proceedingId: string) => {
  trackEvent("view_proceeding", "Proceedings", proceedingId)
}

export const trackConstitutionView = () => {
  trackEvent("view_constitution", "Documents", "Constitution")
}

export const trackRAGQuery = (relevantChunks: number) => {
  trackEvent("rag_query", "AI", "relevant_chunks", relevantChunks)
}
