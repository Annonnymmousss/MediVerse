import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import MyProfile from "./pages/MyProfile";
import MyAppointments from "./pages/MyAppointments";
import Appointment from "./pages/Appointment";
import UploadReports from "./pages/UploadReports";
import AIChat from "./pages/AIChat";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import VideoChat from "./pages/VideoCall";
import { SocketProvider } from "./context/SocketProvider";


const App=()=>{
  return (
    <div className="mx-4 sm:mx-[10%]">
      <ToastContainer/>
      <Navbar/>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/doctors" element={<Doctors/>} />
          <Route path="/doctors/:speciality" element={<Doctors/>} />
          <Route path="/about" element={<About/>} />
          <Route path="/contact" element={<Contact/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/my-profile" element={<MyProfile/>} />
          <Route path="/my-appointments" element={<MyAppointments/>} />
          <Route path="/appointment/:docId" element={<Appointment/>} />
          <Route path="/upload-reports/:appointmentId" element={<UploadReports/>} />
          <Route path="/ai-chat/:sessionId" element={<AIChat/>} />
          
          <Route path="/video-chat/:appointmentId" element={<SocketProvider><VideoChat /></SocketProvider>} />
        </Routes>
      <Footer/>
    </div>
  )
}


export default App