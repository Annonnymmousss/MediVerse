import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import {useNavigate} from 'react-router-dom'
import { toast } from 'react-toastify'
import { useSocket } from '../context/SocketProvider'

const MyAppointments = () => {

    const {backendUrl , token , getDoctorsData} = useContext(AppContext)
    const [appointments,setappointments] = useState([])
    const navigate = useNavigate()

   
    const getUserAppointments = async() => {
      try {
        const {data} = await axios.post(backendUrl + "/api/user/appointments" ,{},{headers:{token}})
        if(data.success){
          setappointments(data.appointments.reverse())
        }
      } catch (error) {
        console.log(error)
        toast.error(error.message)
      }
    }

    const cancelAppointment = async(appointmentId)=>{
      try {
        const {data} = await axios.post(backendUrl + '/api/user/cancel-appointment' , {appointmentId} , {headers:{token}})
        if(data.success){
          toast.success(data.message)
          getUserAppointments()
          getDoctorsData()
        }else{
          toast.error(data.message)
        }
        
      } catch (error) {
        console.log(error)
        toast.error(error.message)
      }
    }

    const joinVideoCall = async(appointmentId)=>{
      console.log("Joined Video call")
      navigate(`/video-chat/${appointmentId}`)
    }

    const initPay=(order)=>{
      const options={
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name:'Appointment payment',
        description:"Appointment payment",
        order_id: order.id,
        reciept:order.reciept,
        handler:async(response)=>{
          console.log(response);
          try {
          const{data} = await axios.post(backendUrl + "/api/user/verifyRazorpay" , response , {headers:{token}})
          if(data.success){
            getUserAppointments()
            navigate('/my-appointments')
          }
        } catch (error) {
          console.log(error)
          toast.error(error.message)
        }
        }
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    }
    const appointmentRazorpay = async (appointmentId) => {
      const {data} = await axios.post(backendUrl + "/api/user/payment-razorpay" , {appointmentId} , {headers:{token}})
      if(data.success){
        initPay(data.orders)
      }
    }

  useEffect(()=>{
    if(token){
      getUserAppointments()
    }
  },[token])
  return (
    <div>
      <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My Appointments</p>
      <div>
        {appointments.map((item,index)=>(
            <div className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b' key={index}>
                <div>
                    <img className='w-32 bg-indigo-50' src={item.docData.image}/>
                </div>
                <div className='flex-1 text-sm text-zinc-600 '>
                    <p className='text-neutral-800 font-semibold'>{item.docData.name}</p>
                    <p>{item.docData.speciality}</p>
                    <p className='text-zinc-700 font-medium mt-1'>Address:</p>
                    <p className='text-xs'>{item.docData.address.line1}</p>
                    <p className='text-xs'>{item.docData.address.line2}</p>
                    <p className='text-xs mt-1'><span className='text-sm text-neutral-700 font-medium'>Date & Time: </span>{item.slotDate} | {item.slotTime}</p>
                </div>
                <div></div>
                <div className='flex flex-col justify-end'>
                    {!item.cancelled && item.payment && <button className='sm:min-w-48 py-2 border-rounded text-stone-500 bg-indigo-500'>Paid</button>}
                    {!item.cancelled && !item.payment &&  <button onClick={()=>appointmentRazorpay(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-indigo-500 hover:text-white transition-all duration-300'>Pay Online</button>}
                    {!item.cancelled && <button onClick={()=>joinVideoCall(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-green-600 hover:text-white transition-all duration-300'>Join Video Call</button>}
                    {!item.cancelled && <button onClick={()=>cancelAppointment(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel Appointment</button>}
                    {item.cancelled && <button className='sm:min-w-48 py-2 border border-red-700 rounded text-red-700'>Appointment Cancelled</button>}
                </div>
            </div>
        ))}
      </div>
    </div>
  )
}

export default MyAppointments
