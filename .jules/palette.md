## 2024-05-24 - [Add isLoading to Button component]
**Learning:** Accessible and consistent loading states on interactive elements prevent double submissions and provide immediate feedback to users, making the app feel more responsive.
**Action:** Centralized the loading state pattern inside the base UI `Button` component rather than having individual consumers implement their own loading spinners, which improves reusability and accessibility across the application.
