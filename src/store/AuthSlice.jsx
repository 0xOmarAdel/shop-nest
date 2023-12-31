import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { cartActions, getCartItems } from "./cart-slice";
import { getWishlistItems, wishlistActions } from "./WishlistSlice";
import { toast } from "react-toastify";

const initialAuthState = {
  isAuthenticated: false,
};

export const login = createAsyncThunk(
  "authentication/login",
  async ({ email, password }) => {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      toast.info("Welcome back!");
      return !!userCredential.user;
    } catch (error) {
      const errorMessage = error.message
        ? error.message
            .replace("Firebase: Error (auth/", "")
            .replace(")", "")
            .replace(/-/g, " ")
        : "An error ocurred!";

      const capitalizedError =
        errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);

      toast.error(capitalizedError);

      return false;
    }
  }
);

export const logout = createAsyncThunk(
  "authentication/logout",
  async (params, thunkAPI) => {
    try {
      const auth = getAuth();
      auth.signOut();

      thunkAPI.dispatch(cartActions.emptyCart());
      thunkAPI.dispatch(wishlistActions.emptyWishlist());
      toast.info("You've logged out successfully!");

      return false;
    } catch (error) {
      toast.error("An error occurred!");

      return true;
    }
  }
);

export const autoLogin = createAsyncThunk(
  "authentication/autoLogin",
  async (params, thunkAPI) => {
    try {
      thunkAPI.dispatch(getCartItems());
      thunkAPI.dispatch(getWishlistItems());

      return true;
    } catch (error) {
      toast.error("An error occurred!");

      return false;
    }
  }
);

const authSlice = createSlice({
  name: "authentication",
  initialState: initialAuthState,
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, (state, action) => {
        state.isAuthenticated = action.payload;
      })
      .addCase(logout.fulfilled, (state, action) => {
        state.isAuthenticated = action.payload;
      })
      .addCase(autoLogin.fulfilled, (state, action) => {
        state.isAuthenticated = action.payload;
      });
  },
});

export const authActions = authSlice.actions;

export default authSlice.reducer;
