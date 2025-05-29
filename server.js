const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// OpenAI Configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS.split(','),
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Serve static files
app.use(express.static('public'));
app.use(express.static('.'));

// Rate limiting
const rateLimit = {};
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW) || 900000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 10;

function checkRateLimit(ip) {
    const now = Date.now();
    if (!rateLimit[ip]) {
        rateLimit[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
        return true;
    }
    if (now > rateLimit[ip].resetTime) {
        rateLimit[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
        return true;
    }
    if (rateLimit[ip].count >= RATE_LIMIT_MAX) {
        return false;
    }
    rateLimit[ip].count++;
    return true;
}

// Custom timeout wrapper
const withTimeout = (promise, ms) => {
    const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]);
};

// Serve main HTML
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'recipe_finder.html'));
    } catch (error) {
        console.error('Error serving HTML:', error);
        res.status(500).json({
            error: 'Cannot load the main page',
            timestamp: new Date().toISOString()
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        openaiConfigured: !!process.env.OPENAI_API_KEY,
        server: 'RecipeFinder Backend'
    });
});

// Recipe suggestion endpoint
app.post('/api/suggest-recipes', async (req, res) => {
    try {
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        if (!checkRateLimit(clientIP)) {
            return res.status(429).json({
                error: 'Rate limit exceeded. Please try again later.',
                timestamp: new Date().toISOString()
            });
        }

        const { ingredients } = req.body;
        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({
                error: 'Lütfen en az bir malzeme girin.',
                timestamp: new Date().toISOString()
            });
        }

        const prompt = `
        Kullanıcı şu malzemelere sahip: ${ingredients.join(', ')}. 
        Bu malzemelerle yapılabilecek 3 farklı yemek tarifi öner. Her tarif için:
        - Yemek adı (Türkçe)
        - Malzemeler listesi
        - Adım adım tarif
        - Tahmini kalori (toplam, kcal)
        - Porsiyon sayısı
        - Hazırlık süresi (dakika)
        - Sağlık puanı (1-10)
        - Türk mutfağına uygun öneriler önceliklendir.
        Yanıtı şu JSON formatında ver:
        {
            "recipes": [
                {
                    "name": "Yemek adı",
                    "ingredients": ["Malzeme 1", "Malzeme 2", ...],
                    "instructions": ["Adım 1", "Adım 2", ...],
                    "calories": number,
                    "portions": number,
                    "prepTime": number,
                    "healthRating": number
                },
                ...
            ]
        }
        `;

        const response = await withTimeout(
            openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 2000,
                temperature: 0.5
            }),
            30000
        );

        const aiResponse = response.choices[0].message.content;
        let recipes;
        try {
            const cleanResponse = aiResponse.replace(/```json\s*|\s*```/g, '').trim();
            recipes = JSON.parse(cleanResponse);
            if (!recipes.recipes || !Array.isArray(recipes.recipes)) {
                throw new Error('Invalid recipes array');
            }
        } catch (error) {
            console.error('JSON Parse Error:', error);
            return res.status(500).json({
                error: 'Tarifler işlenirken hata oluştu.',
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            recipes: recipes.recipes,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Recipe Suggestion Error:', error);
        let errorMessage = 'Tarif önerisi alınamadı.';
        let statusCode = 500;
        if (error.message.includes('timed out')) {
            errorMessage = 'API isteği zaman aşımına uğradı.';
            statusCode = 504;
        } else if (error.response?.status === 429) {
            errorMessage = 'API kullanım limitine ulaşıldı.';
            statusCode = 429;
        }
        res.status(statusCode).json({
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        if (!checkRateLimit(clientIP)) {
            return res.status(429).json({
                error: 'Rate limit exceeded. Please try again later.',
                timestamp: new Date().toISOString()
            });
        }

        const { message } = req.body;
        if (!message || message.trim() === '') {
            return res.status(400).json({
                error: 'Mesaj boş olamaz.',
                timestamp: new Date().toISOString()
            });
        }

        const response = await withTimeout(
            openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `Sen RecipeFinder AI asistanısın. Kullanıcılara yemek tarifleri, pişirme teknikleri ve beslenme konusunda Türkçe, samimi ve profesyonel yanıtlar ver. Türk mutfağına odaklan, pratik öneriler sun ve motive edici ol.`
                    },
                    { role: 'user', content: message }
                ],
                max_tokens: 800,
                temperature: 0.7
            }),
            30000
        );

        res.json({
            response: response.choices[0].message.content,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({
            error: 'Sohbet sırasında hata oluştu.',
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 RecipeFinder Server started on http://localhost:${PORT}`);
    console.log('✅ OpenAI API key:', process.env.OPENAI_API_KEY ? 'Configured' : 'Missing');
});