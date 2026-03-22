import { RouterResponseType } from "../types";

export class Agent {
  constructor() {
    if (new.target === Agent) {
      throw new TypeError(
        "No se puede instanciar la clase abstracta 'Agent' directamente.",
      );
    }
  }

  async handleRouterResponse(routerResponse: RouterResponseType) {
    throw new Error(
      "El método 'handleRouterResponse()' debe ser implementado.",
    );
  }
}
