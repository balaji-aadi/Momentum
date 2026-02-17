import mongoose, { Schema } from "mongoose";


const userRoleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 250,
      unique: true,
    },
    active: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false, 
  }
);

userRoleSchema.pre("save", function (next) {
  this.name = this.name.toLowerCase().replace(" ", "");
  next();
});

export const ROLES = {
  ADMIN: "admin",
  PROJECT_MANAGER: "projectmanager",
  DEVELOPER: "developer",
  TESTER: "tester",
  EMPLOYEE: "employee"
};

export const UserRole = mongoose.model("UserRole", userRoleSchema);

// Seed default roles
const seedRoles = async () => {
    try {
        const roles = Object.values(ROLES);
        for (const roleName of roles) {
            const exists = await UserRole.findOne({ name: roleName });
            if (!exists) {
                await UserRole.create({ name: roleName });
                console.log(`Seeded role: ${roleName}`);
            }
        }
    } catch (error) {
        console.error("Error seeding roles:", error);
    }
};

// Call seed on app start (or you can run a separate script)
// For now, we export it so it can be called from index/app.js or a script
export { seedRoles };