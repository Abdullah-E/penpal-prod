import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD
    },
})

export default transporter

const test_mail_options = {
    from: process.env.GMAIL_EMAIL,
    to: 'bully.ae@gmail.com',
    subject: 'Test email',
    text: 'This is a test email'
}