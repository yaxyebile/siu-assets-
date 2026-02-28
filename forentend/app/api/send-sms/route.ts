import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { sendto, body } = await request.json()

    if (!sendto || !body) {
      return NextResponse.json({ error: "Phone number and message are required" }, { status: 400 })
    }

    const formData = new URLSearchParams()
    formData.append("sendto", sendto)
    formData.append("body", body)
    formData.append("device_id", "12539")
    formData.append("sim", "1")
    formData.append("token", "9cc542db9cc23b626ae294a166a1594d")

    const response = await fetch("https://smsgateway24.com/getdata/addsms", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    const data = await response.text()

    return NextResponse.json({ success: true, data })
  } catch (error) {

    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 })
  }
}
