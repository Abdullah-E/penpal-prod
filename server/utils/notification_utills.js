import Notification from "../models/notification"

export const createNotification = async (user, message, link) => {
    const notification = new Notification({
        user: user._id,
        message,
        link
    })
    await notification.save()
    return notification
}