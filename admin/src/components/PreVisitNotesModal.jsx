
import React from 'react';

const PreVisitNotesModal = ({ isOpen, onClose, appointmentData }) => {
    if (!isOpen || !appointmentData) return null;

    console.log('appointmentData:', appointmentData);
    console.log('preVisitNotes:', appointmentData.preVisitNotes);

    const { preVisitNotes, userData, docData, slotDate, slotTime } = appointmentData;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Pre-Visit Analysis
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {userData?.name} - {docData?.name} ({slotDate}, {slotTime})
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Agent 1 Summary */}
                    {preVisitNotes?.agent1Summary && (
                        <div className="border-l-4 border-blue-500 pl-4">
                            <h4 className="font-medium text-gray-800 mb-3">Initial Assessment (Agent 1)</h4>
                            <div className="space-y-3">
                                {preVisitNotes.agent1Summary.carePlan && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Care Plan:</p>
                                        <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                                            {preVisitNotes.agent1Summary.carePlan.map((item, index) => (
                                                <li key={index}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {preVisitNotes.agent1Summary.urgency && (
                                    <p className="text-sm text-gray-600">
                                        <strong>Urgency Level:</strong> {preVisitNotes.agent1Summary.urgency}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Agent 2 Analysis */}
                    {preVisitNotes?.agent2Analysis && (
                        <div className="border-l-4 border-green-500 pl-4">
                            <h4 className="font-medium text-gray-800 mb-3">Diagnostic Analysis (Agent 2)</h4>
                            <div className="space-y-4">
                                {preVisitNotes.agent2Analysis.differentialDiagnosis && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Possible Conditions:</p>
                                        <div className="space-y-2">
                                            {preVisitNotes.agent2Analysis.differentialDiagnosis.map((diagnosis, index) => (
                                                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {diagnosis.condition} ({Math.round(diagnosis.confidence * 100)}% confidence)
                                                    </p>
                                                    {diagnosis.reasoning && (
                                                        <p className="text-xs text-gray-600 mt-1">{diagnosis.reasoning}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {preVisitNotes.agent2Analysis.recommendedTests && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Recommended Tests:</p>
                                        <ul className="list-disc list-inside text-sm text-gray-600 ml-4 space-y-1">
                                            {preVisitNotes.agent2Analysis.recommendedTests.map((test, index) => (
                                                <li key={index}>{test}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {preVisitNotes.agent2Analysis.specialistReferrals && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Specialist Referrals:</p>
                                        <ul className="list-disc list-inside text-sm text-gray-600 ml-4 space-y-1">
                                            {preVisitNotes.agent2Analysis.specialistReferrals.map((referral, index) => (
                                                <li key={index}>{referral}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Agent 3 Report */}
                    {preVisitNotes?.agent3Report && (
                        <div className="border-l-4 border-purple-500 pl-4">
                            <h4 className="font-medium text-gray-800 mb-3">Test Report Analysis (Agent 3)</h4>
                            <div className="space-y-3">
                                {preVisitNotes.agent3Report.summary && (
                                    <p className="text-sm text-gray-600">{preVisitNotes.agent3Report.summary}</p>
                                )}
                                {preVisitNotes.agent3Report.abnormalities && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Abnormalities:</p>
                                        <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                                            {preVisitNotes.agent3Report.abnormalities.map((abnormality, index) => (
                                                <li key={index} className="text-red-600">
                                                    {typeof abnormality === 'string'
                                                        ? abnormality
                                                        : `${abnormality.test || ''}: ${abnormality.value || ''} (Range: ${abnormality.range || ''}, Status: ${abnormality.status || ''})`
                                                    }
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {preVisitNotes.agent3Report.recommendations && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Recommendations:</p>
                                        <ul className="list-disc list-inside text-sm text-gray-600 ml-4 space-y-1">
                                            {preVisitNotes.agent3Report.recommendations.map((recommendation, index) => (
                                                <li key={index}>
                                                    {typeof recommendation === 'string'
                                                        ? recommendation
                                                        : JSON.stringify(recommendation)
                                                    }
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Test Reports Files */}
                    {appointmentData.testReports && appointmentData.testReports.length > 0 && (
                        <div className="border-l-4 border-orange-500 pl-4">
                            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                                <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                                Uploaded Test Reports
                            </h4>
                            <div className="space-y-2">
                                {appointmentData.testReports.map((report, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{report.fileName}</p>
                                            <p className="text-xs text-gray-500">
                                                Uploaded: {new Date(report.uploadedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <a 
                                            href={report.fileUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                        >
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No Analysis Available */}
                    {!preVisitNotes?.agent1Summary && !preVisitNotes?.agent2Analysis && !preVisitNotes?.agent3Report && (
                        <div className="text-center py-8 text-gray-500">
                            <p>No pre-visit analysis available for this appointment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreVisitNotesModal;