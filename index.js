const express = require('express');
const db = require('./db');
//ver a questão do teste no terminal, pedir os comandos, e se ele trabalha com mais de um termina, que no caso é o  código abaixo.
//Exemplo de comando CURL: curl -X PUT "http://localhost:3000/tarefa/atualizar" -H "Content-Type: application/jso?id=-1" -d '{"descricao": "Declaracoes", "id_colaborador": 3}'
//temos que arrumar a questão dos campos obrigatórios na hora de cadastrar, pois o nosso código diferentemente do professor ,todos os campos são obrigatórios, temos que arrumar a msg de erro referente a esse caso também.
//ver se da para colocar uma restrição para colaborador não receber uma tarefa repetida
const app = express();

app.use(express.json());

// CRUD Colaboradores

app.post('/colaborador/cadastrar', async (req, res) => {
    try {
        const { nome, email, departamento } = req.body;
        if (nome && email) {                                                                                //só é passado aqui os campos obrigatórios
            const [result] = await db.query(
                'INSERT INTO Colaboradores (nome, email, departamento) VALUES (?, ?, ?)',
                [nome, email, departamento]
            );
            // Status: OK
            return res.status(200).json({
                message: `Colaborador ${nome} cadastrado com sucesso!`,
                id: result.insertId                                                                          //pegando de result(l 12) o insertid. id recebera o resulta . Que é o id do colaborador criado. Isso é uma boa pratica a se fazer no backend , para facilitar a vida do frontend.
            });
        }
        // Status: Unprocessable Entity
        return res.status(422).send(`Faltando argumentos: ${!nome ? 'nome' : ''}${!nome && !email ? ' e ' : ''}${!email ? 'email' : ''}`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
});

app.get('/colaborador/listar', async (req, res) => {                                                     //posso colocar uma msg caso não tenha nenhum colaborador no array 
    try {
        const [rows] = await db.query(
            'SELECT * FROM Colaboradores'
        );
        // Status: OK
        return res.status(200).send(rows);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
});

app.get('/colaborador/consultar', async (req, res) => {
    try {
        const { id } = req.query;
        console.log(id)
        if (!id) {                                                                                    
            return res.status(400).send("ID do colaborador precisa ser informado.")
        }
        const [row] = await db.query(
            'SELECT nome, email, departamento FROM Colaboradores WHERE id = ?',
            [id]
        );
        if (row.length < 1) {                                                                                //se row(l 48) for menor que 1 , quer dizer que não recebeu nenhum id (comprimento de array vazio), ai entrara nesse erro
            return res.status(404).send(`Colaborador de id=${id} não encontrado.`)
        }
        // Status: OK
        return res.status(200).send(row[0]);                                                                 //usamos isso "row[0]" pois row retorna um objeto dentro de array([{}]), ai para tirar esse objeto de dentro de array fazemos isso "row[0]"
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
});

app.put('/colaborador/atualizar', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).send("ID do colaborador precisa ser informado.")
        }
        const { nome, email, departamento } = req.body;
        const [row] = await db.query("SELECT * FROM Colaboradores WHERE id=?", [id]);
        if (row.length < 1) {
            return res.status(404).send(`Colaborador de id=${id} não encontrado.`)
        }
        const [result] = await db.query(
            "UPDATE Colaboradores SET nome = ?, email = ?, departamento = ? WHERE id = ?",                    //falar para o professor mostrar aquelas operações que ele fez no terminal , referente null e undefined
            [nome ?? row[0]?.nome, email ?? row[0]?.email, departamento ?? row[0]?.departamento, id]          //aqui esta verificando se veiu valo em nome(l 76) se veiu blz ai passara o valor para a atualização, caso não venha ,pegara o valor que ja estava no "row l 77" (row[0]?.nome) . E esse "?" que vem entre row e .nome , é para o caso de "row.nome" estiver sem valor , ai passara para o update o valor de null em vez de undefined , pq se passar undefined ira dar erro 
        );
        // Status: OK
        return res.send(`Colaborador de id=${id} atualizado com sucesso!`);
    }
    catch (e) {
        // Status: Internal Server Error                                                              
        return res.status(500).send(e);
    }
})

app.delete('/colaborador/deletar', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).send("ID do colaborador precisa ser informado.")
        }
        const [result] = await db.query("DELETE FROM Colaboradores WHERE id=?", [id]);
        // Status: OK
        if (result.affectedRows > 0) {                                                                        //conferindo em result(l 87) se teve linha afetada, pois se tiver é pq foi deletado com sucesso
            return res.status(200).send(`Colaborador de id=${id} deletado com sucesso!`);
        }
        return res.status(404).send(`Colaborador de id=${id} não encontrado`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
})


// CRUD Projetos

app.post('/projeto/cadastrar', async (req, res) => {
    try {
        const { nome, data_inicio, data_termino, descricao } = req.body;
        if (nome && data_inicio) {
            const [result] = await db.query(
                'INSERT INTO Projetos (nome, data_inicio, data_termino, descricao) VALUES (?, ?, ?, ?)',
                [nome, data_inicio, data_termino, descricao]
            );
            // Status: OK
            return res.status(200).json({
                message: `Projeto ${nome} cadastrado com sucesso!`,
                id: result.insertId
            });
        }
        // Status: Unprocessable Entity
        return res.status(422).send(`Faltando argumentos: ${!nome ? 'nome' : ''}${!nome && !data_inicio ? ' e ' : ''}${!data_inicio ? 'data_inicio' : ''}`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
});

app.get('/projeto/listar', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM Projetos'
        );
        // Status: OK
        return res.status(200).send(rows);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
});

app.get('/projeto/consultar', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).send("ID do projeto precisa ser informado.")
        }
        const [row] = await db.query(
            'SELECT nome, status, data_inicio, data_termino, descricao FROM Projetos WHERE id = ?',
            [id]
        );
        if (row.length < 1) {
            return res.status(404).send(`Projeto de id ${id} não encontrado`);
        }
        // Status: OK
        return res.status(200).send(row[0]);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
});

app.put('/projeto/atualizar', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).send("ID do projeto precisa ser informado.")
        }
        const { nome, status, data_inicio, data_termino, descricao } = req.body;
        const [row] = await db.query("SELECT * FROM Projetos WHERE id=?", [id]);
        if (row.length < 1) {
            // Status: Not Found
            return res.status(404).send(`Projeto de id=${id} não encontrado.`)
        }
        const [result] = await db.query(
            "UPDATE Projetos SET nome = ?, status = ?, data_inicio = ?, data_termino = ?, descricao = ? WHERE id = ?",
            [
                nome ?? row[0]?.nome,
                status ?? row[0]?.status,
                data_inicio ?? row[0]?.data_inicio,
                data_termino ?? row[0]?.data_termino,
                descricao ?? row[0]?.descricao,
                id]
        );
        // Status: OK
        return res.send(`Projeto de id=${id} atualizado com sucesso!`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
})

app.delete('/projeto/deletar', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            // Status: Bad Request
            return res.status(400).send("ID do projeto precisa ser informado.")
        }
        const [result] = await db.query("DELETE FROM Projetos WHERE id=?", [id]);
        if (result.affectedRows > 0) {
            // Status: OK
            return res.status(200).send(`Projeto de id=${id} deletado com sucesso!`);
        }
        // Status: Not Found
        return res.status(404).send(`Projeto de id=${id} não encontrado.`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
})


// CRUD Equipes

app.post('/equipe/cadastrar', async (req, res) => {
    try {
        const { nome, descricao } = req.body;
        if (nome) {
            const [result] = await db.query(
                'INSERT INTO Equipes (nome, descricao) VALUES (?, ?)',
                [nome, descricao]
            );
            // Status: OK
            return res.status(200).json({
                message: `Equipe ${nome} cadastrada com sucesso!`,
                id: result.insertId
            });
        }
        // Status: Unprocessable Entity
        return res.status(422).send(`Faltando argumentos: nome`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
});

app.get('/equipe/listar', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM Equipes'
        );
        // Status: OK
        return res.status(200).send(rows);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
});

app.get('/equipe/consultar', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).send("ID da equipe precisa ser informado.")
        }
        const [row] = await db.query(
            'SELECT nome, descricao FROM Equipes WHERE id = ?',
            [id]
        );
        if (row.length < 1) {
            return res.status(404).send(`Equipe de id=${id} não encontrada`);
        }
        // Status: OK
        return res.status(200).send(row[0]);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
});

app.put('/equipe/atualizar', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            // Status: Bad Request
            return res.status(400).send("ID do equipe precisa ser informado.")
        }
        const { nome, descricao } = req.body;
        const [row] = await db.query("SELECT * FROM Equipes WHERE id=?", [id]);
        if (row.length < 1) {
            // Status: Not Found
            return res.status(404).send(`Equipe de id=${id} não encontrada.`)
        }
        const [result] = await db.query(
            "UPDATE Equipes SET nome = ?, descricao = ? WHERE id = ?",
            [
                nome ?? row[0]?.nome,
                descricao ?? row[0]?.descricao,
                id
            ]
        );
        // Status: OK
        return res.status(200).send(`Equipe de id=${id} atualizada com sucesso!`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
})

app.delete('/equipe/deletar', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            // Status: Bad Request
            return res.status(400).send("ID da equipe precisa ser informado.")
        }
        const [result] = await db.query("DELETE FROM Equipes WHERE id=?", [id]);
        if (result.affectedRows > 0) {
            // Status: OK
            return res.status(200).send(`Equipe de id=${id} deletada com sucesso!`);
        }
        // Status: Not Found
        return res.status(404).send(`Equipe de id=${id} não encontrada.`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
})


// CRUD Tarefas

app.post('/tarefa/cadastrar', async (req, res) => {
    try {
        const { id_projeto, id_colaborador, titulo, status, prioridade, data_termino, descricao } = req.body;
        if (id_projeto && titulo) {
            const [result] = await db.query(
                'INSERT INTO Tarefas (id_projeto, id_colaborador, titulo, status, prioridade, data_termino, descricao) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    id_projeto,
                    id_colaborador,
                    titulo,
                    status ?? 'pendente',
                    prioridade ?? 'baixa',
                    data_termino,
                    descricao
                ]
            );
            // Status: OK
            return res.status(200).json({
                message: `Tarefa '${titulo}' cadastrada com sucesso!`,
                id: result.insertId
            });
        }
        // Status: Unprocessable Entity
        return res.status(422).send(`Faltando argumentos: ${!id_projeto ? 'id_projeto' : ''}${!id_projeto && !titulo ? ' e ' : ''}${!titulo ? 'titulo' : ''}`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
});

app.get('/tarefa/listar', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM Tarefas'
        );
        // Status: OK
        return res.status(200).send(rows);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
});

app.get('/tarefa/consultar', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            // Status: Bad Request
            return res.status(400).send("ID da tarefa precisa ser informado.")
        }
        const [row] = await db.query(
            'SELECT id_projeto, id_colaborador, titulo, status, prioridade, data_termino, descricao FROM Tarefas WHERE id = ?',
            [id]
        );
        if (row.length < 1) {
            // Status: Not Found
            return res.status(404).send(`Tarefa de id=${id} não encontrada`);
        }
        // Status: OK
        return res.status(200).send(row[0]);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
});

app.put('/tarefa/atualizar', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            // Status: Bad Request
            return res.status(400).send("ID do tarefa precisa ser informado.")
        }
        const { id_colaborador, titulo, status, prioridade, data_termino, descricao } = req.body;
        const [row] = await db.query("SELECT * FROM Tarefas WHERE id=?", [id]);
        if (row.length < 1) {
            // Status: Not Found
            return res.status(404).send(`Tarefa de id=${id} não encontrada.`)
        }
        const [result] = await db.query(
            "UPDATE Tarefas SET id_colaborador = ?, titulo = ?, status = ?, prioridade = ?, data_termino = ?, descricao = ? WHERE id = ?",
            [
                id_colaborador ?? row[0]?.id_colaborador,
                titulo ?? row[0]?.titulo,
                status ?? row[0]?.status,
                prioridade ?? row[0]?.prioridade,
                data_termino ?? row[0]?.data_termino,
                descricao ?? row[0]?.descricao,
                id
            ]
        );
        // Status: OK
        return res.status(200).send(`Tarefa de id=${id} atualizada com sucesso!`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
})

app.delete('/tarefa/deletar', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            // Status: Bad Request
            return res.status(400).send("ID da tarefa precisa ser informado.")
        }
        const [result] = await db.query("DELETE FROM Tarefas WHERE id=?", [id]);
        if (result.affectedRows > 0) {
            // Status: OK
            return res.status(200).send(`Tarefa de id=${id} deletada com sucesso!`);
        }
        // Status: Not Found
        return res.status(404).send(`Tarefa de id=${id} não encontrada.`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).send(e);
    }
})

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
