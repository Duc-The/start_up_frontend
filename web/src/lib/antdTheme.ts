import type { ThemeConfig } from "antd"
export const antdTheme: ThemeConfig = {
  token: {
    controlOutline: "rgba(32, 102, 65, 0.15)",
    colorPrimaryHover: "#397c51",
    colorPrimaryActive: "#174d30",
    controlHeight: 40,
    controlHeightSM: 30,
    colorPrimary: "#206641",
    colorText: "#20362c",
    colorBorder: "#e2e7e2",
    borderRadius: 7,
    fontFamily: '"Geist Variable",sans-serif',
    fontSize: 13,
  },
  components: {
    Select: {
      optionSelectedBg: "#e7f1e5",
      optionSelectedColor: "#205234",
      optionActiveBg: "#f1f6ee",
      activeBorderColor: "#397c51",
      hoverBorderColor: "#8eae94",
      activeOutlineColor: "rgba(32,102,65,.12)",
    },
    Table: { headerBg: "#fafbf8", rowHoverBg: "#f6f9f2", cellPaddingBlock: 18 },
  },
}
