import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
const uiSlice = createSlice({
  name: "ui",
  initialState: { managementSection: "dashboard", sidebarOpen: false },
  reducers: {
    setManagementSection(state, action: PayloadAction<string>) {
      state.managementSection = action.payload
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload
    },
  },
})
export const { setManagementSection, setSidebarOpen } = uiSlice.actions
export default uiSlice.reducer
