import mongoose from "mongoose";

const aiSessionSchema = new mongoose.Schema({
    appointmentId: { type: String, required: true },
    userId: { type: String, required: true },
    docId: { type: String, required: true },
    sessionType: { type: String, enum: ['agent1', 'agent2', 'agent3'], required: true },
    messages: [{
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    symptoms: {
        duration: String,
        severity: Number, // 1-10 scale
        description: String,
        redFlags: [String]
    },
    agent1Summary: {
        carePlan: [String],
        recommendations: [String],
        urgency: String // 'low', 'medium', 'high'
    },
    agent2Analysis: {
        differentialDiagnosis: [{
            condition: String,
            confidence: Number,
            reasoning: String
        }],
        recommendedTests: [String],
        specialistReferrals: [String]
    },
    agent3Report: {
        testResults: Object,
        abnormalities: [String],
        summary: String,
        recommendations: [String]
    },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const aiSessionModel = mongoose.model.aiSession || mongoose.model('aiSession', aiSessionSchema);

export default aiSessionModel; 