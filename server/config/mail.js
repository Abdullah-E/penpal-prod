import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    // host: 'smtp.gmail.com',
    // port: 465,
    // secure: true,
    auth: {
        user: "usamaitians.gcuf@gmail.com",
        pass: "yifzznlhlkpwuaal"
    },
})

export default transporter