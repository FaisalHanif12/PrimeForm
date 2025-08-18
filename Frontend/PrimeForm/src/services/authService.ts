// Thin placeholder service. Wire to backend later.
export const authService = {
  async login(email: string, password: string) {
    await new Promise(res => setTimeout(res, 600));
    return { token: 'mock-token', email };
  },

  async signup(payload: { name: string; email: string; password: string }) {
    await new Promise(res => setTimeout(res, 800));
    return { success: true };
  },

  async forgotPassword(email: string) {
    await new Promise(res => setTimeout(res, 700));
    return { success: true };
  },
};


