import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import OpenAI from "openai";
import { ConversationalAgent } from "./agents/conversationalAgent";
import { AgentsType } from "./types";

export const elevenlabs = new ElevenLabsClient();
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const agents: AgentsType = {
  system: {
    description: "cosas que implique manipular software",
    agentClass: ConversationalAgent,
  },
  ender: {
    description: "si de alguna u otra forma pide terminar la conversación",
    agentClass: ConversationalAgent,
  },
  conversational: {
    description:
      "si no pide hacer ninguna acción, no sabes que decidir, o la accion que pide no esta en los parámetros, usa esta",
    agentClass: ConversationalAgent,
  },
};
