
// Banco de dados local para testes
const STORAGE_USERS = 'meuespaco_users';
const STORAGE_SESSION = 'meuespaco_session';

// Atalho para selecionar elementos HTML
const $ = (selector) => document.querySelector(selector);

const page = document.body.dataset.page;

// Buscar usuários cadastrados
function getUsers() {
    try {
        const users = JSON.parse(
            localStorage.getItem(STORAGE_USERS) || '[]'
        );

        return Array.isArray(users) ? users : [];
    } catch {
        return [];
    }
}

// Mostrar mensagens na tela
function showAlert(message, type = 'error') {
    const alert = $('#alert');

    if (!alert) return;

    alert.textContent = message;
    alert.className = `alert visible ${type}`;
}

// Mostrar e ocultar senhas
document.querySelectorAll('[data-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
        const input = document.getElementById(
            button.dataset.toggle
        );

        const showing = input.type === 'password';

        input.type = showing ? 'text' : 'password';
        button.textContent = showing ? 'Ocultar' : 'Mostrar';
    });
});


// ===================================
// SISTEMA DE CADASTRO
// ===================================

if (page === 'cadastro') {

    const formCadastro = $('#registerForm');

    formCadastro.addEventListener('submit', function(event) {
        event.preventDefault();

        const name = $('#name').value.trim();
        const email = $('#email').value.trim().toLowerCase();
        const password = $('#password').value;
        const confirmPassword = $('#confirmPassword').value;

        // Verificar nome
        if (name.length < 2) {
            return showAlert('Digite um nome válido.');
        }

        // Verificar senha
        if (password.length < 6) {
            return showAlert(
                'Sua senha deve ter pelo menos 6 caracteres.'
            );
        }

        // Conferir as duas senhas
        if (password !== confirmPassword) {
            return showAlert('As senhas não são iguais!');
        }

        // Buscar usuários já existentes
        const users = getUsers();

        // Impedir e-mails repetidos
        const emailExistente = users.some(
            (user) => user.email === email
        );

        if (emailExistente) {
            return showAlert('Esse e-mail já está cadastrado!');
        }

        // Criar o novo usuário
        const novoUsuario = {
            name: name,
            email: email,
            password: password
        };

        users.push(novoUsuario);

        // Salvar no navegador
        try {
            localStorage.setItem(
                STORAGE_USERS,
                JSON.stringify(users)
            );

            showAlert(
                'Cadastro realizado com sucesso!',
                'success'
            );

            formCadastro.reset();

            // Voltar ao login
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 900);

        } catch {
            showAlert('Erro ao salvar seu cadastro.');
        }
    });
}



// ===================================
// SISTEMA DE LOGIN
// ===================================

if (page === 'login') {

    const formLogin = $('#loginForm');

    const MAX_TENTATIVAS = 5;
    const TEMPO_BLOQUEIO = 5 * 60 * 1000;

    const CHAVE_TENTATIVAS = 'meuespaco_tentativas';
    const CHAVE_BLOQUEIO = 'meuespaco_bloqueio';

    let tentativas = Number(
        localStorage.getItem(CHAVE_TENTATIVAS)
    ) || 0;

    let bloqueadoAte = Number(
        localStorage.getItem(CHAVE_BLOQUEIO)
    ) || 0;

    // Zerar tentativas e bloqueio
    function limparTentativas() {
        tentativas = 0;
        bloqueadoAte = 0;

        localStorage.removeItem(CHAVE_TENTATIVAS);
        localStorage.removeItem(CHAVE_BLOQUEIO);
    }

    // Verificar bloqueio
    function verificarBloqueio() {

        const restante = bloqueadoAte - Date.now();

        if (restante > 0) {

            const minutos = Math.floor(restante / 60000);
            const segundos = Math.ceil(
                (restante % 60000) / 1000
            );

            const tempo =
                `${minutos}:${String(segundos).padStart(2, '0')}`;

            showAlert(
                `Login bloqueado! Aguarde ${tempo} para tentar novamente.`
            );

            return true;
        }

        if (bloqueadoAte > 0) {
            limparTentativas();

            showAlert(
                'Bloqueio encerrado! Tente novamente.',
                'success'
            );
        }

        return false;
    }

    // Verificar bloqueio ao abrir
    verificarBloqueio();

    // Atualizar o contador
    setInterval(() => {
        if (bloqueadoAte > 0) {
            verificarBloqueio();
        }
    }, 1000);

    // EVENTO ORIGINAL DE LOGIN
    formLogin.addEventListener('submit', function(event) {
        event.preventDefault();

        // Impedir acesso se estiver bloqueado
        if (verificarBloqueio()) {
            return;
        }

        const email = $('#email').value.trim().toLowerCase();
        const password = $('#password').value;

        // Buscar usuário cadastrado
        const user = getUsers().find((item) => {
            return (
                item.email === email &&
                item.password === password
            );
        });

        // LOGIN INCORRETO
        if (!user) {

            tentativas++;

            localStorage.setItem(
                CHAVE_TENTATIVAS,
                tentativas
            );

            if (tentativas >= MAX_TENTATIVAS) {

                bloqueadoAte = Date.now() + TEMPO_BLOQUEIO;

                localStorage.setItem(
                    CHAVE_BLOQUEIO,
                    bloqueadoAte
                );

                verificarBloqueio();
                return;
            }

            const restantes = MAX_TENTATIVAS - tentativas;

            showAlert(
                `E-mail ou senha incorretos! Restam ${restantes} tentativas.`
            );

            return;
        }

        // LOGIN CORRETO
        limparTentativas();

        try {
            sessionStorage.setItem(
                STORAGE_SESSION,
                JSON.stringify({
                    name: user.name,
                    email: user.email
                })
            );

            // Entrar no portal
            window.location.href = 'home.html';

        } catch {
            showAlert('Erro ao realizar o login.');
        }
    });
}



// ===================================
// TELA DE BOAS-VINDAS
// ===================================

if (page === 'home') {

    let session = null;

    try {
        session = JSON.parse(
            sessionStorage.getItem(STORAGE_SESSION) || 'null'
        );
    } catch {
        session = null;
    }

    // Impedir acesso sem login
    if (!session || !session.email || !session.name) {
        window.location.replace('index.html');
    } else {

        // Mostrar primeiro nome do usuário
        const primeiroNome = session.name.split(' ')[0];

        $('#welcomeName').textContent = primeiroNome;

        // Função para sair
        function logout() {
            sessionStorage.removeItem(STORAGE_SESSION);

            window.location.href = 'index.html';
        }

        // Botões de sair
        $('#logoutBtn').addEventListener('click', logout);

        $('#logoutMainBtn').addEventListener('click', logout);
    }
}
