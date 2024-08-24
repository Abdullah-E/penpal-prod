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

export const sendMail = async (mailOptions) => {
    try{
        const info = await transporter.sendMail(mailOptions)
        console.log("Message sent: %s", info.response)
        return info
    }
    catch(err){
        console.error(err)
        return null
    }
}

const test_mail_options = {
    from: process.env.GMAIL_EMAIL,
    to: 'bully.ae@gmail.com',
    subject: 'Test email',
    text: 'This is a test email'
}

sendMail(test_mail_options)