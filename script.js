// script.js - VERSÃO FINAL (COM WHATSAPP)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZwhqL_imThXiLfD6rz8IH2vsBumZ3NP4",
  authDomain: "meusfilmesmvp.firebaseapp.com",
  projectId: "meusfilmesmvp",
  storageBucket: "meusfilmesmvp.firebasestorage.app",
  messagingSenderId: "300707148312",
  appId: "1:300707148312:web:16525fbfdfb6bf8b58896d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let idParaEditar = null; 
let filmesCache = []; 

// --- VERIFICAÇÃO DE ADMIN ---
const params = new URLSearchParams(window.location.search);
const souAdmin = params.get('modo') === 'admin';

if (!souAdmin) {
    const formulario = document.getElementById('formulario');
    if (formulario) formulario.style.display = 'none';
}

// --- FUNÇÃO TOAST ---
function exibirToast(mensagem, tipo = 'sucesso') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    let icone = '✅';
    if(tipo === 'erro') icone = '❌';
    if(tipo === 'aviso') icone = '⚠️';

    toast.innerHTML = `<span>${icone}</span> ${mensagem}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "fadeOut 0.5s forwards";
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// --- SALVAR / ATUALIZAR ---
const btnSalvar = document.getElementById('btnSalvar');

if (btnSalvar) {
    btnSalvar.addEventListener('click', async () => {
        if (!souAdmin) return exibirToast("Modo apenas visualização!", "erro");

        const tipo = document.getElementById('tipo').value; 
        const titulo = document.getElementById('titulo').value;
        const linkImagem = document.getElementById('linkImagem').value;
        const nota = document.getElementById('nota').value;
        const comentario = document.getElementById('comentario').value;

        if(titulo === "") return exibirToast("O item precisa de um título!", "aviso");

        try {
            if (idParaEditar == null) {
                await addDoc(collection(db, "filmes"), {
                    tipo, titulo, linkImagem, nota, comentario, 
                    dataCriacao: new Date().toISOString()
                });
                exibirToast("Item salvo!", "sucesso");
            } else {
                const filmeRef = doc(db, "filmes", idParaEditar);
                await updateDoc(filmeRef, {
                    tipo, titulo, linkImagem, nota, comentario
                });
                exibirToast("Item atualizado!", "sucesso");
                idParaEditar = null;
                btnSalvar.innerText = "Salvar Item";
                btnSalvar.style.backgroundColor = ""; 
            }

            document.getElementById('titulo').value = "";
            document.getElementById('linkImagem').value = "";
            document.getElementById('nota').value = "";
            document.getElementById('comentario').value = "";
            carregarFilmes(); 

        } catch (e) {
            console.error("Erro: ", e);
            exibirToast("Erro: " + e.message, "erro");
        }
    });
}

// --- DASHBOARD DE ESTATÍSTICAS ---
function atualizarDashboard() {
    const total = filmesCache.length;
    const filmesCount = filmesCache.filter(f => (f.tipo || 'Filme') === 'Filme').length;
    const seriesCount = filmesCache.filter(f => f.tipo === 'Série').length;
    const animesCount = filmesCache.filter(f => f.tipo === 'Anime').length;

    const somaNotas = filmesCache.reduce((acumulador, item) => {
        return acumulador + Number(item.nota || 0);
    }, 0);
    
    const media = total > 0 ? (somaNotas / total).toFixed(1) : "0.0";

    const elTotal = document.getElementById('stat-total');
    if(elTotal) {
        document.getElementById('stat-total').innerText = total;
        document.getElementById('stat-filmes').innerText = filmesCount;
        document.getElementById('stat-series').innerText = seriesCount;
        document.getElementById('stat-animes').innerText = animesCount;
        document.getElementById('stat-media').innerText = media;
    }
}

// --- CARREGAR DADOS ---
async function carregarFilmes() {
    const listaDiv = document.getElementById('lista-filmes');
    
    // Skeleton Loading
    listaDiv.innerHTML = `
        <div class="filme-card skeleton"><div class="skeleton-imagem"></div><div class="skeleton-texto"></div></div>
        <div class="filme-card skeleton"><div class="skeleton-imagem"></div><div class="skeleton-texto"></div></div>
        <div class="filme-card skeleton"><div class="skeleton-imagem"></div><div class="skeleton-texto"></div></div>
    `;

    try {
        const querySnapshot = await getDocs(collection(db, "filmes"));
        
        filmesCache = [];
        querySnapshot.forEach((docSnap) => {
            filmesCache.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        atualizarDashboard();
        renderizarLista();

    } catch (error) {
        console.error(error);
        listaDiv.innerHTML = "<p style='color:red'>Erro ao carregar.</p>";
    }
}

// --- RENDERIZAR LISTA (COM WHATSAPP) ---
function renderizarLista() {
    const listaDiv = document.getElementById('lista-filmes');
    const termoBusca = document.getElementById('inputBusca').value.toLowerCase();
    const tipoOrdenacao = document.getElementById('ordenacao').value;

    let listaFiltrada = filmesCache.filter(filme => {
        return filme.titulo.toLowerCase().includes(termoBusca);
    });

    listaFiltrada.sort((a, b) => {
        if (tipoOrdenacao === 'melhores') return b.nota - a.nota; 
        if (tipoOrdenacao === 'piores') return a.nota - b.nota;   
        
        const dataA = a.dataCriacao || "2000-01-01";
        const dataB = b.dataCriacao || "2000-01-01";
        if (tipoOrdenacao === 'recentes') return dataB.localeCompare(dataA); 
        if (tipoOrdenacao === 'antigos') return dataA.localeCompare(dataB); 
    });

    listaDiv.innerHTML = "";
    
    if(listaFiltrada.length === 0) {
        listaDiv.innerHTML = "<p>Nenhum item encontrado.</p>";
        return;
    }

    listaFiltrada.forEach(filme => {
        let htmlImagem = "";
        if(filme.linkImagem && filme.linkImagem !== "") {
            htmlImagem = `<img src="${filme.linkImagem}" class="capa-filme">`;
        }

        const tipoItem = filme.tipo || "Filme"; 
        let classeBadge = "badge-filme";
        if(tipoItem === "Série") classeBadge = "badge-serie";
        if(tipoItem === "Anime") classeBadge = "badge-anime";

        // GERAÇÃO DO LINK DO WHATSAPP
        const textoZap = encodeURIComponent(`Ei, assisti *${filme.titulo}* e dei nota *${filme.nota}*! 🍿\nMinha opinião: ${filme.comentario}`);
        const linkZap = `https://wa.me/?text=${textoZap}`;

        // Botões de Admin (Só se for admin)
        let htmlBotoes = "";
        if (souAdmin) {
            htmlBotoes = `
                <div class="card-actions">
                    <button class="btn-edit" 
                        data-id="${filme.id}" 
                        data-tipo="${tipoItem}"
                        data-titulo="${filme.titulo}"
                        data-imagem="${filme.linkImagem || ''}"
                        data-nota="${filme.nota}"
                        data-comentario="${filme.comentario}">
                        ✏️ Editar
                    </button>
                    <button class="btn-delete" data-id="${filme.id}">🗑️ Excluir</button>
                </div>
            `;
        }

        listaDiv.innerHTML += `
            <div class="filme-card">
                <span class="badge ${classeBadge}">${tipoItem}</span>
                ${htmlImagem}
                <div class="card-header">
                    <h3>
                        <span>${filme.titulo}</span>
                        <span class="nota">★ ${filme.nota}</span>
                    </h3>
                    
                    <a href="${linkZap}" target="_blank" class="btn-zap" title="Recomendar no WhatsApp">
                        Compartilhar 💬
                    </a>

                    ${htmlBotoes}
                </div>
                <p>${filme.comentario}</p>
            </div>
        `;
    });
}

// --- EVENTOS E LISTENERS ---
const inputBusca = document.getElementById('inputBusca');
if(inputBusca) {
    inputBusca.addEventListener('input', () => renderizarLista());
}

const selectOrdenacao = document.getElementById('ordenacao');
if(selectOrdenacao) {
    selectOrdenacao.addEventListener('change', () => renderizarLista());
}

// Cliques nos Cards (Editar/Excluir)
const listaDiv = document.getElementById('lista-filmes');
if (listaDiv) {
    listaDiv.addEventListener('click', async (e) => {
        if (!souAdmin) return;
        const el = e.target.closest('button'); 
        if (!el) return;

        if(el.classList.contains('btn-delete')) {
            const id = el.getAttribute('data-id');
            if(confirm("Tem certeza?")) {
                try {
                    await deleteDoc(doc(db, "filmes", id));
                    exibirToast("Item apagado!", "sucesso");
                    carregarFilmes();
                } catch(err) {
                    exibirToast("Erro ao apagar.", "erro");
                }
            }
        }

        if(el.classList.contains('btn-edit')) {
            const id = el.getAttribute('data-id');
            const tipo = el.getAttribute('data-tipo');
            const titulo = el.getAttribute('data-titulo');
            const imagem = el.getAttribute('data-imagem');
            const nota = el.getAttribute('data-nota');
            const comentario = el.getAttribute('data-comentario');

            document.getElementById('tipo').value = tipo;
            document.getElementById('titulo').value = titulo;
            document.getElementById('linkImagem').value = imagem;
            document.getElementById('nota').value = nota;
            document.getElementById('comentario').value = comentario;

            idParaEditar = id;
            btnSalvar.innerText = "Atualizar";
            btnSalvar.style.backgroundColor = "#28a745";
            document.getElementById('formulario').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            exibirToast("Modo de edição", "aviso");
        }
    });
}

// --- LÓGICA DO BOTÃO SECRETO DE ADMIN (RODAPÉ) ---
const btnAdminLogin = document.getElementById('btn-admin-login');

if (btnAdminLogin) {
    btnAdminLogin.addEventListener('click', (e) => {
        e.preventDefault(); 
        
        if (souAdmin) {
            // Logout: Remove o parametro da URL
            window.location.href = window.location.pathname; 
        } else {
            // Login
            const senha = prompt("Digite a senha de admin:");
            if (senha === "1234") { 
                window.location.search = '?modo=admin';
            } else {
                alert("Senha incorreta!");
            }
        }
    });
    
    if (souAdmin) {
        btnAdminLogin.innerText = "🔓 Sair do Admin";
        btnAdminLogin.style.color = "red"; 
    }
}

carregarFilmes();