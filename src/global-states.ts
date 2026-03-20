let states: { isListening: boolean } = {
  isListening: false,
};

export const StateManager = {
  getState() {
    return states;
  },
  setIsListening(value: boolean) {
    states.isListening = value;
  },
};
