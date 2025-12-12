// script.js - VERSÃO COM TOAST NOTIFICATIONS 🍞

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

// --- VERIFICAÇÃO DE ADMIN ---
const params = new URLSearchParams(window.location.search);
const souAdmin = params.get('modo') === 'admin';

if (!souAdmin) {
    const formulario = document.getElementById('formulario');
    if (formulario) formulario.style.display = 'none';
}

// --- FUNÇÃO DE NOTIFICAÇÃO (TOAST) ---
// type pode ser: 'sucesso', 'erro' ou 'aviso'
function exibirToast(mensagem, tipo = 'sucesso') {
    const container = document.getElementById('toast-container');
    
    // Cria o elemento visual
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    // Ícones bonitinhos baseados no tipo
    let icone = '✅';
    if(tipo === 'erro') icone = '❌';
    if(tipo === 'aviso') icone = '⚠️';

    toast.innerHTML = `<span>${icone}</span> ${mensagem}`;
    
    // Adiciona na tela
    container.appendChild(toast);

    // Remove automaticamente depois de 4 segundos
    setTimeout(() => {
        toast.style.animation = "fadeOut 0.5s forwards"; // Efeito de saída
        // Espera a animação terminar para remover do HTML
        setTimeout(() => {
            toast.remove();
        }, 500);
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

        // SUBSTITUI O ALERT DE VALIDAÇÃO
        if(titulo === "") return exibirToast("O item precisa de um título!", "aviso");

        try {
            if (idParaEditar == null) {
                // CRIAR
                await addDoc(collection(db, "filmes"), {
                    tipo, titulo, linkImagem, nota, comentario, data: new Date()
                });
                // SUBSTITUI O ALERT DE SUCESSO
                exibirToast("Item salvo com sucesso!", "sucesso");
            } else {
                // ATUALIZAR
                const filmeRef = doc(db, "filmes", idParaEditar);
                await updateDoc(filmeRef, {
                    tipo, titulo, linkImagem, nota, comentario
                });
                exibirToast("Item atualizado com sucesso!", "sucesso");
                
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
            exibirToast("Erro ao processar: " + e.message, "erro");
        }
    });
}

// --- CARREGAR FILMES ---
async function carregarFilmes() {
    const listaDiv = document.getElementById('lista-filmes');
    listaDiv.innerHTML = "<p>Carregando biblioteca...</p>";

    try {
        const querySnapshot = await getDocs(collection(db, "filmes"));
        listaDiv.innerHTML = ""; 

        if(querySnapshot.empty) {
            listaDiv.innerHTML = "<p>Nenhum item cadastrado.</p>";
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const filme = docSnap.data();
            const id = docSnap.id;
            
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
                            data-id="${id}" 
                            data-tipo="${tipoItem}"
                            data-titulo="${filme.titulo}"
                            data-imagem="${filme.linkImagem || ''}"
                            data-nota="${filme.nota}"
                            data-comentario="${filme.comentario}">
                            ✏️ Editar
                        </button>
                        <button class="btn-delete" data-id="${id}">🗑️ Excluir</button>
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

    } catch (error) {
        console.error(error);
        listaDiv.innerHTML = "<p style='color:red'>Erro ao carregar.</p>";
    }
}

// --- EVENTOS ---
const listaDiv = document.getElementById('lista-filmes');
if (listaDiv) {
    listaDiv.addEventListener('click', async (e) => {
        if (!souAdmin) return;
        const el = e.target.closest('button'); 
        if (!el) return;

        if(el.classList.contains('btn-delete')) {
            const id = el.getAttribute('data-id');
            // Mantive o confirm nativo aqui porque é uma ação perigosa
            // Fazer um modal de confirmação customizado seria a Opção 4 rs
            if(confirm("Tem certeza que quer apagar?")) {
                try {
                    await deleteDoc(doc(db, "filmes", id));
                    exibirToast("Item apagado!", "sucesso"); // TOAST AQUI
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
            
            exibirToast("Modo de edição ativado", "aviso"); // AVISO DE EDIÇÃO
        }
    });
}

const inputBusca = document.getElementById('inputBusca');
if(inputBusca) {
    inputBusca.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.filme-card');
        cards.forEach((card) => {
            const titulo = card.querySelector('h3').innerText.toLowerCase();
            card.style.display = titulo.includes(termo) ? 'flex' : 'none';
        });
    });
}

carregarFilmes();