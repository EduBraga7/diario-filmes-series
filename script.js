// script.js

// 1. Imports (Adicionamos o updateDoc)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. CONFIGURAÇÃO (Mantenha a sua!)
const firebaseConfig = {
    apiKey: "AIzaSyAZwhqL_imThXiLfD6rz8IH2vsBumZ3NP4",
    authDomain: "meusfilmesmvp.firebaseapp.com",
    projectId: "meusfilmesmvp",
    storageBucket: "meusfilmesmvp.firebasestorage.app",
    messagingSenderId: "300707148312",
    appId: "1:300707148312:web:16525fbfdfb6bf8b58896d"
};

// Inicializando
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// VARIAVEL DE CONTROLE DE ESTADO
// Se estiver null, estamos criando. Se tiver um ID, estamos editando.
let idParaEditar = null;

// 3. FUNÇÃO ÚNICA PARA SALVAR OU ATUALIZAR
const btnSalvar = document.getElementById('btnSalvar');

btnSalvar.addEventListener('click', async () => {
    // Pega os valores dos inputs
    const titulo = document.getElementById('titulo').value;
    const nota = document.getElementById('nota').value;
    const comentario = document.getElementById('comentario').value;

    if (titulo === "") return alert("O filme precisa de um título!");

    try {
        if (idParaEditar == null) {
            // --- MODO CRIAR (CREATE) ---
            await addDoc(collection(db, "filmes"), {
                titulo: titulo,
                nota: nota,
                comentario: comentario,
                data: new Date()
            });
            alert("Filme salvo!");
        } else {
            // --- MODO ATUALIZAR (UPDATE) ---
            // Atualiza apenas os campos que mudaram naquele ID específico
            const filmeRef = doc(db, "filmes", idParaEditar);
            await updateDoc(filmeRef, {
                titulo: titulo,
                nota: nota,
                comentario: comentario
            });
            alert("Filme atualizado!");

            // Volta o botão e a variável ao estado original
            idParaEditar = null;
            document.getElementById('btnSalvar').innerText = "Salvar Filme";
            document.getElementById('btnSalvar').style.backgroundColor = "#007bff"; // Volta a cor azul
        }

        // Limpa o formulário e recarrega
        document.getElementById('titulo').value = "";
        document.getElementById('nota').value = "";
        document.getElementById('comentario').value = "";
        carregarFilmes();

    } catch (e) {
        console.error("Erro: ", e);
        alert("Erro ao processar.");
    }
});

// 4. FUNÇÃO CARREGAR FILMES
async function carregarFilmes() {
    const listaDiv = document.getElementById('lista-filmes');
    listaDiv.innerHTML = "";

    try {
        const querySnapshot = await getDocs(collection(db, "filmes"));

        if (querySnapshot.empty) {
            listaDiv.innerHTML = "<p>Nenhum filme cadastrado.</p>";
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const filme = docSnap.data();
            const id = docSnap.id;

            // Dica: Guardamos os dados originais nos atributos data-titulo, data-nota...
            // Isso facilita muito para "pescar" esses dados quando clicarmos em editar
            listaDiv.innerHTML += `
                <div class="filme-card">
                    <div class="card-header">
                        <h3>${filme.titulo} <span class="nota">★ ${filme.nota}</span></h3>
                        <div>
                            <button class="btn-edit" 
                                data-id="${id}" 
                                data-titulo="${filme.titulo}"
                                data-nota="${filme.nota}"
                                data-comentario="${filme.comentario}">
                                ✏️
                            </button>
                            <button class="btn-delete" data-id="${id}">🗑️</button>
                        </div>
                    </div>
                    <p>${filme.comentario}</p>
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
        listaDiv.innerHTML = "<p>Erro ao carregar filmes.</p>";
    }
}

// 5. OUVINTE DE CLIQUES NA LISTA (EDITAR E DELETAR)
const listaDiv = document.getElementById('lista-filmes');

listaDiv.addEventListener('click', async (e) => {
    const elemento = e.target;

    // --- LÓGICA DE DELETAR ---
    if (elemento.classList.contains('btn-delete')) {
        const id = elemento.getAttribute('data-id');
        if (confirm("Quer mesmo apagar?")) {
            await deleteDoc(doc(db, "filmes", id));
            carregarFilmes();
        }
    }

    // --- LÓGICA DE EDITAR ---
    if (elemento.classList.contains('btn-edit')) {
        // 1. Pega os dados que escondemos no botão
        const id = elemento.getAttribute('data-id');
        const titulo = elemento.getAttribute('data-titulo');
        const nota = elemento.getAttribute('data-nota');
        const comentario = elemento.getAttribute('data-comentario');

        // 2. Preenche o formulário lá em cima
        document.getElementById('titulo').value = titulo;
        document.getElementById('nota').value = nota;
        document.getElementById('comentario').value = comentario;

        // 3. Muda o estado da aplicação para "Modo Edição"
        idParaEditar = id; // Agora a variável global sabe quem estamos editando

        // 4. Muda o visual do botão para o usuário entender
        const btn = document.getElementById('btnSalvar');
        btn.innerText = "Atualizar Filme";
        btn.style.backgroundColor = "#28a745"; // Verde para indicar atualização

        // Joga a tela para o topo para ver o formulário
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Carrega inicial
carregarFilmes();