import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    event:{
        type:Object,
        required:false
    },
    session:{
        type:Object,
        required:false
    },
})

const Event = mongoose.model("Event", eventSchema)
export default Event