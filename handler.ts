"use strict";

import { ErrorHandler, RequestHandler, SkillBuilders } from "ask-sdk";
import { IntentRequest } from "ask-sdk-model";
import { Configuration, OpenAIApi } from "openai";
const config = new Configuration({
  organization: process.env.OPENAI_ORGANIZATION,
  apiKey: process.env.OPENAI_API_KEY,
});

const openaiApiClient = new OpenAIApi(config);

const ChatGptHandler: RequestHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "askChatGpt"
    );
  },

  async handle(handlerInput) {
    const handlerInputIntent = (
      handlerInput.requestEnvelope.request as IntentRequest
    ).intent;
    const queryValue = handlerInputIntent?.slots?.query?.value;
    if (queryValue) {
      console.log("input is", queryValue);
      const result = await openaiApiClient.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: queryValue }],
      });
      console.log("result is", result?.data?.choices[0]?.message?.content);
      return handlerInput.responseBuilder
        .speak(result?.data?.choices[0]?.message?.content || "Result Error")
        .withSimpleCard(
          "GPT says",
          result?.data?.choices[0]?.message?.content || "Result Error"
        )
        .getResponse();
    }
    return handlerInput.responseBuilder
      .speak("Missing query term")
      .withSimpleCard("Missing query Term", "Missing Query Term")
      .getResponse();
  },
};

const ErrorHandler: ErrorHandler = {
  canHandle() {
    return true;
  },

  handle(input, error) {
    console.log(`Handling error: ${error}`);
    return input.responseBuilder
      .speak("Sorry, I can't understand that")
      .reprompt("Please say it again")
      .getResponse();
  },
};

const LaunchRequestHandler: RequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "LaunchRequest";
  },
  handle(handlerInput) {
    const speechText = "Welcome to ChatGPT, you can ask me anything";
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard("AlexaGPT", speechText)
      .getResponse();
  },
};

export const callGpt = SkillBuilders.custom()
  .addRequestHandlers(ChatGptHandler, LaunchRequestHandler)
  .addErrorHandlers(ErrorHandler)
  .lambda();
