import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";

const firebaseConfig = {
    projectId: "skillful-city-gdtd0",
    appId: "1:592040270794:web:8e358807458fe99c4f8d33",
    apiKey: "AIzaSyDCoLljzm4d2xGhCp0XS5_Rjqbxogxx9bU",
    authDomain: "skillful-city-gdtd0.firebaseapp.com",
    storageBucket: "skillful-city-gdtd0.firebasestorage.app",
    messagingSenderId: "592040270794"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-localhostrunner-1dbcde54-78c8-47a9-bd9c-98bd98e9eacb");
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let unsubscribeSnapshot = null;
let unsubscribeMetaSnapshot = null;

// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {
    // Inject Login button into header
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        const authContainer = document.createElement('div');
        authContainer.className = 'profile-select-wrap';
        authContainer.style.marginLeft = '10px';
        authContainer.style.borderLeft = '1px solid var(--border-color)';
        authContainer.style.paddingLeft = '10px';
        authContainer.innerHTML = `<button id="fb-login-btn" class="btn btn-outline" style="font-weight:bold; color:var(--color-primary); border-color:var(--color-primary); display:flex; align-items:center; gap:5px;"><span>☁️ Nuvem (Login)</span></button>`;
        
        // Insert it right after the profile selector
        headerActions.appendChild(authContainer);

        const loginBtn = document.getElementById('fb-login-btn');
        loginBtn.addEventListener('click', () => {
            if (currentUser) {
                if (confirm("Deseja sair da sua conta na nuvem? Suas alterações serão salvas apenas localmente.")) {
                    signOut(auth);
                }
            } else {
                signInWithPopup(auth, provider).catch(err => alert("Erro ao fazer login: " + err.message));
            }
        });

        onAuthStateChanged(auth, (user) => {
            currentUser = user;
            if (user) {
                loginBtn.innerHTML = `<span>Sair da Nuvem (${user.email.split('@')[0]})</span>`;
                loginBtn.classList.remove('btn-outline');
                loginBtn.classList.add('btn-primary');
                loginBtn.style.color = '#fff';
                syncProfilesListFromFirebase();
                syncFromFirebase();
            } else {
                loginBtn.innerHTML = `<span>☁️ Nuvem (Login)</span>`;
                loginBtn.classList.remove('btn-primary');
                loginBtn.classList.add('btn-outline');
                loginBtn.style.color = 'var(--color-primary)';
                if (unsubscribeSnapshot) { unsubscribeSnapshot(); unsubscribeSnapshot = null; }
                if (unsubscribeMetaSnapshot) { unsubscribeMetaSnapshot(); unsubscribeMetaSnapshot = null; }
            }
        });
    }

    // Hook into global saveData
    const originalSaveData = window.saveData;
    window.saveData = function() {
        if (originalSaveData) originalSaveData();
        
        if (currentUser && window.appData && window.currentProfileKey) {
            const profileKey = window.currentProfileKey;
            const docRef = doc(db, "users", currentUser.uid, "profiles", profileKey);
            const dataString = JSON.stringify(window.appData);
            setDoc(docRef, { dataString: dataString }, { merge: false }).catch(err => console.error("Firebase sync error", err));
        }
    };

    // Hook into global saveProfilesList
    const originalSaveProfilesList = window.saveProfilesList;
    window.saveProfilesList = function(list) {
        if (originalSaveProfilesList) originalSaveProfilesList(list);
        if (currentUser && list) {
            const metaRef = doc(db, "users", currentUser.uid, "meta", "info");
            setDoc(metaRef, { profiles: list }, { merge: true }).catch(err => console.error("Firebase meta sync error", err));
        }
    };

    const originalSwitchProfile = window.switchProfile;
    window.switchProfile = async function(name) {
        if (currentUser) {
            try {
                const tempRef = doc(db, "users", currentUser.uid, "profiles", name);
                const tempSnap = await getDoc(tempRef);
                if (tempSnap.exists()) {
                    const fbDataStr = tempSnap.data().dataString;
                    const fbData = fbDataStr ? JSON.parse(fbDataStr) : tempSnap.data().data;
                    const storageKey = `studyPlannerData_${name}`;
                    localStorage.setItem(storageKey, JSON.stringify(fbData));
                }
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
    const metaRef = doc(db, "users", currentUser.uid, "meta", "info");
    
    if (unsubscribeMetaSnapshot) unsubscribeMetaSnapshot();
    
    unsubscribeMetaSnapshot = onSnapshot(metaRef, (docSnap) => {
        if (docSnap.exists()) {
            const fbList = docSnap.data().profiles;
            if (docSnap.metadata.hasPendingWrites) return; // ignore local changes
            
            if (fbList && Array.isArray(fbList)) {
                // update local storage and re-render selector
                localStorage.setItem('studyProfilesList', JSON.stringify(fbList));
                if (window.renderProfileSelector) window.renderProfileSelector();
            }
        } else {
            // If it doesn't exist, push local list
            if (window.getProfilesList) {
                window.saveProfilesList(window.getProfilesList());
            }
        }
    });
}

function syncFromFirebase() {
    if (!currentUser || !window.currentProfileKey) return;
    const profileKey = window.currentProfileKey;
    const docRef = doc(db, "users", currentUser.uid, "profiles", profileKey);
    
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    
    unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            if (docSnap.metadata.hasPendingWrites) return; // Ignore local changes
            
            const fbDataStr = docSnap.data().dataString;
            const fbData = fbDataStr ? JSON.parse(fbDataStr) : docSnap.data().data;
            if (fbData) {
                window.appData = fbData;
                const storageKey = `studyPlannerData_${profileKey}`;
                localStorage.setItem(storageKey, JSON.stringify(fbData));
                if (window.renderAll) window.renderAll();
            }
        } else {
            // Push local data
            if (window.saveData) window.saveData();
        }
    });
}
