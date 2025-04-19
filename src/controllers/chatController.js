const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const chatWithGPT = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for TodoBeca, a scholarship platform. Provide clear and concise answers.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.data.choices[0].message.content;

    res.status(200).json({
      success: true,
      response: response,
    });
  } catch (error) {
    console.error("Error in chatWithGPT:", error);
    res.status(500).json({
      success: false,
      message: "Error processing your request",
      error: error.message,
    });
  }
};

module.exports = {
  chatWithGPT,
};
