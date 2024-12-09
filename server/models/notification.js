import mongoose from 'mongoose'
import transporter from '../config/mail.js'
/*
    notifications when
        for admin
            featured or premium status expires
            profile expires
        for user
            favorite profile updated
*/


const NOTIFICATION_TYPES = [
    "customerUpdate",
    "featuredExpired",
    "premiumExpired",
    "profileExpired",
    "customerPurchase"
]

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    },
    type: {
        type: String,
        required: true,
        enum: NOTIFICATION_TYPES
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false,
        required: true
    },
    readAt: {
        type: Date,
        required: false,
        default: null
    }
}, { timestamps: true })

//send email
notificationSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            await this.populate('user', 'email')
            await this.populate('customer', 'basicInfo.firstName')
            console.log("Sending email", this.user.email)
            let subject = 'New Notification'
            if (this.type.endsWith("Expired")) {
                subject = `${this.customer.basicInfo.firstName}'s ${this.type.slice(0, -7)} has expired`
            }
            const mailOptions = {
                from: process.env.GMAIL_EMAIL,
                to: this.user.email,
                subject,
                html: this.message
            }
            const info = await transporter.sendMail(mailOptions)
            console.log("Email sent", info.response)
        }
        catch (err) {
            console.error(err)
        }
    }

    next()
})

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification