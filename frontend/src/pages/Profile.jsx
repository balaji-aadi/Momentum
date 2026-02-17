import React, { useState } from "react";
import { FaLock, FaUserEdit } from "react-icons/fa";
import { MdOutlineTransferWithinAStation } from "react-icons/md";
import { Link } from "react-router-dom";

const Profile = () => {
  const [profile, setProfile] = useState({
    name: "Balaji aadesh",
    email: "balajiaadi@gmail.com",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiFv_OXQX1-bAUtLoXebEZsXTj8I2z3yL9AA&s",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleImageChange = (e) => {
    e.preventDefault();
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfile((prev) => ({ ...prev, image: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const toggleEditMode = () => setIsEditing(!isEditing);

  const handlePasswordChange = () => {
    // Handle password change logic here, like calling an API
    console.log("Password changed to:", newPassword);
    setShowPasswordModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex justify-center items-center p-6">
      <div className="bg-gray-900/80 backdrop-blur-lg shadow-lg rounded-lg p-6 w-full max-w-lg text-white">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img
              className="w-24 h-24 rounded-full border-4 border-indigo-500 object-contain"
              src={profile.image}
              alt="Profile"
            />
            <button
              className="absolute bottom-0 right-0 bg-indigo-500 p-1 rounded-full"
              onClick={handleImageChange}
            >
              <FaUserEdit className="text-white" />
            </button>
          </div>
          <span className="mt-2 bg-gray-700 px-3 py-1 rounded-full text-sm">
            Owner
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm">Name</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleInputChange}
              className="w-full bg-gray-800 text-white p-2 rounded-lg focus:outline-none border border-gray-700 focus:border-indigo-500"
              disabled={!isEditing}
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">Email</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={profile.email}
                className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-700 focus:outline-none"
                disabled
              />
              <span className="absolute right-3 top-3 text-gray-500">
                <FaLock />
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            className="bg-gray-800 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-700"
            onClick={() => setShowPasswordModal(true)}
          >
            <FaLock /> Change Password
          </button>
          <button className="bg-gray-800 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-700">
            <MdOutlineTransferWithinAStation /> Delete Account
          </button>
        </div>

        <div className="mt-6 border-t border-gray-700 pt-4 text-center text-sm">
          <p>
            Contact our{" "}
            <Link to="#" className="text-indigo-500">
              support team
            </Link>{" "}
            to process the deletion of your account.
          </p>
        </div>

        <div className="flex justify-center mt-4">
          <button
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
            onClick={toggleEditMode}
          >
            {isEditing ? "Save Changes" : "Edit Profile"}
          </button>
        </div>
      </div>

      {/* Modal for Password Change */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-gray-900 p-6 rounded-lg max-w-sm w-full text-white">
            <h3 className="text-lg mb-4">Change Password</h3>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-800 text-white p-2 rounded-lg mb-4 focus:outline-none border border-gray-700"
            />
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-600 px-4 py-2 rounded-lg"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-indigo-600 px-4 py-2 rounded-lg"
                onClick={handlePasswordChange}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
