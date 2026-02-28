"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { getUsersByRole, type User } from "@/services/api-service"
import { useAuth } from "@/context/auth-context"
import {
  MessageSquare,
  Send,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  UserCheck,
  Loader2,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SentMessage {
  id: string
  to: string
  toName: string
  body: string
  status: "sent" | "failed" | "pending"
  timestamp: string
}

const MESSAGE_TEMPLATES = [
  { label: "Shaqo bilow", body: "Fadlan shaqadaada maanta si dhaqso ah u bilow. Mahadsanid." },
  { label: "Kullan muhiim ah", body: "Waxaa jira kullan muhiim ah oo maanta dhacaya. Fadlan diyaar noqo." },
  { label: "Asset hubinta", body: "Fadlan hubi assets-ka aad mas'uulka ka tahay oo soo gudbi warbixin." },
  { label: "Ogaysiis guud", body: "Ogaysiis: Fadlan fiiri email-kaaga si aad u hesho macluumaad dheeraad ah." },
  { label: "Mahad celin", body: "Waan ku mahadcelinaynaa shaqadaada wanaagsan. Sii wad sidaas!" },
  { label: "Xasuusin", body: "Xasuusin: Fadlan dhameystir hawlihii lagaa rabay wakhtiga saxda ah." },
]

export default function OfficerMessagesPage() {
  const { user: currentUser } = useAuth()
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([])
  const [operations, setOperations] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [sendMode, setSendMode] = useState<"single" | "all">("single")
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    const fetchOps = async () => {
      try {
        const ops = await getUsersByRole("adminOperation")
        setOperations(Array.isArray(ops) ? ops : [])
      } catch (error) {
        setOperations([])
      }
    }
    fetchOps()

    const saved = localStorage.getItem("siu_officer_sent_messages")
    if (saved) setSentMessages(JSON.parse(saved))
  }, [])

  const saveMessages = (msgs: SentMessage[]) => {
    setSentMessages(msgs)
    localStorage.setItem("siu_officer_sent_messages", JSON.stringify(msgs))
  }

  const buildMessage = (body: string) => {
    const senderName = currentUser?.name || "Admin Officer"
    return `SIU Assets Management\nKa socota: ${senderName} (Admin Officer)\n\n${body}`
  }

  const sendSMS = async (sendto: string, body: string, toName: string) => {
    const fullBody = buildMessage(body)
    const newMsg: SentMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      to: sendto,
      toName,
      body: fullBody,
      status: "pending",
      timestamp: new Date().toISOString(),
    }

    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendto, body: fullBody }),
      })

      if (res.ok) {
        newMsg.status = "sent"
      } else {
        newMsg.status = "failed"
      }
    } catch {
      newMsg.status = "failed"
    }

    return newMsg
  }

  const handleSendToUser = async () => {
    if (!selectedUser || !message) return
    setIsSending(true)
    setFeedback(null)

    const user = operations.find((u) => u.id === selectedUser)
    if (!user || !user.phone) {
      setFeedback({ type: "error", message: "User-kan phone number ma laha." })
      setIsSending(false)
      return
    }

    const result = await sendSMS(user.phone, message, user.name)
    const updated = [result, ...sentMessages]
    saveMessages(updated)

    if (result.status === "sent") {
      setFeedback({ type: "success", message: `SMS waa loo diray ${user.name}` })
      setSelectedUser("")
      setMessage("")
    } else {
      setFeedback({ type: "error", message: "SMS ma dirin karin. Isku day mar kale." })
    }
    setIsSending(false)
  }

  const handleSendToAll = async () => {
    if (!message) return
    setIsSending(true)
    setFeedback(null)

    const withPhone = operations.filter((u) => u.phone && u.phone.trim() !== "")
    if (withPhone.length === 0) {
      setFeedback({ type: "error", message: "Wax Operation ah oo phone leh ma jiraan." })
      setIsSending(false)
      return
    }

    const results: SentMessage[] = []
    for (const user of withPhone) {
      const result = await sendSMS(user.phone!, message, user.name)
      results.push(result)
    }

    const updated = [...results, ...sentMessages]
    saveMessages(updated)

    const successCount = results.filter((r) => r.status === "sent").length
    const failCount = results.filter((r) => r.status === "failed").length

    if (failCount === 0) {
      setFeedback({ type: "success", message: `${successCount} shaqaale oo dhan waa loo diray SMS!` })
    } else {
      setFeedback({ type: "error", message: `${successCount} la diray, ${failCount} ma dirin karin.` })
    }

    setMessage("")
    setIsSending(false)
  }

  const handleSend = () => {
    if (sendMode === "single") handleSendToUser()
    else handleSendToAll()
  }

  const stats = {
    total: sentMessages.length,
    sent: sentMessages.filter((m) => m.status === "sent").length,
    failed: sentMessages.filter((m) => m.status === "failed").length,
  }

  return (
    <DashboardLayout allowedRoles={["adminOfficer"]}>
      <PageHeader title="SMS - Admin Operations" description="U dir fariin SMS shaqaalaha Admin Operation" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-border bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Guud</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-to-br from-success/20 to-success/5 border-success/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">La diray</p>
              <p className="text-2xl font-bold mt-1">{stats.sent}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-gradient-to-br from-destructive/20 to-destructive/5 border-destructive/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Guul-darreysay</p>
              <p className="text-2xl font-bold mt-1">{stats.failed}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations List */}
      <Card className="border-border mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Admin Operations</CardTitle>
              <p className="text-sm text-muted-foreground">{operations.length} shaqaale, {operations.filter(u => u.phone).length} phone leh</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {operations.map((op) => (
              <div key={op.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-success">{op.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{op.name}</p>
                    <p className="text-xs text-muted-foreground">{op.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {op.phone ? (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                      <Phone className="h-3 w-3 mr-1" />
                      {op.phone}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                      Phone ma laha
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {operations.length === 0 && (
              <p className="text-center text-muted-foreground py-6">Wali Admin Operation la abuurin</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send SMS Form */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Dir Fariin</CardTitle>
                <p className="text-sm text-muted-foreground">U dir SMS Admin Operation shaqaalaha</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Send Mode */}
            <div className="flex gap-2">
              <Button
                variant={sendMode === "single" ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setSendMode("single")}
              >
                <UserCheck className="h-4 w-4" />
                Qof Keliya
              </Button>
              <Button
                variant={sendMode === "all" ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setSendMode("all")}
              >
                <Users className="h-4 w-4" />
                Dhammaan Operations
              </Button>
            </div>

            {/* Select User */}
            {sendMode === "single" && (
              <div className="space-y-2">
                <Label>Dooro Shaqaalaha</Label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm text-foreground"
                >
                  <option value="">-- Dooro Operation User --</option>
                  {operations.map((u) => (
                    <option key={u.id} value={u.id} disabled={!u.phone}>
                      {u.name} {u.phone ? `- ${u.phone}` : "- (Phone ma laha)"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* All Operations Info */}
            {sendMode === "all" && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm text-primary">
                  SMS waxaa loo diri doonaa <strong>{operations.filter(u => u.phone).length}</strong> shaqaale oo phone leh
                </p>
              </div>
            )}

            {/* Templates */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates (Fariimo Diyaar ah)
              </Label>
              <div className="flex flex-wrap gap-2">
                {MESSAGE_TEMPLATES.map((template) => (
                  <Button
                    key={template.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent"
                    onClick={() => setMessage(template.body)}
                  >
                    {template.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Fariinta</Label>
              <Textarea
                placeholder="Qor fariintaada halkan..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="bg-muted/50 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {message.length} characters | SMS waxaa lagu dari doonaa: magacaaga iyo shaqadaada
              </p>
            </div>

            {/* Feedback */}
            {feedback && (
              <div className={cn(
                "p-3 rounded-xl flex items-center gap-2 text-sm",
                feedback.type === "success"
                  ? "bg-success/10 border border-success/30 text-success"
                  : "bg-destructive/10 border border-destructive/30 text-destructive"
              )}>
                {feedback.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {feedback.message}
              </div>
            )}

            {/* Send Button */}
            <Button
              className="w-full gap-2 h-11"
              onClick={handleSend}
              disabled={isSending || !message || (sendMode === "single" && !selectedUser)}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waa la dirayaa...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {sendMode === "all" ? "U Dir Dhammaan" : "Dir SMS"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Message History */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Taariikhda Fariimaha</CardTitle>
                  <p className="text-sm text-muted-foreground">{sentMessages.length} SMS la diray</p>
                </div>
              </div>
              {sentMessages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => saveMessages([])}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sentMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Wali fariin la dirin</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sentMessages.slice(0, 20).map((msg) => (
                  <div key={msg.id} className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">{msg.toName}</span>
                          <Badge
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              msg.status === "sent" && "bg-success/10 text-success border-success/30",
                              msg.status === "failed" && "bg-destructive/10 text-destructive border-destructive/30",
                              msg.status === "pending" && "bg-warning/10 text-warning border-warning/30",
                            )}
                            variant="outline"
                          >
                            {msg.status === "sent" ? "La diray" : msg.status === "failed" ? "Guul-darreysay" : "Sugitaan"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{msg.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
