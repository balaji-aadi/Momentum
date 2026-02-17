import React, { useState } from "react";
import { AuthApi } from "../../services/api/Auth.api";
import toast from "react-hot-toast";
import { useLoading } from "../../components/loader/LoaderContext";
import { useNavigate } from "react-router-dom";

const Verification = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const { handleLoading } = useLoading();
  const navigate = useNavigate();

  const email = localStorage.getItem("email");

  const payload = {
    email,
    otp: otp.join(""),
  };

  const handleOtp = async () => {
    handleLoading(true);
    try {
      const res = await AuthApi.otpVerification(payload);
      console.log(res.data);
      navigate("/reset");
    } catch (err) {
      console.log(err);
    }

    handleLoading(false);
  };
  const handleResend = async () => {
    try {
      await AuthApi.generateOTP({ email });
      toast.success("OTP send successfully");
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e, index) => {
    const value = e.target.value;
    const newOtp = [...otp];
    if (/[^0-9]/.test(value)) return;
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      document.getElementById(`otp-input-${index + 1}`).focus();
    }
    if (!value && index > 0) {
      document.getElementById(`otp-input-${index - 1}`).focus();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-center mb-4">Enter OTP</h2>

        <div className="text-center text-sm mt-4 text-primaryBg mb-5">
          Enter the 4 digit OTP that was send to<br></br>
          <p className="text-sm  text-blue-400"> {email} </p>
        </div>

        <div className="flex justify-between gap-9">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-input-${index}`}
              type="text"
              value={digit}
              onChange={(e) => handleChange(e, index)}
              maxLength={1}
              className="w-12 h-12 text-2xl text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ))}
        </div>

        <button
          type="submit"
          onClick={handleOtp}
          className="mt-4 w-full py-2 px-4 bg-indigo-500  text-white font-semibold rounded-md hover:bg-indigo-600"
        >
          Submit
        </button>

        <div className="flex justify-between mt-2">
          <button
            className="text-blue-400 text-sm cursor-pointer"
            onClick={handleResend}
          >
            Resend OTP
          </button>
        </div>
      </div>
    </div>
  );
};

export default Verification;
