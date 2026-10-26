## 2024-10-27 - Icon-only Buttons Localization Pattern
**Learning:** Icon-only buttons (like delete 'X' buttons in `FilterBar` and `PropertyDetailModal`) were missing text alternatives. The app is localized in Turkish, so providing standard Turkish translations ("Sil", "Kapat", "Filtreyi kaldır") for ARIA labels and titles matches the existing app localization pattern perfectly.
**Action:** Always provide ARIA labels and hover titles in Turkish (e.g. 'Kapat', 'Sil') for new icon-only actionable elements to maintain consistent UX and accessibility across the interface.
