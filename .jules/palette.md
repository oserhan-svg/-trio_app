## 2026-07-16 - Accessibility: Missing ARIA labels in AppShell icon-buttons
**Learning:** AppShell contains icon-only buttons (Menu toggle, Notifications) that lack 'aria-label' and 'title' attributes, making them inaccessible to screen readers. Focus styles ('focus-visible') are also missing for keyboard navigation.
**Action:** Add 'aria-label' and 'title' (in Turkish, e.g. 'Bildirimler', 'Menüyü aç/kapat') and standard 'focus-visible:ring-2 focus-visible:ring-blue-500' to interactive elements for better keyboard and screen-reader support.
