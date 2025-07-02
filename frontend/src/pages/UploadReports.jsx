import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const UploadReports = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { token, backendUrl } = useContext(AppContext);
    const [appointment, setAppointment] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    useEffect(() => {
        if (!token) {
            toast.error("Please login to access this page");
            navigate('/login');
            return;
        }
        fetchAppointmentDetails();
    }, [appointmentId, token]);

    const fetchAppointmentDetails = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/ai/appointment/${appointmentId}`, {
                headers: { token }
            });
            if (response.data.success) {
                setAppointment(response.data.appointment);
                console.log('Fetched appointment:', response.data.appointment);
            }
        } catch (error) {
            console.error('Error fetching appointment:', error);
            toast.error('Failed to load appointment details');
        }
    };

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        setIsUploading(true);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('reports', file);
            });
            formData.append('appointmentId', appointmentId);

            const response = await axios.post(`${backendUrl}/api/ai/analyze-report`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    token
                }
            });

            if (response.data.success) {
                toast.success('Reports uploaded and analyzed successfully!');
                setAnalysisResult(response.data.analysis);
                setUploadedFiles(prev => [...prev, ...files]);
                console.log('Analysis result:', response.data.analysis);
                fetchAppointmentDetails();
            } else {
                console.error('Backend error:', response.data);
                toast.error(response.data.message || 'Failed to upload reports');
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            if (error.response && error.response.data && error.response.data.message) {
                toast.error('Upload failed: ' + error.response.data.message);
            } else {
                toast.error('Failed to upload reports');
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const event = { target: { files } };
            handleFileUpload(event);
        }
    };

    if (!appointment) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Upload Test Reports</h1>
                <p className="text-gray-600">
                    Upload your test reports for analysis before your appointment with{' '}
                    <span className="font-medium">{appointment.docData?.name}</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                    Appointment: {appointment.slotDate} at {appointment.slotTime}
                </p>
            </div>

            {/* Upload Area */}
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 mb-6">
                <div
                    className="text-center"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <div className="mb-4">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                        >
                            <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <div className="mb-4">
                        <p className="text-lg font-medium text-gray-900">
                            Upload your test reports
                        </p>
                        <p className="text-sm text-gray-500">
                            PDF, JPG, PNG files up to 10MB each
                        </p>
                    </div>
                    <label className="cursor-pointer bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition-colors">
                        {isUploading ? 'Uploading...' : 'Choose Files'}
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={isUploading}
                        />
                    </label>
                </div>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Files</h3>
                    <div className="space-y-3">
                        {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                    <span className="text-xs text-gray-500">
                                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Analysis Result */}
            {analysisResult && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                        AI Analysis Results
                    </h3>
                    <div className="space-y-4">
                        {analysisResult.summary && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Summary:</p>
                                <p className="text-sm text-gray-600">{analysisResult.summary}</p>
                            </div>
                        )}
                        {analysisResult.abnormalities && analysisResult.abnormalities.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Abnormalities Found:</p>
                                <ul className="list-disc list-inside text-sm text-gray-600 ml-4 space-y-1">
                                    {analysisResult.abnormalities.map((abnormality, index) => (
                                        <li key={index} className="text-red-600">{abnormality}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                                <ul className="list-disc list-inside text-sm text-gray-600 ml-4 space-y-1">
                                    {analysisResult.recommendations.map((recommendation, index) => (
                                        <li key={index}>{recommendation}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => navigate('/my-appointments')}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Back to Appointments
                </button>
                <button
                    onClick={() => navigate(`/ai-chat/${appointment.aiSessionId}`)}
                    className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                    Continue to AI Chat
                </button>
            </div>
        </div>
    );
};

export default UploadReports; 