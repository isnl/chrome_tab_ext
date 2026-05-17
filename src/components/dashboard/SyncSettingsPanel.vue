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
const loginCode = ref("");
const loginLoading = ref(false);
const loginError = ref("");

async function handleLogin() {
  if (!loginCode.value.trim()) {
    loginError.value = "请输入授权码";
    return;
  }

  loginLoading.value = true;
  loginError.value = "";

  const success = await sync.login(loginCode.value.trim());
  loginLoading.value = false;

  if (success) {
    loginCode.value = "";
    emit("close");
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
            <!-- Close button -->
            <button class="settings-close" type="button" @click="emit('close')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>

            <!-- Logged in state -->
            <div v-if="sync.isLoggedIn.value" class="logged-in-content">
              <div class="user-info">
                <div class="user-avatar">
                  <img v-if="sync.user.value?.avatarUrl" :src="sync.user.value.avatarUrl" alt="" class="avatar-img" />
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
            </div>

            <!-- Not logged in: QR + input layout -->
            <div v-else class="login-content">
              <div class="login-header">
                <h3 class="login-title">微信扫码登录</h3>
                <p class="login-subtitle">登录后可在多设备间同步数据</p>
              </div>

              <div class="login-body">
                <!-- Left: QR Code -->
                <div class="qr-section">
                  <div class="qr-wrapper">
                    <img src="/wechat-qrcode.jpg" alt="公众号二维码" class="qr-img" />
                  </div>
                  <p class="qr-hint">微信扫码关注公众号</p>
                </div>

                <!-- Right: Steps + Input -->
                <div class="input-section">
                  <div class="steps">
                    <div class="step">
                      <span class="step-num">1</span>
                      <span class="step-text">微信扫码关注公众号</span>
                    </div>
                    <div class="step">
                      <span class="step-num">2</span>
                      <span class="step-text">发送"登录"获取授权码</span>
                    </div>
                    <div class="step">
                      <span class="step-num">3</span>
                      <span class="step-text">将授权码粘贴到下方</span>
                    </div>
                  </div>

                  <div class="input-area">
                    <input
                      v-model="loginCode"
                      class="login-input"
                      type="text"
                      placeholder="粘贴授权码"
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
                  </div>
                </div>
              </div>
            </div>
          </section>
        </Transition>
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
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
}

.settings-panel {
  position: relative;
  width: 90%;
  max-width: 520px;
  padding: 24px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px) saturate(1.5);
  box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.15);
}

.settings-close {
  position: absolute;
  top: 16px;
  right: 16px;
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

.logged-in-content {
  padding-top: 8px;
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

.user-avatar { flex-shrink: 0; }

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

.user-detail { flex: 1; min-width: 0; }

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

.login-content {
  padding-top: 4px;
}

.login-header {
  text-align: center;
  margin-bottom: 20px;
}

.login-title {
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.login-subtitle {
  font-size: 13px;
  color: #64748b;
}

.login-body {
  display: flex;
  gap: 24px;
}

.qr-section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 160px;
}

.qr-wrapper {
  width: 100%;
  padding: 10px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.03);
}

.qr-img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  display: block;
}

.qr-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 8px;
  text-align: center;
}

.input-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #475569;
}

.step-num {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  background: #07c160;
  color: white;
}

.step-text {
  line-height: 1.4;
}

.input-area {
  margin-top: auto;
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
  border-color: rgba(7, 193, 96, 0.4);
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
  background: #07c160;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.login-submit-btn:hover:not(:disabled) {
  background: #06ad56;
}

.login-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
