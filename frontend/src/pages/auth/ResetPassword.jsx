import React from "react";
// import React, { useState } from "react";
import { useFormik } from "formik";
import InputField from "../../components/InputField";
import { userValidationSchema } from "../../validationSchema";
import { AuthApi } from "../../services/api/Auth.api";
import { useLoading } from "../../components/loader/LoaderContext";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const email = localStorage.getItem("email");
  const { handleLoading } = useLoading();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email,
      newPassword: "",
      confirmPassword: "",
    },
    // validationSchema: userValidationSchema,
    onSubmit: async (values) => {
      console.log("Form Values:", values);
      const { confirmPassword, ...val } = values;
      handleLoading(true);
      try {
        const res = await AuthApi.ResetPassword(val);
        console.log(res.data);
      } catch (err) {
        console.log(err);
      }
      navigate("/login");
      handleLoading(false);
      formik.resetForm();
    },
  });

  return (
    <div className=" flex bg-primaryBg justify-center items-center h-[100vh]  relative">
      <div className="bg-white rounded-md h-[65%] w-[26rem] dark:bg-themeBG dark:text-themeText border-2 border-white ">
        <div className=" flex  flex-col justify-center items-center">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-themeText pt-4">
            Change your password
          </h3>

          <div className="text-sm mt-4 text-primaryBg text-center dark:text-themeText ">
            Enter a new password below to
            <p className="text-sm ml-16 sm:ml-0"> change your password</p>
          </div>
        </div>

        <form className="p-6 rounded-xl " onSubmit={formik.handleSubmit}>
          <div className="h-[55vh] overflow-auto p-2">
            <InputField
              label="New Password"
              name="newPassword"
              type="password"
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder=" New password"
              error={formik.touched.newPassword && formik.errors.newPassword}
              isRequired
            />

            <InputField
              label="Confirm password"
              name="confirmPassword"
              type="password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Confirm your Password"
              error={
                formik.touched.confirmPassword && formik.errors.confirmPassword
              }
              isRequired
            />

            {/* Buttons */}
            <div className="flex justify-center space-x-4 mt-6 w-auto">
              <button
                type="submit"
                disabled={
                  formik.values.confirmPassword && formik.values.newPassword
                    ? false
                    : true
                }
                className="px-6 py-2 rounded-lg focus:outline-none w-[100%] bg-[#FDC886] text-white cursor-pointer"
              >
                Change password
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
