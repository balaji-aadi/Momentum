import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AuthApi } from "../../services/api/Auth.api";
import toast from "react-hot-toast";

export const login = createAsyncThunk(
  "login",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await AuthApi.login(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response.data.message || "Registration failed"
      );
    }
  }
);

export const logout = createAsyncThunk("logout", async () => {
  try {
    const response = await AuthApi.logout();
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Logout failed");
  }
});

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (user, { rejectWithValue }) => {
    try {
      // In a real app, you'd send the firebase token to your backend here.
      // For now, we'll return the firebase user as the payload.
      // const response = await AuthApi.googleLogin(user.accessToken);
      // return response.data;
      return {
        data: {
          user: {
            firstName: user.displayName.split(" ")[0],
            lastName: user.displayName.split(" ")[1] || "",
            email: user.email,
            userRole: { name: "User" }, // Default role
          },
          accessToken: user.accessToken,
          refreshToken: "mock-refresh-token",
        },
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const storeSlice = createSlice({
  name: "store",
  initialState: {
    token: false,
    currentUser: null,
    loading: false,
    error: false,
    success: false,
    isAuthenticated: false,
    showConsistencyModal: false,
  },
  reducers: {
    setShowConsistencyModal: (state, action) => {
      state.showConsistencyModal = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = false;
        state.success = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log("Login fulfilled action payload:", action.payload);
        state.loading = false;
        state.error = false;
        state.success = true;
        state.token = true;
        state.isAuthenticated = true;
        state.currentUser = action.payload.data.user || null;
        localStorage.setItem("accessToken", action.payload.data.accessToken);
        localStorage.setItem("refreshToken", action.payload.data.refreshToken);
        toast.success(`Welcome Back, ${action.payload.data?.user?.firstName}`);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.success = false;
      })
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = false;
        state.success = false;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.error = false;
        state.success = true;
        state.token = true;
        state.isAuthenticated = true;
        state.currentUser = action.payload.data.user || null;
        localStorage.setItem("accessToken", action.payload.data.accessToken);
        localStorage.setItem("refreshToken", action.payload.data.refreshToken);
        toast.success(`Welcome ${action.payload.data?.user?.firstName}`);
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.success = false;
        toast.error("Google Login Failed");
      })

      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = false;
        state.success = false;
      })
      .addCase(logout.fulfilled, (state, action) => {
        state.loading = false;
        state.error = false;
        state.success = true;
        state.currentUser = null;
        state.token = false;
        state.isAuthenticated = false;
        localStorage.clear();
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        toast.success("Logout successfully");
      })
      .addCase(logout.rejected, (state) => {
        state.loading = false;
        state.error = true;
        state.success = false;
      });
  },
});

export const { setShowConsistencyModal } = storeSlice.actions;
export default storeSlice.reducer;
