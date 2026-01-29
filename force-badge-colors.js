// Force Sahibinden Badge Styling - Run this in browser console
// This will immediately apply yellow background to all Sahibinden badges

(function () {
    console.log('🎨 Forcing Sahibinden badge colors...');

    // Find all spans that might be Sahibinden badges
    const badges = document.querySelectorAll('span');
    let count = 0;

    badges.forEach(badge => {
        const text = badge.textContent.trim().toUpperCase();
        const classes = badge.className || '';
        const hasYellowClass = classes.includes('yellow');
        const hasSahibindenClass = classes.includes('sahibinden');
        const isSahibindenText = text.includes('SAHİBİNDEN') || text.includes('SAHIBINDEN');

        // Check if this is likely a Sahibinden badge
        if (hasYellowClass || hasSahibindenClass || isSahibindenText) {
            // Force yellow background and black text
            badge.style.backgroundColor = '#ffdb15';
            badge.style.color = '#000';
            badge.style.borderColor = '#f59e0b';

            // Add class for CSS targeting
            badge.classList.add('sahibinden-badge');

            count++;
            console.log(`✓ Updated badge: "${text.substring(0, 30)}..."`);
        }
    });

    console.log(`✅ Updated ${count} Sahibinden badges to yellow (#ffdb15)`);
    console.log('If you still see different colors, the badges might be re-rendered by React.');
    console.log('In that case, restart the dev server with: npm run dev');
})();
