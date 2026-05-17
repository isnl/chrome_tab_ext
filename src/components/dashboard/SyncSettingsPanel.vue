<script setup lang="ts">
import { ref } from "vue";
import { useSync } from "@/composables/useSync";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const sync = useSync();
const showLoginModal = ref(false);
const loginCode = ref("");
const loginLoading = ref(false);
const loginError = ref("");

async function handleLogin() {
  if (!loginCode.value.trim()) return;

  loginLoading.value = true;
  loginError.value = "";

  const success = await sync.login(loginCode.value.trim());
  loginLoading.value = false;

  if (success) {
    showLoginModal.value = false;
    loginCode.value = "";
  } else {
    loginError.value = "登录失败，请检查授权码是否正确";
  }
}

async function handleLogout() {
  await sync.logout();
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="settings-overlay" @click.self="emit('close')">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-4 scale-95 opacity-0"
          enter-to-class="translate-y-0 scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 scale-100 opacity-100"
          leave-to-class="translate-y-4 scale-95 opacity-0"
        >
          <section v-if="open" class="settings-panel" @keydown.escape="emit('close')">
            <div class="settings-header">
              <h3 class="settings-title">账号与同步</h3>
              <button class="settings-close" type="button" @click="emit('close')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            <!-- Logged in state -->
            <div v-if="sync.isLoggedIn.value" class="user-info">
              <div class="user-avatar">
                <img
                  v-if="sync.user.value?.avatarUrl"
                  :src="sync.user.value.avatarUrl"
                  alt=""
                  class="avatar-img"
                />
                <div v-else class="avatar-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>
                  </svg>
                </div>
              </div>
              <div class="user-detail">
                <span class="user-name">{{ sync.user.value?.nickname || '已登录' }}</span>
                <span class="user-status">数据已同步到云端</span>
              </div>
              <button class="logout-btn" type="button" @click="handleLogout">退出</button>
            </div>

            <!-- Not logged in -->
            <div v-else class="login-section">
              <p class="login-desc">登录后可在多设备间同步数据</p>
              <button class="login-btn" type="button" @click="showLoginModal = true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.11.24-.245 0-.06-.024-.12-.04-.178l-.325-1.233a.49.49 0 0 1 .177-.554C23.028 18.905 24 17.213 24 15.312c0-3.176-3.147-5.783-7.062-6.454z"/>
                </svg>
                微信扫码登录
              </button>
            </div>
          </section>
        </Transition>
      </div>
    </Transition>

    <!-- Login code input modal -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showLoginModal" class="settings-overlay" @click.self="showLoginModal = false">
        <section class="settings-panel login-modal">
          <div class="settings-header">
            <h3 class="settings-title">微信登录</h3>
            <button class="settings-close" type="button" @click="showLoginModal = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>

          <p class="login-modal-desc">请输入微信授权后获得的登录码：</p>

          <input
            v-model="loginCode"
            class="login-input"
            type="text"
            placeholder="粘贴登录码"
            :disabled="loginLoading"
            @keydown.enter="handleLogin"
          />

          <p v-if="loginError" class="login-error">{{ loginError }}</p>

          <button
            class="login-submit-btn"
            type="button"
            :disabled="loginLoading || !loginCode.trim()"
            @click="handleLogin"
          >
            {{ loginLoading ? '登录中...' : '确认登录' }}
          </button>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
}

.settings-panel {
  width: 90%;
  max-width: 360px;
  padding: 20px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px) saturate(1.5);
  box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.15);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.settings-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.settings-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 120ms ease;
}

.settings-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #475569;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(99, 102, 241, 0.04);
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.user-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
}

.user-detail {
  flex: 1;
  min-width: 0;
}

.user-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-status {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.logout-btn {
  flex-shrink: 0;
  padding: 6px 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: white;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  transition: all 120ms ease;
}

.logout-btn:hover {
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.login-section {
  text-align: center;
  padding: 8px 0;
}

.login-desc {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 16px;
}

.login-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  background: #07c160;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.login-btn:hover {
  background: #06ad56;
  transform: translateY(-1px);
}

.login-modal {
  max-width: 320px;
}

.login-modal-desc {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 12px;
}

.login-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  font-size: 14px;
  color: #1e293b;
  background: rgba(255, 255, 255, 0.8);
  outline: none;
  transition: border-color 150ms ease;
}

.login-input:focus {
  border-color: rgba(99, 102, 241, 0.4);
}

.login-input:disabled {
  opacity: 0.6;
}

.login-error {
  font-size: 12px;
  color: #ef4444;
  margin-top: 8px;
}

.login-submit-btn {
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: #4f46e5;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.login-submit-btn:hover:not(:disabled) {
  background: #4338ca;
}

.login-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
