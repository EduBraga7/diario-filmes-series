// script.js - VERSÃO COM MODO VISITANTE E ADMIN

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

// --- 1. VERIFICAÇÃO DE ADMINISTRAÇÃO (O SEGREDO) ---
// Verifica se o link tem "?modo=admin" no final
const params = new URLSearchParams(window.location.search);
const souAdmin = params.get('modo') === 'admin';

// Se NÃO for admin, esconde o formulário de cadastro imediatamente
if (!souAdmin) {
    const formulario = document.getElementById('formulario');
    if (formulario) {
        formulario.style.display = 'none'; // Some com o formulário
    }
}

// --- SALVAR / ATUALIZAR ---
const btnSalvar = document.getElementById('btnSalvar');

if (btnSalvar) {
    btnSalvar.addEventListener('click', async () => {
        // Se um espertinho tentar habilitar o botão, bloqueamos aqui também
        if (!souAdmin) return alert("Modo apenas visualização!");

        const tipo = document.getElementById('tipo').value; 
        const titulo = document.getElementById('titulo').value;
        const linkImagem = document.getElementById('linkImagem').value;
        const nota = document.getElementById('nota').value;
        const comentario = document.getElementById('comentario').value;

        if(titulo === "") return alert("O filme precisa de um título!");

        try {
            if (idParaEditar == null) {
                // CRIAR
                await addDoc(collection(db, "filmes"), {
                    tipo: tipo, 
                    titulo: titulo,
                    linkImagem: linkImagem,
                    nota: nota,
                    comentario: comentario,
                    data: new Date()
                });
                alert("Salvo com sucesso!");
            } else {
                // ATUALIZAR
                const filmeRef = doc(db, "filmes", idParaEditar);
                await updateDoc(filmeRef, {
                    tipo: tipo,
                    titulo: titulo,
                    linkImagem: linkImagem,
                    nota: nota,
                    comentario: comentario
                });
                alert("Atualizado com sucesso!");
                
                idParaEditar = null;
                btnSalvar.innerText = "Salvar Item";
                btnSalvar.style.backgroundColor = ""; 
            }

            // LIMPAR
            document.getElementById('tipo').value = "Filme";
            document.getElementById('titulo').value = "";
            document.getElementById('linkImagem').value = "";
            document.getElementById('nota').value = "";
            document.getElementById('comentario').value = "";
            carregarFilmes();

        } catch (e) {
            console.error("Erro: ", e);
            alert("Erro: " + e.message);
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
            
            // Imagem
            let htmlImagem = "";
            if(filme.linkImagem && filme.linkImagem !== "") {
                htmlImagem = `<img src="${filme.linkImagem}" class="capa-filme">`;
            }

            // Badge
            const tipoItem = filme.tipo || "Filme"; 
            let classeBadge = "badge-filme";
            if(tipoItem === "Série") classeBadge = "badge-serie";
            if(tipoItem === "Anime") classeBadge = "badge-anime";

            // --- LÓGICA DO ADMIN: MONTAR OS BOTÕES OU NÃO ---
            let htmlBotoes = "";
            
            // Só cria o HTML dos botões se for admin
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

            // CARD FINAL
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

// --- EVENTOS DE CLIQUE (EDITAR/EXCLUIR) ---
const listaDiv = document.getElementById('lista-filmes');
if (listaDiv) {
    listaDiv.addEventListener('click', async (e) => {
        // Se não for admin, nem tenta processar cliques
        if (!souAdmin) return;

        const el = e.target.closest('button'); 
        if (!el) return;

        if(el.classList.contains('btn-delete')) {
            const id = el.getAttribute('data-id');
            if(confirm("Quer apagar este item?")) {
                await deleteDoc(doc(db, "filmes", id));
                carregarFilmes();
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
            
            // Se o formulário estiver oculto (bug), mostramos
            document.getElementById('formulario').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

// --- BUSCA (Funciona para todos) ---
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