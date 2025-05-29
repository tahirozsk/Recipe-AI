RecipeFinder Backend
RecipeFinder is an AI-powered recipe suggestion backend built with Node.js, Express, and OpenAI's GPT-4o model. It allows users to input ingredients and receive tailored recipe suggestions, prioritizing Turkish cuisine. The application also includes a chat feature for interacting with an AI cooking assistant.
Table of Contents

Features
Prerequisites
Installation
Configuration
Usage
API Endpoints
Project Structure
Scripts
Contributing
License

Features

Recipe Suggestions: Generate up to three recipe ideas based on user-provided ingredients, including recipe name, ingredients, instructions, estimated calories, portion size, preparation time, and health rating.
AI Chat Assistant: Engage with an AI assistant for cooking tips, techniques, and nutritional advice, tailored to Turkish cuisine.
Rate Limiting: Prevents abuse by limiting API requests per IP address.
CORS Support: Configurable Cross-Origin Resource Sharing for secure frontend integration.
Error Handling: Robust error handling for invalid inputs, timeouts, and API errors.
Health Check: Endpoint to verify server status and configuration.

Prerequisites

Node.js: Version >= 18.0.0
npm: Version >= 9.0.0
OpenAI API Key: Required for accessing GPT-4o model
Git: For cloning the repository

Installation

Clone the Repository
cd Receipe-AI


Install Dependencies:
npm install


Set Up Environment Variables:Create a .env file in the project root and configure it based on the provided .env example:
# RecipeFinder Environment Variables
OPENAI_API_KEY=your_openai_api_key_here
PORT=""
NODE_ENV=development
RATE_LIMIT_WINDOW=""
RATE_LIMIT_MAX=10
ALLOWED_ORIGINS=""
SESSION_SECRET=your_session_secret_here



Configuration

OpenAI API Key: Obtain from OpenAI and add to .env.
CORS: Update ALLOWED_ORIGINS in .env to include frontend URLs.
Rate Limiting: Adjust RATE_LIMIT_WINDOW (in milliseconds) and RATE_LIMIT_MAX (max requests per window) as needed.
Port: Change PORT in .env if you need a different port.

Usage

Start the Server:
For production:npm start
For development with auto-restart:npm run dev

Interact with the API:

Recipe Suggestions: Send a POST request to /api/suggest-recipes with a JSON body containing an array of ingredients:{
  "ingredients": ["domates", "salatalık", "zeytinyağı"]
}
Chat Assistant: Send a POST request to /api/chat with a JSON body containing a message:{
  "message": "Zeytinyağlı yaprak sarma nasıl yapılır?"
}

API Endpoints

GET /api/health
Returns server status and configuration details.
Response:{
  "status": "OK",
  "timestamp": "2025-05-29T17:40:00.000Z",
  "version": "1.0.0",
  "openaiConfigured": true,
  "server": "RecipeFinder Backend"
}

POST /api/suggest-recipes
Generates recipe suggestions based on provided ingredients.
Request Body:{
  "ingredients": ["ingredient1", "ingredient2", ...]
}

Response:{
  "recipes": [
    {
      "name": "Yemek Adı",
      "ingredients": ["Malzeme 1", "Malzeme 2"],
      "instructions": ["Adım 1", "Adım 2"],
      "calories": 500,
      "portions": 4,
      "prepTime": 30,
      "healthRating": 8
    },
    ...
  ],
  "timestamp": "2025-05-29T17:40:00.000Z"
}
POST /api/chat
Interacts with the AI cooking assistant.
Request Body:{
  "message": "Your question or request"
}
Response:{
  "response": "AI response text",
  "timestamp": "2025-05-29T17:40:00.000Z"
}

Project Structure
recipefinder-backend/
├── .env                # Environment variables
├── package.json        # Project metadata and dependencies
├── server.js           # Main server file
├── recipe_finder.html  # Frontend HTML
├── public/             # Static assets
└── node_modules/       # Installed dependencies

Scripts
npm start: Runs the server in production mode.
npm run dev: Runs the server with nodemon for development.
npm test: Runs tests using Jest.
npm run lint: Lints code using ESLint.
npm run format: Formats code using Prettier.

Contributing
Fork the repository.
Create a new branch (git checkout -b feature/your-feature).
Make your changes and commit (git commit -m "Add your feature").
Push to the branch (git push origin feature/your-feature).
Create a pull request.

License
This project is licensed under the MIT License. See the LICENSE file for details.
