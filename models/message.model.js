const mongoose = require("mongoose");

const messageModel = mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User"  || null },
    isAI: { type: Boolean, default: false },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    chat:{ type: mongoose.Schema.Types.ObjectId, ref:"Chat" },
    message:{ type: String, trim: true, },
    
},{
    timestamps: true,
})
   
const Message = mongoose.model("Message", messageModel)

module.exports = Message;