import doctorModel from "../models/doctorModel.js"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"

const changeAvailabiltiy = async(req,res) =>{
    try {
        const {docId} = req.body
        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId,{available:!docData.available})
        res.json({success:true , message: "Availability changed"})
    } catch (error) {
        console.log(error)
        res.json({success:false , message:error}) 
    }
}

const doctorList = async(req,res) =>{
    try {
        const doctors = await doctorModel.find({}).select(['-password' , '-email'])
        res.json({success:true , doctors})
    } catch (error) {
        console.log(error)
        res.json({success:false , message:error}) 
    }
}

const loginDoctor = async(req,res) => {
    try {
        const {email,password} = req.body
        const doctor = await doctorModel.findOne({email})
        if(!doctor){
            return res.json({success:false , message:"Invalid Credentials"})
        }
        const isMatch = await bcrypt.compare(password , doctor.password )
        if(isMatch){
            const token = jwt.sign({id:doctor._id}, process.env.JWT_SECRET)
            return res.json({success:true , token})
        }else{
            return res.json({success:false , message:"Invalid Credentials"})
        }
    } catch (error) {
        console.log(error)
        return res.json({success:false , message:error}) 
    }
}

const appointmentsDoctor = async(req,res) => {
    try {
        const docId = req.docId
        const appointments = await appointmentModel.find({docId})
        res.json({success:true,appointments})
    } catch (error) {
        console.log(error)
        return res.json({success:false , message:error})
    }
}

const appointmentComplete = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const docId = req.docId;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.docId && appointmentData.docId.toString() === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
            return res.json({ success: true, message: "Appointment Complete" });
        } else {
            return res.json({ success: false, message: "Mark Failed" });
        }
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};


const appointmentCancelled = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const docId = req.docId;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.docId && appointmentData.docId.toString() === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
            return res.json({ success: true, message: "Appointment Cancelled" });
        } else {
            return res.json({ success: false, message: "Cancellation Failed" });
        }
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

const doctorDashboard = async(req,res) => {
    try {
        const docId = req.docId
        const appointments = await appointmentModel.find({docId})
        let earnings = 0
        appointments.map((item)=>{
            if(item.isCompleted||item.payment){
                earnings+=item.amount
            }
        })
        let patients=[]
        appointments.map((item)=>{
            if(!patients.includes(item.userId)){
                patients.push(item.userId)
            }
        })
        const dashData = {
            earnings,
            appointments: appointments.length,
            patients : patients.length,
            latestAppointments:appointments.reverse().slice(0,5)
        }
        res.json({success:true,dashData})
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
}
export {
    changeAvailabiltiy,doctorList,loginDoctor , appointmentsDoctor , appointmentCancelled , appointmentComplete , doctorDashboard
}