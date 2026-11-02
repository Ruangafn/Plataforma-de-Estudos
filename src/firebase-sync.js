import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, getDoc, getDocFromServer } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// Inicializa o Firebase com o projeto do usuário: plataformadeestudo-e44a9
const app = initializeApp(firebaseConfig);

// Banco padrão (default) visível no console Firebase do usuário
export const defaultDb = getFirestore(app);

// Banco com identificador nomeado se configurado pelo runner
export const namedDb = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : null;

// Exporta db primário (padrão)
export const db = defaultDb;
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let unsubscribeSnapshot = null;
let unsubscribeMetaSnapshot = null;
let saveDebounceTimer = null;
let lastSyncTimestamp = null;

// Testa a conectividade com o Firestore
async function testConnection() {
    try {
        await getDocFromServer(doc(defaultDb, 'test', 'connection'));
    } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Firebase offline:", error);
            updateSyncStatus('offline');
        }
    }
}
testConnection();

function updateSyncStatus(status, detail) {
    const badge = document.getElementById('fb-sync-badge');
    if (!badge) return;

    if (status === 'saving') {
        badge.innerHTML = `<span style="color: #60a5fa;">🔄 Salvando na Nuvem...</span>`;
        badge.style.display = 'inline-flex';
    } else if (status === 'saved') {
        lastSyncTimestamp = new Date();
        const timeStr = lastSyncTimestamp.toLocaleTimeString('pt-BR');
        badge.innerHTML = `<span style="color: #34d399;" title="Salvo em plataformadeestudo-e44a9 às ${timeStr}">☁️ Salvo na Nuvem (${timeStr})</span>`;
        badge.style.display = 'inline-flex';
        setTimeout(() => {
            if (badge && currentUser) {
                badge.innerHTML = `<span style="color: #10b981;" title="Projeto: ${firebaseConfig.projectId}">🟢 Nuvem Ativa</span>`;
            }
        }, 3000);
    } else if (status === 'error') {
        badge.innerHTML = `<span style="color: #f87171;" title="${detail || ''}">⚠️ Falha na Nuvem</span>`;
        badge.style.display = 'inline-flex';
    } else if (status === 'offline') {
        badge.innerHTML = `<span style="color: #fbbf24;">⚠️ Offline</span>`;
        badge.style.display = 'inline-flex';
    } else if (status === 'local') {
        badge.innerHTML = `<span style="color: var(--text-secondary);" title="Armazenado apenas neste navegador">💾 Modo Local</span>`;
        badge.style.display = 'inline-flex';
    }
}

// Salva nos bancos (default e runner se houver)
async function writeToFirestore(pathSegments, data, options = { merge: false }) {
    const promises = [];
    const docRefDefault = doc(defaultDb, ...pathSegments);
    promises.push(setDoc(docRefDefault, data, options));

    if (namedDb) {
        try {
            const docRefNamed = doc(namedDb, ...pathSegments);
            promises.push(setDoc(docRefNamed, data, options));
        } catch (e) {
            console.warn("Aviso ao salvar no banco secundário:", e);
        }
    }

    const results = await Promise.allSettled(promises);
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    if (fulfilled.length === 0) {
        const error = results[0].reason || new Error("Falha ao salvar no Firestore");
        throw error;
    }
    return fulfilled;
}

// Envio de dados para o Firestore com debounce para evitar flood de writes
export function pushDataToFirebase(immediate = false) {
    if (!currentUser || !window.appData || !window.currentProfileKey) return;
    
    if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer);
        saveDebounceTimer = null;
    }

    const doSave = async () => {
        if (!currentUser || !window.appData || !window.currentProfileKey) return;
        const profileKey = window.currentProfileKey;
        const dataString = JSON.stringify(window.appData);
        updateSyncStatus('saving');

        try {
            await writeToFirestore(["users", currentUser.uid, "profiles", profileKey], {
                dataString: dataString,
                updatedAt: new Date().toISOString(),
                projectId: firebaseConfig.projectId
            }, { merge: false });

            updateSyncStatus('saved');
        } catch (err) {
            console.error("Firebase sync error:", err);
            updateSyncStatus('error', err.message);
        }
    };

    if (immediate) {
        doSave();
    } else {
        saveDebounceTimer = setTimeout(doSave, 500);
    }
}

// Expõe globalmente para que qualquer ação em index.html possa sincronizar
window.triggerFirebaseSync = () => pushDataToFirebase(false);
window.pushDataToFirebaseImmediate = () => pushDataToFirebase(true);

// Modal de status e diagnóstico do Firebase
function showFirebaseStatusModal() {
    let modal = document.getElementById('modal-firebase-status');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-firebase-status';
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:99999; backdrop-filter:blur(4px);';
        document.body.appendChild(modal);
    }

    const currentHost = window.location.hostname;
    const userEmail = currentUser ? currentUser.email : 'Não autenticado (Modo Local)';
    const statusText = currentUser ? '🟢 Conectado e Sincronizando' : '⚪ Desconectado (Dados apenas locais)';
    const lastSyncText = lastSyncTimestamp ? lastSyncTimestamp.toLocaleString('pt-BR') : 'Ainda não sincronizado nesta sessão';

    modal.innerHTML = `
        <div style="background:var(--bg-card, #1e293b); color:var(--text-primary, #f8fafc); border-radius:12px; padding:24px; max-width:520px; width:90%; border:1px solid var(--border-color, #334155); box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h3 style="margin:0; font-size:18px; display:flex; align-items:center; gap:8px;">
                    <span>☁️</span> Status do Firebase
                </h3>
                <button id="fb-modal-close" style="background:none; border:none; color:#94a3b8; font-size:20px; cursor:pointer;">&times;</button>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:12px; font-size:13px; line-height:1.5;">
                <div style="background:rgba(255,255,255,0.03); padding:10px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; font-weight:700;">Projeto Ativo</div>
                    <div style="font-family:monospace; font-size:14px; color:#38bdf8; font-weight:bold; margin-top:2px;">
                        ${firebaseConfig.projectId}
                    </div>
                </div>

                <div style="background:rgba(255,255,255,0.03); padding:10px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; font-weight:700;">Conta Conectada</div>
                    <div style="font-size:13px; font-weight:600; margin-top:2px;">
                        ${userEmail}
                    </div>
                    <div style="font-size:12px; color:#10b981; margin-top:2px;">
                        ${statusText}
                    </div>
                </div>

                <div style="background:rgba(255,255,255,0.03); padding:10px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; font-weight:700;">Último Envio para Nuvem</div>
                    <div style="font-size:13px; margin-top:2px; color:#cbd5e1;">
                        ${lastSyncText}
                    </div>
                </div>

                <div style="background:rgba(255,255,255,0.03); padding:10px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; font-weight:700;">Domínio deste Navegador</div>
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-top:4px; gap:8px;">
                        <code style="font-size:11px; background:#0f172a; padding:4px 8px; border-radius:4px; color:#e2e8f0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">
                            ${currentHost}
                        </code>
                        <button id="fb-btn-copy-domain" style="padding:4px 8px; font-size:11px; background:#334155; border:none; border-radius:4px; color:#fff; cursor:pointer; white-space:nowrap;">
                            Copiar
                        </button>
                    </div>
                </div>
            </div>

            <div style="margin-top:20px; display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap;">
                ${currentUser ? `
                    <button id="fb-modal-sync-now" class="btn btn-primary" style="font-size:12px; padding:6px 14px;">
                        🔄 Forçar Sincronização Agora
                    </button>
                    <button id="fb-modal-signout" class="btn btn-outline" style="font-size:12px; padding:6px 14px; color:#f87171; border-color:#f87171;">
                        🚪 Sair da Nuvem
                    </button>
                ` : `
                    <button id="fb-modal-login" class="btn btn-primary" style="font-size:12px; padding:6px 14px;">
                        ☁️ Fazer Login com o Google
                    </button>
                `}
                <button id="fb-modal-ok" class="btn btn-outline" style="font-size:12px; padding:6px 14px;">
                    Fechar
                </button>
            </div>
        </div>
    `;

    modal.style.display = 'flex';

    document.getElementById('fb-modal-close').onclick = () => modal.style.display = 'none';
    document.getElementById('fb-modal-ok').onclick = () => modal.style.display = 'none';

    const copyBtn = document.getElementById('fb-btn-copy-domain');
    if (copyBtn) {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(currentHost);
            copyBtn.innerText = "Copiado!";
            setTimeout(() => { copyBtn.innerText = "Copiar"; }, 2000);
        };
    }

    const syncBtn = document.getElementById('fb-modal-sync-now');
    if (syncBtn) {
        syncBtn.onclick = async () => {
            syncBtn.disabled = true;
            syncBtn.innerText = "Sincronizando...";
            pushDataToFirebase(true);
            if (window.getProfilesList && window.saveProfilesList) {
                window.saveProfilesList(window.getProfilesList());
            }
            setTimeout(() => {
                syncBtn.innerText = "✅ Sincronizado!";
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 800);
            }, 600);
        };
    }

    const signoutBtn = document.getElementById('fb-modal-signout');
    if (signoutBtn) {
        signoutBtn.onclick = async () => {
            if (confirm("Deseja realmente desconectar da nuvem? As próximas alterações ficarão salvas apenas neste navegador.")) {
                await signOut(auth);
                modal.style.display = 'none';
            }
        };
    }

    const modalLoginBtn = document.getElementById('fb-modal-login');
    if (modalLoginBtn) {
        modalLoginBtn.onclick = () => {
            modal.style.display = 'none';
            handleLoginFlow();
        };
    }
}

// Tratamento detalhado de login com suporte a unauthorized-domain
function handleLoginFlow() {
    signInWithPopup(auth, provider).catch(err => {
        console.error("Erro ao fazer login Firebase:", err);
        const code = err.code || '';
        const currentHost = window.location.hostname;

        if (code === 'auth/unauthorized-domain') {
            const msg = `⚠️ Domínio não autorizado no Firebase!\n\n` +
                `Para permitir login com Google no seu projeto "${firebaseConfig.projectId}":\n\n` +
                `1. Abra o Firebase Console do seu projeto:\n` +
                `   https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings\n\n` +
                `2. Na aba "Configurações" > "Domínios autorizados", clique em "Adicionar domínio".\n\n` +
                `3. Adicione o seguinte domínio:\n   ${currentHost}\n\n` +
                `4. Clique em Adicionar e tente fazer o login novamente!`;
            
            if (window.customAlert) {
                window.customAlert(msg);
            } else {
                alert(msg);
            }
        } else if (code === 'auth/popup-blocked') {
            const msg = "⚠️ O pop-up de login foi bloqueado pelo seu navegador. Por favor, permita pop-ups nesta página para autenticar com o Google.";
            if (window.customAlert) window.customAlert(msg); else alert(msg);
        } else if (code === 'auth/popup-closed-by-user') {
            console.log("Janela de login fechada pelo usuário.");
        } else {
            const msg = `Erro ao autenticar com o Firebase (${code}): ${err.message}`;
            if (window.customAlert) window.customAlert(msg); else alert(msg);
        }
    });
}

// Aguarda o DOM
document.addEventListener("DOMContentLoaded", () => {
    // Injeta o botão e badge de status da Nuvem no cabeçalho
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('fb-auth-container')) {
        const authContainer = document.createElement('div');
        authContainer.id = 'fb-auth-container';
        authContainer.className = 'profile-select-wrap';
        authContainer.style.marginLeft = '8px';
        authContainer.style.borderLeft = '1px solid var(--border-color)';
        authContainer.style.paddingLeft = '8px';
        authContainer.style.display = 'flex';
        authContainer.style.alignItems = 'center';
        authContainer.style.gap = '8px';
        authContainer.innerHTML = `
            <span id="fb-sync-badge" style="font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); display: none; cursor:pointer;"></span>
            <button id="fb-login-btn" class="btn btn-outline" style="font-weight:bold; color:var(--color-primary); border-color:var(--color-primary); display:flex; align-items:center; gap:6px;">
                <span>☁️ Salvar na Nuvem (Login)</span>
            </button>
        `;
        
        headerActions.appendChild(authContainer);

        const badge = document.getElementById('fb-sync-badge');
        if (badge) {
            badge.addEventListener('click', showFirebaseStatusModal);
        }

        const loginBtn = document.getElementById('fb-login-btn');
        loginBtn.addEventListener('click', () => {
            if (currentUser) {
                showFirebaseStatusModal();
            } else {
                handleLoginFlow();
            }
        });

        onAuthStateChanged(auth, (user) => {
            currentUser = user;
            if (user) {
                const emailPrefix = user.email ? user.email.split('@')[0] : 'Conectado';
                loginBtn.innerHTML = `<span>☁️ ${emailPrefix}</span>`;
                loginBtn.classList.remove('btn-outline');
                loginBtn.classList.add('btn-primary');
                loginBtn.style.color = '#fff';
                loginBtn.title = `Conectado ao Firebase (${firebaseConfig.projectId}) como ${user.email} (Clique para opções)`;
                updateSyncStatus('saved');
                syncProfilesListFromFirebase();
                syncFromFirebase();
            } else {
                loginBtn.innerHTML = `<span>☁️ Salvar na Nuvem (Login)</span>`;
                loginBtn.classList.remove('btn-primary');
                loginBtn.classList.add('btn-outline');
                loginBtn.style.color = 'var(--color-primary)';
                loginBtn.title = `Clique para fazer login com o Google e salvar em ${firebaseConfig.projectId}`;
                updateSyncStatus('local');
                if (unsubscribeSnapshot) { unsubscribeSnapshot(); unsubscribeSnapshot = null; }
                if (unsubscribeMetaSnapshot) { unsubscribeMetaSnapshot(); unsubscribeMetaSnapshot = null; }
            }
        });
    }

    // Hook no saveData global caso já exista
    const originalSaveData = window.saveData;
    window.saveData = function() {
        if (originalSaveData) originalSaveData();
        pushDataToFirebase(false);
    };

    // Hook no saveProfilesList global
    const originalSaveProfilesList = window.saveProfilesList;
    window.saveProfilesList = function(list) {
        if (originalSaveProfilesList) originalSaveProfilesList(list);
        if (currentUser && list) {
            writeToFirestore(["users", currentUser.uid, "meta", "info"], {
                profiles: list,
                updatedAt: new Date().toISOString()
            }, { merge: true }).catch(err => console.error("Firebase meta sync error:", err));
        }
    };

    // Hook na troca de perfil
    const originalSwitchProfile = window.switchProfile;
    window.switchProfile = async function(name) {
        if (currentUser) {
            try {
                updateSyncStatus('saving');
                const tempRef = doc(defaultDb, "users", currentUser.uid, "profiles", name);
                const tempSnap = await getDoc(tempRef);
                if (tempSnap.exists()) {
                    const fbDataStr = tempSnap.data().dataString;
                    const fbData = fbDataStr ? JSON.parse(fbDataStr) : tempSnap.data().data;
                    const storageKey = `studyPlannerData_${name}`;
                    localStorage.setItem(storageKey, JSON.stringify(fbData));
                }
                updateSyncStatus('saved');
            } catch (err) {
                console.error("Error fetching profile before switch", err);
            }
        }
        
        if (originalSwitchProfile) originalSwitchProfile(name);
        syncFromFirebase();
    };
});

function syncProfilesListFromFirebase() {
    if (!currentUser) return;
    const metaRef = doc(defaultDb, "users", currentUser.uid, "meta", "info");
    
    if (unsubscribeMetaSnapshot) unsubscribeMetaSnapshot();
    
    unsubscribeMetaSnapshot = onSnapshot(metaRef, (docSnap) => {
        if (docSnap.exists()) {
            const fbList = docSnap.data().profiles;
            if (docSnap.metadata.hasPendingWrites) return; // ignora alterações locais
            
            if (fbList && Array.isArray(fbList)) {
                localStorage.setItem('studyProfilesList', JSON.stringify(fbList));
                if (window.renderProfileSelector) window.renderProfileSelector();
            }
        } else {
            // Se não existe na nuvem, envia a lista local
            if (window.getProfilesList && window.saveProfilesList) {
                window.saveProfilesList(window.getProfilesList());
            }
        }
    }, (error) => {
        console.error("Firestore error listening to meta/info:", error);
    });
}

function syncFromFirebase() {
    if (!currentUser || !window.currentProfileKey) return;
    const profileKey = window.currentProfileKey;
    const docRef = doc(defaultDb, "users", currentUser.uid, "profiles", profileKey);
    
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    
    unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            if (docSnap.metadata.hasPendingWrites) return; // Ignora alterações locais
            
            const fbDataStr = docSnap.data().dataString;
            const fbData = fbDataStr ? JSON.parse(fbDataStr) : docSnap.data().data;
            if (fbData) {
                window.appData = fbData;
                const storageKey = `studyPlannerData_${profileKey}`;
                localStorage.setItem(storageKey, JSON.stringify(fbData));
                if (window.renderAll) window.renderAll();
                updateSyncStatus('saved');
            }
        } else {
            // Envia dados locais se a nuvem estiver vazia
            pushDataToFirebase(true);
        }
    }, (error) => {
        console.error("Firestore error listening to profile:", error);
        updateSyncStatus('error', error.message);
    });
}
