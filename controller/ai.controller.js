//AI USING MISTRAL 

// server/controllers/ai.controller.js
const OpenAI = require('openai');
const dotenv = require("dotenv");
const AIMessage = require("../models/aiMessage.model");
const Message = require("../models/message.model");
dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000", // Sesuaikan dengan URL frontend
    "X-Title": process.env.SITE_NAME || "Collabify", // Nama aplikasi
  },
});

// Konfigurasi model
const generationConfig = {
  temperature: 0.7, // Sedikit kreativitas, bisa disesuaikan
  max_tokens: 8192, // Maksimum token, sesuai Gemini sebelumnya
};

// In-memory session cache (untuk riwayat percakapan)
const userSessions = {};

const instruction = {
  role: "system",
  content: `You are a programming error-solving expert. Your goal is to provide accurate, beginner-friendly, and concise answers to programming errors based on verified knowledge.
  Follow these strict guidelines to avoid hallucination:
  1. Rely solely on verified programming knowledge. Do not invent solutions or details.
  2. If you lack sufficient information to answer accurately, say: "I don’t have enough information to answer accurately. Please provide more details or a code snippet."
  3. For each response, include:
     - A brief explanation of the error.
     - A corrected code example (if applicable).
     - A question asking if the user needs further clarification.
  4. For follow-up questions, reference the original error and prior responses in the conversation history to maintain context.
  5. Avoid jargon and ensure explanations are clear for beginners.
  6. Support all major programming languages (e.g., Python, JavaScript, Java, C++).
  7. If the query involves deprecated methods, note this and suggest modern alternatives only if certain.`,
};


const askAI = async (req, res) => {
  const { prompt, user_id, chatId } = req.body;

  if (!prompt) {
    console.log('Missing prompt in request');
    return res.status(400).json({ error: "Prompt is required" });
  }

  const identifier = user_id ;
  console.log('AI Request:', { identifier, prompt });

  try {
    // Inisialisasi sesi jika belum ada
    if (!userSessions[identifier]) {
      console.log('Starting new session for:', identifier);
      userSessions[identifier] = [{ role: "system", content: instruction.content }];
    }

    // Tambahkan prompt ke riwayat
    userSessions[identifier].push({ role: "user", content: prompt });

    // Kirim ke OpenRouter
    console.log('Sending to OpenRouter:', userSessions[identifier]);
    const completion = await openai.chat.completions.create({
      model: "mistralai/devstral-small:free",
      messages: userSessions[identifier],
      ...generationConfig,
    });

    const aiReply = completion.choices[0].message.content;
    console.log('AI Reply:', aiReply);

    // Tambahkan respons AI ke riwayat
    userSessions[identifier].push({ role: "assistant", content: aiReply });


    if(chatId){
      const messageObj = {
        sender: user_id, // ID user yang mengirim pesan
        isAi: false,
        chat: chatId, // ID chat yang terkait
        message: prompt, 
      };

        // Simpan USER input juga
      let userInputMessage = await Message.create(messageObj);

      let userMsgPopulated = await Message.findById(userInputMessage._id)
        .populate("chat")
        .populate("sender")

      const io = req.app.get("io");
      io.to(req.body.user_id).emit("message recieved", userMsgPopulated);
      
     const aiMessageObj = {
        sender: null,
        isAi: true,
        receiver: user_id,
        chat: chatId,
        message: aiReply,
     }
      let newMessage = await Message.create(aiMessageObj);

      const fullMessage = await Message.findById(newMessage._id)
        .populate("chat")
        // .populate("sender")
        .populate("receiver");

     // const io = req.app.get("io");
      io.to(req.body.user_id).emit("message recieved", fullMessage);
    }

    return res.json({ reply: aiReply });
  } catch (error) {
    console.error("AI error:", error.message || error);
    return res.status(500).json({ error: "Something went wrong with AI service" });
  }
};

module.exports = { askAI };





//AI USING GEMINI

// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const dotenv = require("dotenv");
// const AIMessage = require("../models/aiMessage.model");
// dotenv.config();

// // Inisialisasi SDK
// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// // Konfigurasi model dan pengaturan
// const generationConfig = {
//   temperature: 0,
//   topP: 0.95,
//   topK: 64,
//   maxOutputTokens: 8192,
// };

// const safetySettings = [
//   { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
//   { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
//   { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
//   { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
// ];

// // In-memory session cache
// const userSessions = {};

// const instruction = {
//   role: "system",
//   parts: [
//     {
//       text: `You are a programming error-solving expert. Your goal is to provide accurate, beginner-friendly, and concise answers to programming errors based on verified knowledge.
//       Follow these strict guidelines to avoid hallucination:
//       1. Rely solely on verified programming knowledge. Do not invent solutions or details.
//       2. If you lack sufficient information to answer accurately, say: "I don’t have enough information to answer accurately. Please provide more details or a code snippet."
//       3. For each response, include:
//         - A brief explanation of the error.
//         - A corrected code example (if applicable).
//         - A question asking if the user needs further clarification.
//       4. For follow-up questions, reference the original error and prior responses in the conversation history to maintain context.
//       5. Avoid jargon and ensure explanations are clear for beginners.
//       6. Support all major programming languages (e.g., Python, JavaScript, Java, C++).
//       7. If the query involves deprecated methods, note this and suggest modern alternatives only if certain.`,
//     }
//   ]
// };
// const askAI = async (req, res) => {
//   const { prompt, user_id } = req.body;

//   if (!prompt || !user_id) {
//     return res.status(400).json({ error: "Prompt and userId are required" });
//   }

//   try {
//     // Gunakan model Gemini
//     const model = genAI.getGenerativeModel({
//       model: "gemini-1.5-flash",
//       generationConfig,
//       safetySettings,
//     });

//     // Buat session baru kalau user belum punya
//     if (!userSessions[user_id]) {
//       userSessions[user_id] = await model.startChat({ history: [], systemInstruction:instruction, });
//     }

//     const session = userSessions[user_id];

//     // Kirim prompt ke AI
//     const result = await session.sendMessage(prompt);
//     const aiReply = result.response.text();

//     // Simpan ke database (jika diperlukan)
//     const saved = await AIMessage.create({
//       user: user_id,
//       prompt,
//       reply: aiReply,
//     });

//     return res.json(saved); // atau bisa: res.json({ reply: aiReply });
//   } catch (error) {
//     console.error("AI error:", error.message || error);
//     return res.status(500).json({ error: "Something went wrong with AI service" });
//   }
// };

// module.exports = { askAI };

