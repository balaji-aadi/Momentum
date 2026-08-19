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

export const zohoLogin = createAsyncThunk(
  "auth/zohoLogin",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await AuthApi.zohoLogin(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Zoho Login failed"
      );
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
    globalSearch: "",
    activeBranch: JSON.parse(localStorage.getItem("activeBranch")) || null,
    branches: [],
    globalSettings: {
        subscriptionType: "free"
    },
    dailyRevision: null,
    isSidebarCollapsed: localStorage.getItem("isSidebarCollapsed") === "true"
  },
  reducers: {
    toggleSidebarCollapsed: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
      localStorage.setItem("isSidebarCollapsed", state.isSidebarCollapsed);
    },
    setDailyRevision: (state, action) => {
      state.dailyRevision = action.payload;
    },
    setGlobalSettings: (state, action) => {
      state.globalSettings = action.payload;
    },
    setShowConsistencyModal: (state, action) => {
      state.showConsistencyModal = action.payload;
    },
    setGlobalSearch: (state, action) => {
      state.globalSearch = action.payload;
    },
    setActiveBranch: (state, action) => {
      state.activeBranch = action.payload;
      localStorage.setItem("activeBranch", JSON.stringify(action.payload));
    },
    setBranches: (state, action) => {
      state.branches = action.payload;
    },
    updateCurrentUser: (state, action) => {
      state.currentUser = { ...state.currentUser, ...action.payload };
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
        localStorage.setItem("currentUser", JSON.stringify(action.payload.data.user));
        localStorage.setItem("accessToken", action.payload.data.accessToken);
        localStorage.setItem("refreshToken", action.payload.data.refreshToken);
        toast.success(`Welcome Back, ${action.payload.data?.user?.firstName}`);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.success = false;
      })
      .addCase(zohoLogin.pending, (state) => {
        state.loading = true;
        state.error = false;
        state.success = false;
      })
      .addCase(zohoLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.error = false;
        state.success = true;
        state.token = true;
        state.isAuthenticated = true;
        state.currentUser = action.payload.data.user || null;
        localStorage.setItem("currentUser", JSON.stringify(action.payload.data.user));
        localStorage.setItem("accessToken", action.payload.data.accessToken);
        localStorage.setItem("refreshToken", action.payload.data.refreshToken);
        toast.success(`Welcome ${action.payload.data?.user?.firstName}`);
      })
      .addCase(zohoLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.success = false;
        toast.error(action.payload || "Zoho Login Failed");
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
        state.activeBranch = null;

        // Clear session auth tokens and active branch while leaving user-scoped execution data intact
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("activeBranch");

        toast.success("Logout successfully");
      })
      .addCase(logout.rejected, (state) => {
        state.loading = false;
        state.error = true;
        state.success = false;
      });
  },
});

export const { toggleSidebarCollapsed, setDailyRevision, setGlobalSettings, setShowConsistencyModal, setGlobalSearch, setActiveBranch, setBranches, updateCurrentUser } = storeSlice.actions;
export default storeSlice.reducer;
