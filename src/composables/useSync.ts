import { ref, readonly } from "vue";
import * as api from "../services/sync";
import type { SyncUser } from "../services/sync";

const isLoggedIn = ref(false);
const user = ref<SyncUser | null>(null);

let initialized = false;

async function initialize() {
  if (initialized) return;
  initialized = true;

  const loggedIn = await api.isLoggedIn();
  isLoggedIn.value = loggedIn;
  if (loggedIn) {
    user.value = await api.getSavedUser();
  }
}

async function login(code: string): Promise<boolean> {
  const result = await api.login(code);
  if (result) {
    isLoggedIn.value = true;
    user.value = result.user;
    return true;
  }
  return false;
}

async function logout() {
  await api.logout();
  isLoggedIn.value = false;
  user.value = null;
}

async function checkAuth(): Promise<boolean> {
  try {
    const me = await api.getMe();
    if (me) {
      isLoggedIn.value = true;
      user.value = me;
      return true;
    }
  } catch {
    isLoggedIn.value = false;
    user.value = null;
  }
  return false;
}

export function useSync() {
  initialize();

  return {
    isLoggedIn: readonly(isLoggedIn),
    user: readonly(user),
    login,
    logout,
    checkAuth,
  };
}
