require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const stateCoords = {
    "Maharashtra": { lat: 19.7515, lng: 75.7139 },
    "Delhi": { lat: 28.7041, lng: 77.1025 },
    "Uttar Pradesh": { lat: 26.8467, lng: 80.9462 },
    "Tamil Nadu": { lat: 11.1271, lng: 78.6569 },
    "Telangana": { lat: 18.1124, lng: 79.0193 },
    "Karnataka": { lat: 15.3173, lng: 75.7139 },
    "West Bengal": { lat: 22.9868, lng: 87.8550 },
    "None": { lat: 20.5937, lng: 78.9629 }
};

const instCoords = {
    "Visvesvaraya National Institute of Technology, Nagpur": { lat: 21.1233, lng: 79.0028 },
    "National Institute of Technology, Tiruchirappalli": { lat: 10.7628, lng: 78.8165 },
    "National Institute of Technology, Warangal": { lat: 17.9835, lng: 79.5305 },
    "National Institute of Technology Karnataka, Surathkal": { lat: 13.0108, lng: 74.7943 },
    "Motilal Nehru National Institute of Technology Allahabad": { lat: 25.4935, lng: 81.8624 },
    "National Institute of Technology Delhi": { lat: 28.8431, lng: 77.1049 },
    "Sardar Vallabhbhai National Institute of Technology, Surat": { lat: 21.1667, lng: 72.7833 },
    "Malaviya National Institute of Technology Jaipur": { lat: 26.8627, lng: 75.8105 },
    "Maulana Azad National Institute of Technology Bhopal": { lat: 23.2146, lng: 77.4054 },
    "National Institute of Technology Durgapur": { lat: 23.5480, lng: 87.2931 },
    "Indian Institute of Technology Bombay": { lat: 19.1334, lng: 72.9133 },
    "Indian Institute of Technology Delhi": { lat: 28.5450, lng: 77.1926 }
};

const stateToInstituteMap = {
    "Maharashtra": ["Visvesvaraya National Institute of Technology, Nagpur"],
    "Tamil Nadu": ["National Institute of Technology, Tiruchirappalli"],
    "Telangana": ["National Institute of Technology, Warangal"],
    "Karnataka": ["National Institute of Technology Karnataka, Surathkal"],
    "Uttar Pradesh": ["Motilal Nehru National Institute of Technology Allahabad"],
    "Delhi": ["National Institute of Technology Delhi"],
    "Gujarat": ["Sardar Vallabhbhai National Institute of Technology, Surat"],
    "Rajasthan": ["Malaviya National Institute of Technology Jaipur"],
    "Madhya Pradesh": ["Maulana Azad National Institute of Technology Bhopal"],
    "West Bengal": ["National Institute of Technology Durgapur"],
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lat2) return null;
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
};

app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
        const query = `INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email;`;
        const { rows } = await pool.query(query, [email, password]);
        res.json({ message: 'User created successfully', user: rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Server error during signup' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
        const query = `SELECT * FROM users WHERE email = $1 AND password = $2;`;
        const { rows } = await pool.query(query, [email, password]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
        res.json({ message: 'Login successful', user: { id: rows[0].id, email: rows[0].email } });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.post('/api/discover-colleges', async (req, res) => {
    const { category, gender, rank, homeState, instituteType = 'ALL', round = 6, page = 1, limit = 20 } = req.body;

    if (!category || !gender || !rank || !homeState) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const offset = (page - 1) * limit;
    const homeInstitutes = stateToInstituteMap[homeState] || [];
    const homeLocation = stateCoords[homeState] || stateCoords["None"];

    let typeCondition = "";
    if (instituteType === "IIT") typeCondition = "AND institute LIKE 'Indian Institute of Technology%' AND institute NOT LIKE '%Information%'";
    else if (instituteType === "NIT") typeCondition = "AND institute LIKE 'National Institute of Technology%'";
    else if (instituteType === "IIIT") typeCondition = "AND institute LIKE 'Indian Institute of Information Technology%'";

    try {
        const query = `
            WITH CourseStats AS (
                SELECT 
                    institute, 
                    program, 
                    quota,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY crank) AS median_cutoff,
                    COALESCE(STDDEV(crank), 0) AS cutoff_stddev,
                    AVG(crank) AS avg_cutoff
                FROM josaa_cutoffs
                WHERE category = $1 AND gender = $2 AND round = $3
                ${typeCondition}
                AND (
                    quota = 'AI' 
                    OR (quota = 'HS' AND institute = ANY($4::text[]))
                    OR (quota = 'OS' AND NOT (institute = ANY($4::text[])))
                )
                GROUP BY institute, program, quota
            ),
            CrowdStats AS (
                SELECT institute, program, COUNT(DISTINCT user_id) as active_savers
                FROM saved_preferences
                GROUP BY institute, program
            )
            SELECT 
                cs.*, 
                CASE WHEN cs.avg_cutoff = 0 THEN 0 ELSE (cs.cutoff_stddev / cs.avg_cutoff) * 100 END AS volatility_percent,
                COALESCE(cr.active_savers, 0) AS active_savers
            FROM CourseStats cs
            LEFT JOIN CrowdStats cr ON cs.institute = cr.institute AND cs.program = cr.program
            WHERE cs.median_cutoff >= $5
            ORDER BY cs.median_cutoff ASC
            LIMIT $6 OFFSET $7;
        `;
        
        const targetRank = Math.floor(rank * 0.8);
        const { rows } = await pool.query(query, [category, gender, round, homeInstitutes, targetRank, limit, offset]);

        const categorizedResults = rows.map(course => {
            let band = 'Target';
            if (course.median_cutoff >= rank + 2000) band = 'Safe';
            else if (course.median_cutoff < rank) band = 'Reach';

            let volLabel = '🟡 Moderate';
            let volColor = '#ca8a04';
            let volBg = '#fef9c3';
            if (course.volatility_percent < 5) { volLabel = '🟢 Stable'; volColor = '#16a34a'; volBg = '#dcfce7'; } 
            else if (course.volatility_percent > 15) { volLabel = '🔴 Volatile'; volColor = '#dc2626'; volBg = '#fee2e2'; }

            const instLocation = instCoords[course.institute];
            const distance = instLocation ? calculateDistance(homeLocation.lat, homeLocation.lng, instLocation.lat, instLocation.lng) : null;

            return {
                institute: course.institute,
                program: course.program,
                quota: course.quota,
                median_cutoff: Math.round(course.median_cutoff),
                band: band,
                volatility_percent: Math.round(course.volatility_percent * 10) / 10,
                volatility_label: volLabel,
                volatility_color: volColor,
                volatility_bg: volBg,
                distance_km: distance,
                active_savers: parseInt(course.active_savers)
            };
        });

        res.json({ results: categorizedResults, currentPage: page, resultsCount: categorizedResults.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to discover colleges' });
    }
});

app.post('/api/trends', async (req, res) => {
    const { institute, program, category, gender, quota } = req.body;
    try {
        const query = `SELECT year, crank AS closing_rank FROM josaa_cutoffs WHERE institute = $1 AND program = $2 AND category = $3 AND gender = $4 AND quota = $5 ORDER BY year ASC;`;
        const { rows } = await pool.query(query, [institute, program, category, gender, quota]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trends' });
    }
});

app.get('/api/cart/:userId', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM saved_preferences WHERE user_id = $1 ORDER BY created_at ASC', [req.params.userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

app.post('/api/cart', async (req, res) => {
    const { user_id, institute, program, quota, median_cutoff, distance_km } = req.body;
    try {
        const query = `INSERT INTO saved_preferences (user_id, institute, program, quota, median_cutoff) VALUES ($1, $2, $3, $4, $5) RETURNING *;`;
        const { rows } = await pool.query(query, [user_id, institute, program, quota, median_cutoff]);
        const result = rows[0];
        result.distance_km = distance_km;
        res.json(result);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Choice already saved' });
        res.status(500).json({ error: 'Failed to save choice' });
    }
});

app.delete('/api/cart', async (req, res) => {
    const { user_id, institute, program } = req.body;
    try {
        const query = `DELETE FROM saved_preferences WHERE user_id = $1 AND institute = $2 AND program = $3;`;
        await pool.query(query, [user_id, institute, program]);
        res.json({ message: 'Removed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove choice' });
    }
});

app.get('/api/institutes', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT DISTINCT institute FROM josaa_cutoffs ORDER BY institute ASC');
        res.json(rows.map(row => row.institute));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch institutes' });
    }
});

app.post('/api/programs', async (req, res) => {
    const { institute } = req.body;
    try {
        const { rows } = await pool.query('SELECT DISTINCT program FROM josaa_cutoffs WHERE institute = $1 ORDER BY program ASC', [institute]);
        res.json(rows.map(row => row.program));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch programs' });
    }
});

app.post('/api/predict', async (req, res) => {
    const { institute, program, category, gender, rank } = req.body;
    try {
        const query = `SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY crank) AS median_cutoff FROM josaa_cutoffs WHERE institute = $1 AND program = $2 AND category = $3 AND gender = $4`;
        const { rows } = await pool.query(query, [institute, program, category, gender]);
        if (!rows[0].median_cutoff) return res.json({ result: 'No historical data found for this specific combination.' });
        const medianCutoff = Math.round(rows[0].median_cutoff);
        let band = 'Target';
        if (medianCutoff >= rank + 2000) band = 'Safe';
        else if (medianCutoff < rank) band = 'Reach';
        res.json({ medianCutoff, band, message: `Your rank is ${rank}. The median historical cutoff is ${medianCutoff}.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to predict admission chance' });
    }
});

app.listen(port, () => {
    console.log(`EduCompass Pro API server is running on http://localhost:${port}`);
});