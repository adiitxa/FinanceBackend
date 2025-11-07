const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Expense = require('../models/Expense');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    // Parse the message using Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    Analyze this finance-related message and return JSON in this exact format:
    {
      "type": "expense" or "transaction",
      "amount": number,
      "category": "food/travel/shopping/entertainment/bills/other",
      "description": string,
      "person": string (only for transactions),
      "transactionType": "credit/debit" (only for transactions)
    }
    
    Message: "${message}"
    
    Examples:
    - "spent 50 rs for lunch" -> {"type": "expense", "amount": 50, "category": "food", "description": "lunch"}
    - "mohit gave me 250 recharge" -> {"type": "transaction", "amount": 250, "person": "mohit", "transactionType": "credit", "description": "mobile recharge"}
    - "bought eggs for arjun worth 100" -> {"type": "transaction", "amount": 100, "person": "arjun", "transactionType": "debit", "description": "purchased eggs"}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse response');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);

    let savedItem;
    
    if (parsedData.type === 'expense') {
      savedItem = await Expense.create({
        user: userId,
        amount: parsedData.amount,
        category: parsedData.category,
        description: parsedData.description,
        date: new Date()
      });
    } else if (parsedData.type === 'transaction') {
      savedItem = await Transaction.create({
        user: userId,
        person: parsedData.person,
        amount: parsedData.amount,
        type: parsedData.transactionType,
        description: parsedData.description,
        date: new Date()
      });
    }

    res.json({
      response: `Added: ${parsedData.description} - ₹${parsedData.amount}`,
      data: savedItem
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Error processing message' });
  }
});

module.exports = router;