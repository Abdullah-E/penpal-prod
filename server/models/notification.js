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

const getHTMLTemplate = (message, link, firstName) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Pen Pals</title>
</head>
<body
    style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 10px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A344D; padding: 20px;">
        <tr>
            <td align="center">
                <img src="./assets/penpal-logo.png" alt="User Logo" style="max-width: 200px; max-height: 70px;">
            </td>
        </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td>
                <h1 style="color: #4a4a4a; margin-bottom: 0%; text-transform: uppercase;">Welcome to Pen Pals
                    <br /><span style="font-size: x-large; text-transform: none;">${firstName}</span>
                </h1>
                <p style="margin: 5px 0px;">${message}</p>
                <h2 style="color: #4a4a4a; margin: 10px 0;">Your Pen Pals Membership</h2>
                <p style="margin: 5px 0px;">You've selected the plan. Here's a
                summary of your membership: <a href="${link}" class="button">Click here to view</a></p>

                // <table width="100%" cellpadding="10" cellspacing="0" style="border: 1px solid #0A344D; margin: 15px 0;">
                //     <tr style="background-color: #0A344D;">
                //         <th align="left" style="color: #f8f8f8;">Plan Details</th>
                //         <th align="right" style="color: #f8f8f8;">Price</th>
                //     </tr>
                //     <tr>
                //         <td>{{PLAN_NAME}}</td>
                //         <td align="right">{{PLAN_PRICE}}</td>
                //     </tr>
                //     <tr>
                //         <td><strong>Total</strong></td>
                //         <td align="right"><strong>{{TOTAL_PRICE}}</strong></td>
                //     </tr>
                // </table>

                // <p>Your membership includes:</p>
                // <ul>
                //     <li>{{FEATURE_1}}</li>
                //     <li>{{FEATURE_2}}</li>
                //     <li>{{FEATURE_3}}</li>
                // </ul>

                <p>We're excited to have you on board and can't wait to see the amazing stories you'll share and the
                    connections you'll make.</p>

                <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team
                    at <a href="mailto:support@penpals.com" style="color: #007bff;">support@penpals.com</a>.</p>

                <p>Happy writing!</p>

                <p>Best regards,<br>The Pen Pals Team</p>
            </td>
        </tr>
    </table>
</body>
</html>
`;

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
                html: getHTMLTemplate(this.message, this.link)
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