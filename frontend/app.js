// frontend/app.js - integração com backend PHP (login, publications, avaliacao)

var API_BASE = "/sabor_culinaria/backend/api";

// State
var isUserLogged = false;
var currentUser = null; // { id, nome }
// Application state for publications
var publications = [];
var publicationsFiltered = [];

// NOTE: global totals removed per request — UI now shows only user-specific stats in the profile column.
// If you later want to re-enable global totals, reintroduce loadGlobalStats() and the
// corresponding elements in the HTML.

// Small helper to avoid inserting raw HTML from user-controlled values
function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function computeUserStats() {
    let likes = 0;
    let dislikes = 0;
    publications.forEach((p) => {
        const n = p.user_nota;
        if (n !== null && n !== undefined) {
            if (n >= 4) likes++;
            else if (n <= 2) dislikes++;
        }
    });
    return { likes, dislikes };
}

// Update the left profile column to show either the company or the logged user info
function renderProfile() {
    const col = document.getElementById('profile-column');
    if (!col) return;
    // When logged in, show only the user's stats in the profile column and
    // keep the single global totals element (do not recreate it).
    // We'll update DOM nodes instead of replacing innerHTML to avoid
    // accidentally creating duplicate #total-likes / #total-dislikes elements.

    // Ensure there is a .company-info element
    let companyInfo = col.querySelector('.company-info');
    if (!companyInfo) {
        companyInfo = document.createElement('div');
        companyInfo.className = 'company-info';
        col.insertBefore(companyInfo, col.firstChild);
    }

    // Update company info depending on login state
    if (isUserLogged && currentUser) {
        // Normaliza o caminho da foto do usuário (pode ser URL absoluta ou apenas o nome do arquivo)
        let userPhoto = currentUser.foto || currentUser.img || '';
        if (!userPhoto) userPhoto = 'assets/image.png';
        else {
            // se for URL absoluta (http/https) ou caminho absoluto a partir da raiz, deixe como está
            if (!/^https?:\/\//i.test(userPhoto) && !userPhoto.startsWith('/')) {
                if (/^\.\/assets\//.test(userPhoto)) userPhoto = userPhoto.replace(/^\.\//, '');
                else if (!/^assets\//.test(userPhoto)) userPhoto = 'assets/' + userPhoto.replace(/^\.?\//, '');
            }
        }

        companyInfo.innerHTML = `
            <img src="${userPhoto}" alt="Avatar" width="80" height="80" />
            <h2 id="company-name">${escapeHtml(currentUser.nome || currentUser.nickname || 'Usuário')}</h2>
        `;

        // Create or update user-stats block
        let userStats = col.querySelector('#user-stats');
        const stats = computeUserStats();
        if (!userStats) {
            userStats = document.createElement('div');
            userStats.id = 'user-stats';
            userStats.setAttribute('aria-live', 'polite');
            companyInfo.insertAdjacentElement('afterend', userStats);
        }
        userStats.innerHTML = `
      <div class="stat-item">
        <span id="user-likes">${stats.likes}</span>
        <p>Quantidade Likes</p>
      </div>
      <div class="stat-item">
        <span id="user-dislikes">${stats.dislikes}</span>
        <p>Quantidade Deslikes</p>
      </div>
    `;

        // Do not (re)create #global-stats here — keep the single global block
        // elsewhere in the column. If it exists, leave it alone so loadGlobalStats()
        // can update it. If it doesn't exist, create it once below.
    } else {
        // logged out: show default company view and remove user-stats
        companyInfo.innerHTML = `
      <img src="assets/image.png" alt="Logo Sabor do Brasil" width="80" height="80" />
      <h2 id="company-name">Sabor do Brasil</h2>
    `;
        const userStats = col.querySelector('#user-stats');
        if (userStats) userStats.remove();
    }

    // Global totals have been removed from the profile column.
}

// Render publications list into #publications-list
function loadPublications() {
    const container = document.getElementById("publications-list");
    const empty = document.getElementById("empty-state");
    if (!container) return;
    container.innerHTML = "";

    if (!publicationsFiltered || publicationsFiltered.length === 0) {
        if (empty) empty.hidden = false;
        return;
    }
    if (empty) empty.hidden = true;

    publicationsFiltered.forEach((p) => {
        const card = document.createElement("article");
        card.className = "publication-card";
        card.setAttribute("data-id", p.id);
        // determina caminho da imagem (usa img fornecida ou fallback)
        // suporta múltiplas chaves possíveis vindas do backend (img ou foto)
        // normaliza quando o backend retorna apenas um nome de arquivo
        let imgSrc = p.img || p.foto || '';
        if (imgSrc) {
            // se for URL absoluta (http/https) ou caminho absoluto a partir da raiz, deixe como está
            if (!/^https?:\/\//i.test(imgSrc) && !imgSrc.startsWith('/')) {
                // se já começa com assets/ ou ./assets/, remova somente o ./ inicial
                if (/^\.\/assets\//.test(imgSrc)) imgSrc = imgSrc.replace(/^\.\//, '');
                else if (!/^assets\//.test(imgSrc)) imgSrc = 'assets/' + imgSrc.replace(/^\.?\//, '');
            }
        } else {
            imgSrc = 'assets/image.png';
        }


        card.innerHTML = `
            <img src="${imgSrc}" alt="${(p.titulo || "").replace(/\"/g, "")}">
            <h3>${p.titulo || "Sem título"}</h3>
            <p>${p.local || ""} — ${p.cidade || ""}</p>
            <div class="interaction-bar">
                <div class="icon-group">
                    <button class="icon-button" data-action="like" aria-label="Curtir">
                        <img src="./assets/flecha_cima_cheia.svg" alt="Curtir"><span class="count-like">${p.likes
            }</span>
                    </button>
                    <button class="icon-button" data-action="dislike" aria-label="Não curtir">
                        <img src="./assets/flecha_baixo_cheia.svg" alt="Não curtir"><span class="count-dislike">${p.dislikes
            }</span>
                    </button>
                    <button class="icon-button" data-action="comment" aria-label="Comentar">
                        <img src="./assets/chat.svg" alt="Comentar"><span class="count-comment">${p.comentarios
            }</span>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function showLoginModal() {
    const modal = document.getElementById("login-modal");
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");
    document.getElementById("login-username").focus();
}

function closeModal() {
    const modal = document.getElementById("login-modal");
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
}

async function fetchPublications() {
    try {
        const res = await fetch(API_BASE + "/publications.php", {
            credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
            publications = data.publications.map((p) => ({
                id: p.id,
                titulo: p["titulo"],
                local: p.local,
                cidade: p.cidade,
                likes: Number(p.likes || 0),
                dislikes: Number(p.dislikes || 0),
                comentarios: Number(p.comentarios || 0),
                // o backend pode retornar `img` ou `foto`; preferir qualquer um dos dois
                img: p.img || p.foto || p['foto'] || null,
                // user_nota é null quando anônimo ou não foi avaliado pelo usuário atual
                user_nota: p.user_nota !== undefined && p.user_nota !== null ? Number(p.user_nota) : null,
            }));
            publicationsFiltered = [...publications];
            loadPublications();
            // atualiza área de perfil (exibe info do usuário quando logado)
            renderProfile();
        } else {
            console.error("Failed to load publications", data);
        }
    } catch (err) {
        console.error("Error fetching publications", err);
    }
}

async function handleInteraction(event) {
    const target = event.target.closest(".icon-button");
    if (!target) return;

    if (!isUserLogged) {
        showLoginModal();
        return;
    }

    const action = target.getAttribute("data-action");
    const card = target.closest(".publication-card");
    const publicationId = parseInt(card.getAttribute("data-id"), 10);
    const pubData = publications.find((p) => p.id === publicationId);

    try {
        const payload = { action, publicationId };
        if (action === "comment") {
            const c = prompt("Digite seu comentário:");
            if (!c) return;
            payload.comment = c;
        }

        const res = await fetch(API_BASE + "/avaliacao.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) {
            if (res.status === 401) {
                isUserLogged = false;
                currentUser = null;
                document.getElementById("login-button").textContent = "Entrar";
                showLoginModal();
                return;
            }
            alert(json.message || "Erro ao enviar avaliação");
            return;
        }

        const counts = json.counts;
        if (counts) {
            pubData.likes = counts.likes;
            pubData.dislikes = counts.dislikes;
            pubData.comentarios = counts.comentarios;
            const cardLike = card.querySelector(".count-like");
            const cardDislike = card.querySelector(".count-dislike");
            const cardComment = card.querySelector(".count-comment");
            if (cardLike) cardLike.textContent = pubData.likes;
            if (cardDislike) cardDislike.textContent = pubData.dislikes;
            if (cardComment) cardComment.textContent = pubData.comentarios;
            // atualiza a nota local do usuário para esta publicação e re-renderiza as contagens do perfil
            if (action === 'like') pubData.user_nota = 5;
            else if (action === 'dislike') pubData.user_nota = 1;
            else if (action === 'comment') pubData.user_nota = 3;
            renderProfile();
        }
    } catch (err) {
        console.error("Error sending interaction", err);
        alert("Erro de rede ao enviar ação");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetchPublications();

    document
        .getElementById("publications-list")
        .addEventListener("click", handleInteraction);

    // Busca / filtro
    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const q = e.target.value.trim().toLowerCase();
            publicationsFiltered = publications.filter(
                (p) =>
                    (p.titulo || "").toLowerCase().includes(q) ||
                    (p.local || "").toLowerCase().includes(q) ||
                    (p.cidade || "").toLowerCase().includes(q)
            );
            loadPublications();
        });
    }

    // Botão de login (alterna para logout quando logado)
    const loginBtn = document.getElementById("login-button");
    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            if (isUserLogged) {
                await fetch(API_BASE + "/logout.php", {
                    method: "POST",
                    credentials: "include",
                });
                isUserLogged = false;
                currentUser = null;
                loginBtn.textContent = "Entrar";
                // reload publications as anonymous and update profile column
                await fetchPublications();
                renderProfile();
                return;
            }
            showLoginModal();
        });
    }

    // Ações do modal de login
    const doLoginBtn = document.getElementById("do-login");
    if (doLoginBtn) {
        doLoginBtn.addEventListener("click", async () => {
            const usernameInput = document.getElementById("login-username");
            const passwordInput = document.getElementById("login-password");
            const errorEl = document.getElementById("login-error");
            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            usernameInput.classList.remove("invalid");
            passwordInput.classList.remove("invalid");
            errorEl.hidden = true;

            if (!username) {
                usernameInput.classList.add("invalid");
                errorEl.textContent = "Preencha o nome de usuário.";
                errorEl.hidden = false;
                return;
            }
            if (!password) {
                passwordInput.classList.add("invalid");
                errorEl.textContent = "Preencha a senha.";
                errorEl.hidden = false;
                return;
            }

            try {
                const res = await fetch(API_BASE + "/login.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ username, password }),
                });
                const json = await res.json();
                if (!json.success) {
                    usernameInput.classList.add("invalid");
                    passwordInput.classList.add("invalid");
                    errorEl.textContent = json.message || "Usuário ou senha incorreto";
                    errorEl.hidden = false;
                    return;
                }

                isUserLogged = true;
                currentUser = json.user;
                loginBtn.textContent = "Sair";
                closeModal();
                fetchPublications();
            } catch (err) {
                console.error("Login error", err);
                errorEl.textContent = "Erro de rede ao autenticar";
                errorEl.hidden = false;
            }
        });
    }

    // Botão cancelar
    const cancelBtn = document.getElementById("cancel-login");
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    // Limpa estado de erro enquanto digita
    ["login-username", "login-password"].forEach((id) => {
        const el = document.getElementById(id);
        if (el)
            el.addEventListener("input", () => {
                el.classList.remove("invalid");
                const err = document.getElementById("login-error");
                if (err) err.hidden = true;
            });
    });

    // Fecha modal ao clicar no overlay / pressionar Escape
    const loginModal = document.getElementById("login-modal");
    if (loginModal) {
        loginModal.addEventListener("click", (e) => {
            if (e.target === loginModal) closeModal();
        });
    }
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });
});
