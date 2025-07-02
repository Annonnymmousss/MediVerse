import React, { useState } from 'react'
import { useContext } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { useEffect } from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import PreVisitNotesModal from '../../components/PreVisitNotesModal'
import axios from 'axios'
import { toast } from 'react-toastify'
import {useNavigate} from 'react-router-dom'

const DoctorDashboard = () => {
  const { dashData, setdashData, getDashData, dtoken , cancelAppointment , completeAppointment, backendUrl } = useContext(DoctorContext)
  const { currency } = useContext(AppContext)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showPreVisitModal, setShowPreVisitModal] = useState(false)
  const [isRunningAgent2, setIsRunningAgent2] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (dtoken) {
      getDashData()
    }
  }, [dtoken])

  const viewPreVisitNotes = (appointment) => {
    setSelectedAppointment(appointment)
    setShowPreVisitModal(true)
  }

  const closePreVisitModal = () => {
    setShowPreVisitModal(false)
    setSelectedAppointment(null)
  }

  const runAgent2Analysis = async (appointmentId) => {
    setIsRunningAgent2(true)
    try {
      const response = await axios.post(
        backendUrl + '/api/ai/generate-analysis',
        { appointmentId },
        { headers: { dtoken } }
      )
      if (response.data.success) {
        toast.success('Agent 2 analysis generated!')

        getDashData()

        if (selectedAppointment && selectedAppointment._id === appointmentId) {
          setSelectedAppointment({
            ...selectedAppointment,
            preVisitNotes: {
              ...selectedAppointment.preVisitNotes,
              agent2Analysis: response.data.analysis
            }
          })
        }
      } else {
        toast.error(response.data.message || 'Failed to generate analysis')
      }
    } catch (error) {
      toast.error('Failed to generate analysis')
    } finally {
      setIsRunningAgent2(false)
    }
  }

  const joinVideoCall = async(appointmentId)=>{
      console.log("Joined Video call")
      navigate(`/video-chat/${appointmentId}`)
    }

  return dashData && (
    <div className='m-5'>
      <div className='flex flex-wrap gap-3'>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img src={assets.earning_icon} />
          <div>
            <p>{currency}{dashData.earnings}</p>
            <p>Earnings</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img src={assets.appointments_icon} />
          <div>
            <p>{dashData.appointments}</p>
            <p>Appointments</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img src={assets.patients_icon} />
          <div>
            <p>{dashData.patients}</p>
            <p>Patients</p>
          </div>
        </div>
      </div>
      <div className='bg-white'>
        <div className='flex items-center gap-2.5 px-4 py-4 mt-10 rounded-t border-gray-200 border'>
          <img src={assets.list_icon} />
          <p className='font-semibold'>Latest Bookings</p>
        </div>
        <div className='pt-4 border border-gray-200 border-t-0'>
          {
            dashData.latestAppointments.map((item, index) => (
              <div className='px-6 py-4 border-b border-gray-200 hover:bg-gray-50' key={index}>
                <div className='flex items-center gap-3 mb-3'>
                  <img className='rounded-full w-10' src={item.userData.image} />
                  <div className='flex-1 text-sm'>
                    <p className='text-gray-800 font-medium'>{item.userData.name}</p>
                    <p className='text-gray-600'>{item.slotDate}</p>
                  </div>
                  {
                    item.cancelled
                      ? <p className='text-xs font-medium text-red-700'>Cancelled</p>
                      : item.isComplete
                        ? <p className='text-xs font-medium text-green-500'>Completed</p>
                        : <div className='flex'>
                          <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
                          <img onClick={() => completeAppointment(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                          <button onClick={()=>joinVideoCall(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-red-600 hover:text-white transition-all duration-300'>Start Appointment</button>
                        </div>
                  }
                </div>
                {/* Pre-visit notes section */}
                {item.preVisitNotes && (
                  <div className='ml-13 bg-blue-50 rounded-lg p-3 mb-3'>
                    <p className='text-xs font-medium text-blue-800 mb-2'>Pre-Visit Analysis Available</p>
                    <button 
                      onClick={() => viewPreVisitNotes(item)}
                      className='text-xs text-blue-600 hover:text-blue-800 underline mr-4'
                    >
                      View Analysis
                    </button>
                    {/* Agent 2 button: show if agent1Summary exists but agent2Analysis does not */}
                    {item.preVisitNotes.agent1Summary && !item.preVisitNotes.agent2Analysis && (
                      <button
                        onClick={() => runAgent2Analysis(item._id)}
                        disabled={isRunningAgent2}
                        className='text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        {isRunningAgent2 ? 'Running...' : 'Run Pre-Visit Analysis'}
                      </button>
                    )}
                  </div>
                )}
                {/* Test reports section */}
                {item.testReports && item.testReports.length > 0 && (
                  <div className='ml-13 bg-green-50 rounded-lg p-3 mb-3'>
                    <p className='text-xs font-medium text-green-800 mb-2'>
                      {item.testReports.length} Test Report{item.testReports.length > 1 ? 's' : ''} Available
                    </p>
                    <button 
                      onClick={() => viewPreVisitNotes(item)}
                      className='text-xs text-green-600 hover:text-green-800 underline'
                    >
                      View Reports
                    </button>
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>

      {/* Pre-Visit Notes Modal */}
      {showPreVisitModal && (
        <PreVisitNotesModal 
          isOpen={showPreVisitModal}
          onClose={closePreVisitModal}
          appointmentData={selectedAppointment}
        />
      )}
    </div>
  )
}

export default DoctorDashboard
