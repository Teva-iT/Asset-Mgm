import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { firstName, lastName, email, requestType, requestedDate, notes } = body

        // 1. Validation
        if (!firstName || !lastName || !email || !requestType || !requestedDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (!email.endsWith('@tevapharma.ch')) {
            return NextResponse.json({ error: 'Invalid email domain. Must be @tevapharma.ch' }, { status: 400 })
        }

        const date = new Date(requestedDate)
        if (isNaN(date.getTime())) {
            return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
        }

        // Check for weekends (0 = Sunday, 6 = Saturday)
        const day = date.getDay()
        if (day === 0 || day === 6) {
            return NextResponse.json({ error: 'Weekends are not allowed' }, { status: 400 })
        }

        // Check for past dates (simple check, ignoring time for today)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (date < today) {
            return NextResponse.json({ error: 'Cannot select a past date' }, { status: 400 })
        }

        // 2. Save to DB
        const newId = crypto.randomUUID();
        const { error, data: assetRequest } = await supabase.from("AssetRequest").insert({
            RequestID: newId,
            FirstName: firstName,
            LastName: lastName,
            Email: email,
            RequestType: requestType,
            RequestedDate: date.toISOString(),
            Notes: notes,
            Status: "PENDING",
            updatedAt: new Date().toISOString()
        }).select().single()

        if (error) throw error;

        // 3. Send Email
        try {
            // Example Transporter - REPLACE WITH REAL CREDENTIALS
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.example.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER || 'user',
                    pass: process.env.SMTP_PASS || 'pass',
                },
            });

            const mailOptions = {
                from: '"Asset Manager" <no-reply@tevapharma.ch>',
                to: 'mahan.zartoshti@tevapharma.ch, Service-Now@tevapharma.ch',
                subject: `Asset Return / Delivery Request – ${firstName} ${lastName} – ${date.toLocaleDateString()}`,
                text: `
Asset Request Details:

Full Name: ${firstName} ${lastName}
Email: ${email}
Request Type: ${requestType}
Requested Date: ${date.toLocaleDateString()}

Notes:
${notes || 'None'}

Timestamp: ${new Date().toLocaleString()}
                `,
            };

            // Only actually send if we have a host, otherwise log
            if (process.env.SMTP_HOST) {
                await transporter.sendMail(mailOptions);
            } else {
                console.log('SMTP_HOST not set. Mocking Email Send:', mailOptions);
            }

        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't fail the request if email fails, just log it
        }

        return NextResponse.json({ success: true, request: assetRequest })

    } catch (error) {
        console.error('Error creating asset request:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

