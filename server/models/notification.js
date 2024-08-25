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
]

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    },
    type:{
        type:String,
        required:true,
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
}, {timestamps: true})

const getHTMLTemplate = (message, link) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>New Notification</h2>
        <p>${message}</p>
        <p><a href="${link}" class="button">Click here to view</a></p>
    </div>
</body>
</html>
`;

//send email
notificationSchema.pre('save', async function(next){
    if(this.isNew){
        try{
            await this.populate('user', 'email')
            await this.populate('customer', 'basicInfo.firstName')
            console.log("Sending email", this.user.email)
            let subject = 'New Notification'
            if(this.type.endsWith("Expired")){
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
        catch(err){
            console.error(err)
        }
    }

    next()
})

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification