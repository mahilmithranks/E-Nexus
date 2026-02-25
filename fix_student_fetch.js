const fs = require('fs');
const enc = 'utf8';
const file = 'd:/Project/E-Nexus/frontend/src/components/StudentDashboard.jsx';
let c = fs.readFileSync(file, enc);

// Change {attendanceSummary !== null && (...)} to always show with a loading fallback
// Find and replace the condition to also handle undefined/null gracefully
c = c.replace(
    '{attendanceSummary !== null && (',
    '{/* Overall Attendance - show loading state until data arrives */\n                            true && ('
);
// Now wrap the percentage access only when attendanceSummary exists
// Actually simpler: keep the condition but add attendanceSummary initializer  
// Let's instead ensure fetchAttendanceSummary always sets state even on error

// Better approach: init attendanceSummary as {} instead of null so card always shows
// But we need percentage etc. Let's keep null guard but log errors properly

// Revert the "true &&" change if it happened
c = c.replace(
    '{/* Overall Attendance - show loading state until data arrives */\n                            true && (',
    '{attendanceSummary !== null && ('
);

// The issue is likely the API is throwing a 401/403 (unauthorized) or the request fails
// Let's make fetchAttendanceSummary log the full error
const oldFetch = `    const fetchAttendanceSummary = async () => {
        try {
            const response = await api.get('/student/attendance-summary');
            setAttendanceSummary(response.data);
        } catch (err) {
            console.warn('Could not fetch attendance summary:', err);
        }
    };`;

const newFetch = `    const fetchAttendanceSummary = async () => {
        try {
            const response = await api.get('/student/attendance-summary');
            if (response.data && typeof response.data.percentage === 'number') {
                setAttendanceSummary(response.data);
            }
        } catch (err) {
            console.error('Attendance summary fetch failed:', err?.response?.status, err?.response?.data || err.message);
            // On error, show a zero state so card is visible
            setAttendanceSummary(prev => prev ?? { attended: 0, total: 0, percentage: 0, sessionBreakdown: [] });
        }
    };`;

if (c.includes(oldFetch.replace(/\r\n/g, '\n'))) {
    c = c.replace(oldFetch.replace(/\r\n/g, '\n'), newFetch);
    console.log('✅ Fetch updated (LF)');
} else if (c.includes(oldFetch)) {
    c = c.replace(oldFetch, newFetch);
    console.log('✅ Fetch updated');
} else {
    // Regex approach
    c = c.replace(
        /const fetchAttendanceSummary = async \(\) => \{\s*try \{\s*const response = await api\.get\('\/student\/attendance-summary'\);\s*setAttendanceSummary\(response\.data\);\s*\} catch \(err\) \{\s*console\.warn\('Could not fetch attendance summary:', err\);\s*\}\s*\};/,
        newFetch
    );
    console.log('Applied fetchAttendanceSummary update via regex');
}

// Also: change initial state to trigger immediate visibility
// Instead of useState(null), use useState(undefined) for loading distinction
// And show loading placeholder when undefined, card when object

// Change the null check to also handle undefined
c = c.replace(
    '{attendanceSummary !== null && (',
    '{attendanceSummary != null && ('
);
console.log('Changed to != null (allows both null and undefined to hide, but once set shows)');

fs.writeFileSync(file, c, enc);

// Verify
const v = fs.readFileSync(file, enc);
console.log('\nFetch updated:', v.includes('Attendance summary fetch failed'));
console.log('null check:', v.includes('attendanceSummary != null'));
