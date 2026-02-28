import { getUsersByRole, getUserById, type User } from "@/services/api-service"

// Send SMS to a specific user by ID
async function sendSmsToUser(userId: string, message: string) {
  const user = await getUserById(userId)
  if (!user || !user.phone || user.phone.trim() === "") {

    return { success: false, error: "No phone number" }
  }

  try {
    const response = await fetch("/api/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sendto: user.phone, body: message }),
    })
    const data = await response.json()
    return { success: data.success || false }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// Send SMS notification to all Admin Officers who have phone numbers
export async function notifyAdminOfficers(message: string) {
  const officers = await getUsersByRole("adminOfficer")
  const admins = await getUsersByRole("admin")
  const allRecipients = [...officers, ...admins].filter((u) => u.phone && u.phone.trim() !== "")

  const results: { user: string; success: boolean; error?: string }[] = []

  if (allRecipients.length === 0) {
    return results
  }

  for (const recipient of allRecipients) {
    try {
      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sendto: recipient.phone,
          body: message,
        }),
      })

      const data = await response.json()
      results.push({ user: recipient.name, success: data.success || false })
    } catch (error) {
      results.push({ user: recipient.name, success: false, error: String(error) })
    }
  }

  return results
}

// Notification for new asset registration
export async function notifyNewAssetRegistered(assetName: string, serialNumber: string, department: string, registeredBy: string) {
  const message = `SIU Assets: Asset cusub la diiwaan galiyay!\n\nAsset: ${assetName}\nSerial: ${serialNumber}\nDept: ${department}\nQofka: ${registeredBy}`
  return notifyAdminOfficers(message)
}

// Notification when request is approved - send to the requester (Admin Operation)
export async function notifyRequestApproved(requestedById: string, requestType: string, assetName: string) {
  const typeLabels: Record<string, string> = {
    "asset-registration": "Diiwaan Gelin",
    "asset-damage": "Warbixin Dhaawac",
    "asset-transfer": "Wareejin Asset",
  }
  const typeLabel = typeLabels[requestType] || requestType
  const message = `SIU Assets: Request-kaagii waa la ansixiyay (Approved)!\n\nNooca: ${typeLabel}\nAsset: ${assetName}\n\nMahadsanid.`
  return sendSmsToUser(requestedById, message)
}

// Notification when request is rejected - send to the requester (Admin Operation)
export async function notifyRequestRejected(requestedById: string, requestType: string, assetName: string, reason?: string) {
  const typeLabels: Record<string, string> = {
    "asset-registration": "Diiwaan Gelin",
    "asset-damage": "Warbixin Dhaawac",
    "asset-transfer": "Wareejin Asset",
  }
  const typeLabel = typeLabels[requestType] || requestType
  let message = `SIU Assets: Request-kaagii waa la diiday (Rejected).\n\nNooca: ${typeLabel}\nAsset: ${assetName}`
  if (reason && reason.trim() !== "") {
    message += `\n\nSababta: ${reason.trim()}`
  }
  message += `\n\nFadlan la xiriir Admin Officer.`
  return sendSmsToUser(requestedById, message)
}

// Notification for new request
export async function notifyNewRequest(requestType: string, assetName: string, requestedBy: string) {
  const typeLabels: Record<string, string> = {
    "asset-registration": "Diiwaan Gelin Cusub",
    "asset-damage": "Warbixin Dhaawac",
    "asset-transfer": "Wareejin Asset",
    "usage": "Isticmaal Asset",
    "status-change": "Isbeddel Status",
    "maintenance": "Dayactir",
    "transfer": "Wareejin",
  }

  const typeLabel = typeLabels[requestType] || requestType
  const message = `SIU Assets: Request cusub!\n\nNooca: ${typeLabel}\nAsset: ${assetName}\nQofka: ${requestedBy}\n\nFadlan ka eeg Approvals page-ka.`
  return notifyAdminOfficers(message)
}
