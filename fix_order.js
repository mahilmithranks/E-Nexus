const fs = require('fs');
const enc = 'utf8';
const file = 'd:/Project/E-Nexus/frontend/src/components/StudentDashboard.jsx';
let c = fs.readFileSync(file, enc);

// The problem block (mixed CRLF/LF):
// Line 55-59: useEffect that calls fetchAttendanceSummary()
// Line 61-72: const fetchAttendanceSummary = ... (defined AFTER use → ReferenceError)
// Line 74-78: polling useEffect

// Strategy: Find the exact byte range and replace with clean CRLF version
// where fetchAttendanceSummary is defined BEFORE useEffect

// Find the start of the problematic block
const BLOCK_START = '    useEffect(() => {\r\n        fetchDays();\r\n        loadModels();';
const BLOCK_END_MARKER = '    }, []);\r\n';  // end of poll useEffect

const startIdx = c.indexOf(BLOCK_START);
console.log('Block start found at:', startIdx);

// Find end: after the polling useEffect }, []);
// The polling useEffect ends at line 78: "    }, []);\r\n"
// After that comes "\r\n    // Optimized Auto-refresh"
const pollEndMarker = '    }, []);\r\n\r\n    // Optimized Auto-refresh';
const endIdx = c.indexOf(pollEndMarker, startIdx);
console.log('Block end found at:', endIdx);

if (startIdx >= 0 && endIdx >= 0) {
    const endMarkerEnd = endIdx + '    }, []);\r\n'.length;

    const cleanBlock = `    const fetchAttendanceSummary = async () => {\r\n        try {\r\n            const response = await api.get('/student/attendance-summary');\r\n            if (response.data && typeof response.data.percentage === 'number') {\r\n                setAttendanceSummary(response.data);\r\n            }\r\n        } catch (err) {\r\n            console.error('Attendance summary API error:', err?.response?.status, err?.response?.data || err.message);\r\n        }\r\n    };\r\n\r\n    useEffect(() => {\r\n        fetchDays();\r\n        loadModels();\r\n        fetchAttendanceSummary();\r\n    }, []);\r\n\r\n    // Poll attendance summary every 5s for real-time updates\r\n    useEffect(() => {\r\n        const iv = setInterval(fetchAttendanceSummary, 5000);\r\n        return () => clearInterval(iv);\r\n    }, []);\r\n`;

    c = c.substring(0, startIdx) + cleanBlock + c.substring(endMarkerEnd);
    console.log('✅ Block replaced cleanly');
} else {
    console.log('❌ Could not find block, trying alternative...');
    // Just show what's around the area
    if (startIdx >= 0) {
        console.log('Content from start to +500:', JSON.stringify(c.substring(startIdx, startIdx + 500)));
    }
    console.log('pollEndMarker found:', c.indexOf(pollEndMarker));
}

fs.writeFileSync(file, c, enc);

// Verify
const v = fs.readFileSync(file, enc);
const fnIdx = v.indexOf('const fetchAttendanceSummary');
const useIdx = v.indexOf('fetchAttendanceSummary()');
console.log('\n=== Verification ===');
console.log('fetchAttendanceSummary defined at index:', fnIdx);
console.log('fetchAttendanceSummary() called at index:', useIdx);
console.log('Function defined BEFORE call:', fnIdx < useIdx);
console.log('No extra indent (4 spaces only):', v.includes('    const fetchAttendanceSummary'));
console.log('No error catch zero state:', !v.includes('prev ?? { attended: 0'));
