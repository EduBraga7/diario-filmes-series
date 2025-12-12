// script.js - VERSÃO COM ORDENAÇÃO E TOASTS

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
let filmesCache = []; // <--- AQUI VAMOS GUARDAR OS DADOS PARA NÃO BUSCAR NO BANCO TODA HORA

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
                // Ao criar, salvamos a Data Atual (timestamp) para poder ordenar depois
                await addDoc(collection(db, "filmes"), {
                    tipo, titulo, linkImagem, nota, comentario, 
                    dataCriacao: new Date().toISOString() // Salvando data como texto ISO
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
            carregarFilmes(); // Recarrega tudo do banco

        } catch (e) {
            console.error("Erro: ", e);
            exibirToast("Erro: " + e.message, "erro");
        }
    });
}

// --- CARREGAR DADOS DO FIREBASE ---
async function carregarFilmes() {
    const listaDiv = document.getElementById('lista-filmes');
    
    // 1. MOSTRAR SKELETON (LOADING) ANTES DE BUSCAR
    // Criamos 4 cards falsos para dar a ilusão de carregamento
    listaDiv.innerHTML = `
        <div class="filme-card skeleton">
            <div class="skeleton-imagem"></div>
            <div class="skeleton-texto"></div>
            <div class="skeleton-texto curto"></div>
        </div>
        <div class="filme-card skeleton">
            <div class="skeleton-imagem"></div>
            <div class="skeleton-texto"></div>
            <div class="skeleton-texto curto"></div>
        </div>
        <div class="filme-card skeleton">
            <div class="skeleton-imagem"></div>
            <div class="skeleton-texto"></div>
            <div class="skeleton-texto curto"></div>
        </div>
        <div class="filme-card skeleton">
            <div class="skeleton-imagem"></div>
            <div class="skeleton-texto"></div>
            <div class="skeleton-texto curto"></div>
        </div>
    `;

    try {
        // O await faz o JS esperar aqui. Enquanto espera, o skeleton fica na tela.
        const querySnapshot = await getDocs(collection(db, "filmes"));
        
        // Quando os dados chegam, limpamos o cache e processamos
        filmesCache = [];
        querySnapshot.forEach((docSnap) => {
            filmesCache.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        // Essa função (que já criamos no passo anterior) vai apagar o skeleton
        // e desenhar os filmes reais
        renderizarLista();

    } catch (error) {
        console.error(error);
        listaDiv.innerHTML = "<p style='color:red'>Erro ao carregar.</p>";
    }
}

// --- NOVA FUNÇÃO: RENDERIZAR (FILTRO + ORDENAÇÃO + HTML) ---
function renderizarLista() {
    const listaDiv = document.getElementById('lista-filmes');
    const termoBusca = document.getElementById('inputBusca').value.toLowerCase();
    const tipoOrdenacao = document.getElementById('ordenacao').value;

    // 1. FILTRAR (Busca)
    let listaFiltrada = filmesCache.filter(filme => {
        return filme.titulo.toLowerCase().includes(termoBusca);
    });

    // 2. ORDENAR
    listaFiltrada.sort((a, b) => {
        // Ordenar por Nota
        if (tipoOrdenacao === 'melhores') return b.nota - a.nota; // Maior para menor
        if (tipoOrdenacao === 'piores') return a.nota - b.nota;   // Menor para maior
        
        // Ordenar por Data (assumindo que salvamos dataCriacao)
        // Se for antigo e não tiver data, joga pro final
        const dataA = a.dataCriacao || "2000-01-01";
        const dataB = b.dataCriacao || "2000-01-01";

        if (tipoOrdenacao === 'recentes') return dataB.localeCompare(dataA); // Novo -> Velho
        if (tipoOrdenacao === 'antigos') return dataA.localeCompare(dataB); // Velho -> Novo
    });

    // 3. DESENHAR HTML
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
                    ${htmlBotoes}
                </div>
                <p>${filme.comentario}</p>
            </div>
        `;
    });
}

// --- EVENTOS ---
// Escuta a digitação na busca
const inputBusca = document.getElementById('inputBusca');
if(inputBusca) {
    inputBusca.addEventListener('input', () => {
        renderizarLista(); // Redesenha a tela instantaneamente
    });
}

// Escuta a mudança no select de ordenação
const selectOrdenacao = document.getElementById('ordenacao');
if(selectOrdenacao) {
    selectOrdenacao.addEventListener('change', () => {
        renderizarLista(); // Redesenha a tela instantaneamente
    });
}

// Cliques (Editar/Excluir) - Mantido igual
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

carregarFilmes();