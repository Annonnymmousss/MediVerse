import mongoose from "mongoose";
const appointmentSchema = new mongoose.Schema({
    userId:{ type : String , required : true},
    docId:{ type : String , required : true},
    slotDate:{ type : String , required : true},
    slotTime:{ type : String , required : true},
    userData:{ type : Object , required : true},
    docData:{ type : Object , required : true},
    amount:{ type : Number , required : true},
    date:{ type : Number , required : true},
    cancelled:{ type : Boolean , default : false},
    payment:{ type : Boolean , default : false},
    isCompleted:{ type : Boolean , default : false},
    aiSessionId: { type: String }, // Reference to AI session
    preVisitNotes: {
        agent1Summary: Object,
        agent2Analysis: Object,
        agent3Report: Object
    },
    testReports: [{
        fileName: String,
        fileUrl: String,
        uploadedAt: Date,
        analyzedByAgent3: Boolean
    }],
    consultationNotes: String,
    followUpRequired: Boolean,
    followUpDate: String
})


const appointmentModel = mongoose.model.appointment || mongoose.model('appointment' , appointmentSchema)

export default appointmentModel