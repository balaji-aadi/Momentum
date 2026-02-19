import React from "react";
import { useFormik } from "formik";
import InputField from "../../components/InputField";
// import { authValidationSchema } from "../../validationSchema";
import { AuthApi } from "../../services/api/Auth.api";
import { useNavigate } from "react-router-dom";
import { useLoading } from "../../components/loader/LoaderContext";
import toast from "react-hot-toast";

const Forget = () => {
  const navigate = useNavigate();
  const { handleLoading } = useLoading();

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    // validationSchema: authValidationSchema,
    onSubmit: async (values) => {
      handleLoading(true);
      console.log("Form Values:", values);
      try {
        const res = await AuthApi.generateOTP(values);
        console.log(res.data);
        toast.success("OTP send Successfully");
        localStorage.setItem("email", values?.email);
        navigate(`/verification`);
      } catch (err) {
        console.log(err);
      }

      handleLoading(false);
    },
  });

  return (
    <div className=" flex bg-primaryBg justify-center items-center h-[100vh]  ">
      <form onSubmit={formik.handleSubmit}>
        <div className=" bg-white p-6 rounded-xl dark:bg-themeBG dark:text-themeText">
          <div className="mb-4 flex  flex-col justify-center items-center">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-themeText">
              Forgot Password
            </h3>
          </div>
          <InputField
            label="Email"
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter Email"
            error={formik.touched.email && formik.errors.email}
            isRequired
          />

          {/* Buttons */}

          <div className="flex justify-center space-x-4 mt-6 w-96">
            <button
              type="submit"
              disabled={formik.values.email ? false : true}
              className=" text-black px-6 py-2 rounded-lg focus:outline-none w-[100%]  bg-[#FDC886] "
            >
              Send otp
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Forget;
