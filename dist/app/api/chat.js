"use strict";
const express = require('express');
const axios = require('axios');
const router = express.Router();
// Mistral API configuration
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
// Default model - change as needed based on available Mistral models
const DEFAULT_MODEL = 'mistral-medium';
// For consultant mode, you might want to use a more powerful model
const CONSULTANT_MODEL = 'mistral-large';
router.post('/', async (req, res) => {
    try {
        const { messages, isConsultantMode, projectId } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }
        // Format messages for Mistral API
        const formattedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        // Add system message based on mode
        let systemMessage = "You are a helpful AI assistant.";
        if (isConsultantMode && projectId) {
            systemMessage = `You are an expert consultant for project ${projectId}. Provide detailed, specialized advice and solutions.`;
        }
        // Add system message at the beginning
        formattedMessages.unshift({
            role: 'system',
            content: systemMessage
        });
        // Select model based on mode
        const model = isConsultantMode ? CONSULTANT_MODEL : DEFAULT_MODEL;
        // Make request to Mistral API
        const response = await axios.post(MISTRAL_API_URL, {
            model: model,
            messages: formattedMessages,
            temperature: 0.7,
            max_tokens: 2000
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            }
        });
        // Return response in format expected by frontend
        res.status(200).json({
            choices: [
                {
                    message: {
                        role: 'assistant',
                        content: response.data.choices[0].message.content
                    }
                }
            ]
        });
    }
    catch (error) {
        const axiosError = error;
        console.error('Mistral API Error:', axiosError.response?.data || axiosError.message);
        // Handle different error types
        if (axiosError.response?.status === 401) {
            return res.status(401).json({ error: 'Invalid Mistral API key' });
        }
        if (axiosError.response?.status === 429) {
            return res.status(429).json({ error: 'Rate limit exceeded for Mistral API' });
        }
        if (axiosError.response?.data?.error) {
            return res.status(axiosError.response.status || 500).json({
                error: axiosError.response.data.error.message || 'Mistral API error'
            });
        }
        res.status(500).json({ error: 'Failed to communicate with Mistral API' });
    }
});
module.exports = router;
