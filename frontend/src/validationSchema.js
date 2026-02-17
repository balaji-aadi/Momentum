import * as Yup from "yup";

// export const projectValidationSchema = Yup.object({
//   name: Yup.string()
//     .max(100, "Name must be 100 characters or less")
//     .required("Project name is required"),
//   access: Yup.string().required("Access level is required"),
//   key: Yup.string().required("Project key is required"),
//   description: Yup.string().max(
//     500,
//     "Description must be 500 characters or less"
//   ),
//   startDate: Yup.date()
//     .min(new Date(), "Start date cannot be earlier than today")
//     .required("Start date is required"),
//   endDate: Yup.date()
//     .min(Yup.ref("startDate"), "End date must be later than start date")
//     .required("End date is required"),
//   priority: Yup.string().required("Project priority is required"),
//   clientName: Yup.string(),
//   budget: Yup.number().typeError("Budget must be a number").nullable(),

// });

// // export const teamAssignValidation = Yup.object({
// //   projectManager: Yup.object().required("Project Manager is required"),
// //   teamMembers: Yup.array()
// //     .min(1, "At least one team member is required")
// //     .required("Team members are required"),
// //   rolesAndResponsibilities: Yup.array()
// //     .of(
// //       Yup.object({
// //         teamMember: Yup.object().required("Team member is required"),
// //         role: Yup.string().required("Role is required"),
// //         responsibility: Yup.string().required("Responsibility is required"),
// //       })
// //     )
// //     .min(1, "At least one role and responsibility must be assigned"),
// // });

// export const teamAssignValidation = Yup.object({
//   projectManager: Yup.string().required("Project Manager is required"),

//   teamMembers: Yup.array()
//     .min(1, "At least one team member is required")
//     .required("Team members are required"),

//   rolesAndResponsibilities: Yup.array()
//     .of(
//       Yup.object({
//         teamMember: Yup.string().required("Team member is required"),
//         role: Yup.string().required("Role is required"),
//         responsibility: Yup.string().required("Responsibility is required"),
//       })
//     )
//     .min(1, "At least one role and responsibility must be assigned"),
// });

// export const milestoneValidationSchema = Yup.object({
//   milestoneName: Yup.string().required("Milestone Name is required"),
//   description: Yup.string().max(
//     300,
//     "Description cannot exceed 300 characters"
//   ),
//   expectedCompletionDate: Yup.date().required(
//     "Expected Completion Date is required"
//   ),
//   deliverables: Yup.string(),
// });

export const taskValidationSchema = Yup.object({
  taskName: Yup.string()
    .max(100, "Must be 100 characters or less")
    .required("Task name is required"),
  taskDescription: Yup.string().max(500, "Must be 500 characters or less"),
  taskPriority: Yup.string().required("Priority is required"),
  estimatedHours: Yup.number()
    .positive("Hours must be a positive number")
    .required("Estimated hours are required"),
  taskType: Yup.string().required("Task type is required"),
  assignee: Yup.string().required("Assignee is required"),
  taskStartDate: Yup.date().required("Start date is required"),
  taskDueDate: Yup.date()
    .min(Yup.ref("taskStartDate"), "Due date must be after start date")
    .required("Due date is required"),
  dependentTasks: Yup.array().of(Yup.string()),
  dependencyType: Yup.string(),
});

export const userValidationSchema = (isUpdating) =>
  Yup.object({
    firstName: Yup.string().required("First Name is required"),
    lastName: Yup.string().required("Last Name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    phoneNumber: Yup.string().matches(
      /^[0-9]{10}$/,
      "Phone number must be 10 digits"
    ),
    password: isUpdating
      ? Yup.string()
      : Yup.string()
          .min(8, "Password must be at least 8 characters")
          .matches(
            /[A-Z]/,
            "Password must contain at least one uppercase letter"
          )
          .matches(/[0-9]/, "Password must contain at least one number")
          .matches(
            /[^A-Za-z0-9]/,
            "Password must contain at least one special character"
          )
          .required("Password is required"),
    confirmPassword: isUpdating
      ? Yup.string()
      : Yup.string()
          .oneOf([Yup.ref("password"), null], "Passwords must match")
          .required("Confirm Password is required"),
    // userType: Yup.object().required("User Type is required"),
  });
