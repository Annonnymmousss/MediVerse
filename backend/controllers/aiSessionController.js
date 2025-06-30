// backend/controllers/aiSessionController.js
import aiSessionModel from '../models/aiSessionModel.js';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import {
    generateAgent1Greeting, 
    generateAgent1Response, 
    generateAgent1Summary, 
    generateAgent2Diagnosis, 
    generateAgent3Analysis, 
    extractTextFromReport 
} from '../aiHelpers.js';
import { v2 as cloudinary } from 'cloudinary';


const startAgent1Session = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const userId = req.userId;
        
       
        console.log('aiSessionController.js - startAgent1Session - GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
        console.log('aiSessionController.js - startAgent1Session - GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
        
      
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }
        
        if (appointment.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized access" });
        }
        
        const user = await userModel.findById(userId);
        

        let aiSession = await aiSessionModel.findOne({ appointmentId, sessionType: 'agent1' });
        
        if (!aiSession) {
          
            aiSession = new aiSessionModel({
                appointmentId,
                userId,
                docId: appointment.docId,
                sessionType: 'agent1'
            });
        }
        
      
        const greeting = await generateAgent1Greeting(user, appointment);
        
       
        aiSession.messages.push({
            role: 'assistant',
            content: greeting
        });
        
        await aiSession.save();
        
       
        await appointmentModel.findByIdAndUpdate(appointmentId, { aiSessionId: aiSession._id });
        
        res.json({ 
            success: true, 
            sessionId: aiSession._id, 
            greeting,
            message: "AI session started successfully" 
        });
    } catch (error) {
        console.error('Error starting AI session:', error);
        res.json({ success: false, message: error.message });
    }
};


const processAgent1Message = async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        const userId = req.userId;
        
       
        console.log('aiSessionController.js - processAgent1Message - GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
        console.log('aiSessionController.js - processAgent1Message - GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
        
        const aiSession = await aiSessionModel.findById(sessionId);
        if (!aiSession) {
            return res.json({ success: false, message: "Session not found" });
        }
        
        if (aiSession.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized access" });
        }
        

        aiSession.messages.push({
            role: 'user',
            content: message
        });
        

        const response = await generateAgent1Response(aiSession, message);
        

        aiSession.messages.push({
            role: 'assistant',
            content: response.content
        });
        

        if (response.symptoms && Object.keys(response.symptoms).length > 0) {
            aiSession.symptoms = { ...aiSession.symptoms, ...response.symptoms };
        }
        
   
        if (response.isComplete) {
            aiSession.agent1Summary = await generateAgent1Summary(aiSession);
            aiSession.status = 'completed';
            
   
            await appointmentModel.findByIdAndUpdate(aiSession.appointmentId, {
                'preVisitNotes.agent1Summary': aiSession.agent1Summary
            });
        }
        
        aiSession.updatedAt = new Date();
        await aiSession.save();
        
        res.json({ 
            success: true, 
            response: response.content, 
            isComplete: response.isComplete,
            symptoms: aiSession.symptoms 
        });
    } catch (error) {
        console.error('Error processing message:', error);
        res.json({ success: false, message: error.message });
    }
};


const getAISession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.userId;
        
        const aiSession = await aiSessionModel.findById(sessionId);
        if (!aiSession) {
            return res.json({ success: false, message: "Session not found" });
        }
        
        if (aiSession.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized access" });
        }
        
       
        const appointment = await appointmentModel.findById(aiSession.appointmentId);
        const doctor = await doctorModel.findById(aiSession.docId);
        
        res.json({ 
            success: true, 
            session: {
                ...aiSession.toObject(),
                appointment,
                docData: doctor
            }
        });
    } catch (error) {
        console.error('Error fetching AI session:', error);
        res.json({ success: false, message: error.message });
    }
};


const generateAgent2Analysis = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const docId = req.docId;
        
  
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment || appointment.docId !== docId) {
            return res.json({ success: false, message: "Unauthorized access" });
        }
        
      
        const aiSession = await aiSessionModel.findOne({ appointmentId, sessionType: 'agent1' });
        if (!aiSession) {
            return res.json({ success: false, message: "No AI session found for this appointment" });
        }
        
     
        const analysis = await generateAgent2Diagnosis(aiSession, appointment);
        
      
        aiSession.agent2Analysis = analysis;
        aiSession.updatedAt = new Date();
        await aiSession.save();
        
      
        await appointmentModel.findByIdAndUpdate(appointmentId, {
            'preVisitNotes.agent2Analysis': analysis
        });
        
        res.json({ success: true, analysis });
    } catch (error) {
        console.error('Error generating Agent 2 analysis:', error);
        res.json({ success: false, message: error.message });
    }
};


const analyzeTestReport = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const userId = req.userId;
        const reportFiles = req.files;
        
        if (!reportFiles || reportFiles.length === 0) {
            return res.json({ success: false, message: "No files uploaded" });
        }
        
       
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment || appointment.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized access" });
        }
        
        const uploadedReports = [];
        let combinedAnalysis = {
            summary: "",
            abnormalities: [],
            recommendations: []
        };
        
       
        for (const file of reportFiles) {
            try {
                
                const extractedText = await extractTextFromReport(file.path);
                
              
                const analysis = await generateAgent3Analysis(extractedText);
                
              
                const uploadResult = await cloudinary.uploader.upload(file.path, {
                    resource_type: "auto",
                    folder: "medical-reports"
                });
                
    
                combinedAnalysis.summary += analysis.summary + " ";
                combinedAnalysis.abnormalities.push(...(analysis.abnormalities || []));
                combinedAnalysis.recommendations.push(...(analysis.recommendations || []));
                
                uploadedReports.push({
                    fileName: file.originalname,
                    fileUrl: uploadResult.secure_url,
                    uploadedAt: new Date(),
                    analyzedByAgent3: true
                });
                
            } catch (fileError) {
                console.error('Error processing file:', fileError);
              
            }
        }
        

        combinedAnalysis.abnormalities = [...new Set(combinedAnalysis.abnormalities)];
        combinedAnalysis.recommendations = [...new Set(combinedAnalysis.recommendations)];
        
     
        await appointmentModel.findByIdAndUpdate(appointmentId, {
            $push: { testReports: { $each: uploadedReports } },
            'preVisitNotes.agent3Report': combinedAnalysis
        });
        
        res.json({ 
            success: true, 
            analysis: combinedAnalysis,
            uploadedFiles: uploadedReports.length,
            message: "Reports uploaded and analyzed successfully" 
        });
    } catch (error) {
        console.error('Error analyzing test reports:', error);
        res.json({ success: false, message: error.message });
    }
};

const getAppointmentDetails = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.userId;
        
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }
        
        if (appointment.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized access" });
        }
        
        res.json({ success: true, appointment });
    } catch (error) {
        console.error('Error fetching appointment details:', error);
        res.json({ success: false, message: error.message });
    }
};


const forceCompleteAgent1Session = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.userId;
        const aiSession = await aiSessionModel.findById(sessionId);
        if (!aiSession) {
            return res.json({ success: false, message: "Session not found" });
        }
        if (aiSession.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized access" });
        }
        if (aiSession.status === 'completed') {
            return res.json({ success: true, alreadyCompleted: true, agent1Summary: aiSession.agent1Summary });
        }
      
        aiSession.agent1Summary = await generateAgent1Summary(aiSession);
        aiSession.status = 'completed';
        aiSession.updatedAt = new Date();
        await aiSession.save();
   
        await appointmentModel.findByIdAndUpdate(aiSession.appointmentId, {
            'preVisitNotes.agent1Summary': aiSession.agent1Summary
        });
        res.json({ success: true, agent1Summary: aiSession.agent1Summary });
    } catch (error) {
        console.error('Error force completing Agent 1 session:', error);
        res.json({ success: false, message: error.message });
    }
};

export {
    startAgent1Session,
    processAgent1Message,
    getAISession,
    generateAgent2Analysis,
    analyzeTestReport,
    getAppointmentDetails,
    forceCompleteAgent1Session
};