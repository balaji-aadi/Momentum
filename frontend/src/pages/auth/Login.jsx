import React, { useState } from "react";
import { useFormik } from "formik";
import InputField from "../../components/InputField";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../store/slices/storeSlice";
import { IoEyeSharp } from "react-icons/io5";
import { TbEyeClosed } from "react-icons/tb";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { useLoading } from "../../components/loader/LoaderContext";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { handleLoading } = useLoading();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: async (values) => {
      console.log("Form Values:", values);
      handleLoading(true);
      try {
        await dispatch(login(values)).unwrap();
        navigate("/");
      } catch (e) {
        console.log("this is Error", e);
        toast.error("Invalid Credentials");
      }
      formik.resetForm();
      handleLoading(false);
    },
  });

  return (
    <div className="flex bg-primaryBg justify-center items-center min-h-screen px-4 sm:px-6 lg:px-8">
      <form onSubmit={formik.handleSubmit} className="w-full max-w-md">
        <div className="relative">
          <div>
            <img
              src="/a_logo.jpg"
              alt="logo"
              className="h-16 w-auto mx-auto mb-4 absolute top-[-80px] left-[-100%] rounded-full sm:left-[-40%] lg:left-[-50%]"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-themeBG dark:text-themeText p-6 rounded-xl shadow-md">
          <div className="mb-4 flex flex-col justify-center items-center">
            <h3 className="text-2xl font-semibold text-gray-700 dark:text-themeText">
              Login
            </h3>
            <div className="text-sm mt-4 text-primaryBg dark:text-themeText text-center ">
              Hey, Enter your details to get signed in
              <p className="text-sm ml-16 sm:ml-0">to your account</p>
            </div>
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

          <div className="relative">
            <InputField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Passcode"
              error={formik.touched.password && formik.errors.password}
              isRequired
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[70%] transform -translate-y-1/2 text-gray-600"
            >
              {showPassword ? (
                <IoEyeSharp size={24} />
              ) : (
                <TbEyeClosed size={24} />
              )}
            </button>
          </div>

          <div className="text-right mt-4">
            <p className="text-blue-500 text-sm">
              <Link to="/forget">Forget password</Link>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-center space-x-4 mt-6">
            <button
              type="submit"
              disabled={!formik.values.email || !formik.values.password}
              className={`text-black px-6 py-2 rounded-lg focus:outline-none w-full ${
                formik.values.email && formik.values.password
                  ? "bg-[#FDC886] cursor-pointer"
                  : "bg-[#f1dec6] cursor-not-allowed"
              }`}
            >
              Sign in
            </button>
          </div>

          <div className="mt-5 text-center text-xs text-gray-600 dark:text-themeText">
            <p>
              Don't have an account?{" "}
              <span className="text-blue-500 text-sm">
                Contact Support for assistance.
              </span>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;
