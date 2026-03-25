## 2025-05-14 - [Centralized Loading State for Buttons]
**Learning:** Adding a standardized `isLoading` prop to core Button components ensures consistent UX across the app and reduces code duplication for managing loading icons and disabled states.
**Action:** Use the `isLoading` prop on the `Button` component for all asynchronous form submissions and actions.

## 2025-05-14 - [Button Icon Cleanup during Loading]
**Learning:** When a button contains an icon and a loading spinner is triggered, the UI can feel cluttered. Conditionally hiding the static icon when `isLoading` is true creates a smoother visual transition.
**Action:** Use `{!isLoading && <Icon />}` inside Buttons when using the `isLoading` prop.
