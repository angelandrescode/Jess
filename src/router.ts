import OpenAI from "openai";
import "dotenv/config";
import { StateManager } from "./global-states";
import { openai, agents } from "./constants";
import { RouterResponseType } from "./types";
import { AgentType } from "./types";

const listOfAgentsWithDescription = Object.entries(agents)
  .map(([agent_key, agent_value]) => {
    return `${agent_key} (${agent_value.description}), `;
  })
  .join(" ");

const instructions = `
Eres un mediador en el sistema de asistente llamado Jess.
Tu trabajo es analizar el texto del usuario y decidir qué acción ejecutar.
SOLO respondes en formato JSON con esta estructura:
{
  "agent": string,
  "intention": string,
}
No expliques nada, solo responde en esa estructura.
Agentes disponibles: ${listOfAgentsWithDescription}
La intencion es un texto explicando MUY BREVEMENTE y sin perder información, cual es la intención del usuario, no uses conectores y los verbos en infinitivo`;

export async function initConversation() {
  const conversation = await openai.conversations.create();
  return conversation;
}

export async function handleIntention(
  conversation: OpenAI.Conversations.Conversation,
  transcript: string,
): Promise<RouterResponseType | undefined> {
  const { isInConversation, isTurnOfJess } = StateManager.getState();
  if (!isInConversation || !isTurnOfJess) return;
  const response = await openai.responses.create({
    model: "gpt-3.5-turbo",
    instructions,
    input: transcript,
    conversation: conversation.id,
  });
  const serializedResponse = JSON.parse(response.output_text);
  // Se obtiene el nombre del agente
  const nameAgent: string = serializedResponse.agent;
  // Obtenemos el agente
  const agent = agents[nameAgent];
  // Preparamos la respuesta a retronar
  const routerResponse: RouterResponseType = {
    agent: agent,
    intention: serializedResponse.intention,
    literalTranscript: transcript,
  };
  return routerResponse;
}
