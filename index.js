//rodar "docker start mysql-db" para inicializar nosso container "mysql-db"(nome do container) que é onde se encontra nosso banco (gestao_projetos), ai conseguimos passar dados através do insominia. Para trabalharmos diretamente pelo terminal temos que rodar também "docker exec -it mysql-db mysql -uroot -prootpassword". Lembrando que docker é onde fica nossos containers criados, para ver todos os containers que se encontram nele , rode "docker ps".
//ver a questão do teste no terminal, pedir os comandos, e se ele trabalha com mais de um termina, que no caso é o  código a frente. /Exemplo de comando CURL: curl -X PUT "http://localhost:3000/tarefa/atualizar" -H "Content-Type: application/jso?id=-1" -d '{"descricao": "Declaracoes", "id_colaborador": 3}'
//falar para o professor mostrar aquelas operações que ele fez no terminal , referente null e undefined. Pedir para Jadson explicar melhor aquele teste que ele fez , para ver se estava imprimindo o hello word, entre as linhas do codigo
//a pergunta 3 no final do código  ver com Jadson como da para resolver aquela questão só usando o mysql 

const { z } = require('zod')
const express = require('express');
const db = require('./db');

const app = express();

app.use(express.json());

const departamentos = [
    "TI", "Financeiro", "RH", "Comercial"
]

const BodyCadastroColaboradorSchema = z.object({
    nome: z.string({
        invalid_type_error: "O nome precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" }),
    email: z.string({ required_error: "Campo obrigatório" })
        .email({ message: "Endereço de email inválido" })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" }),
    departamento: z.enum(departamentos, { message: "Departamento inválido" })


})

app.post('/colaborador/cadastrar', async (req, res) => {
    try {
        const verificacaoBody = BodyCadastroColaboradorSchema.safeParse(req.body)
        if (verificacaoBody.success == false) return res.status(422).json({ error: verificacaoBody.error.format() });
        const { nome, email, departamento } = req.body;
        if (nome && email && departamento) {                                                                  //só é passado aqui os campos obrigatórios
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
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

app.get('/colaborador/listar', async (req, res) => {                                                        //posso colocar uma msg caso não tenha nenhum colaborador no array 
    try {
        const [rows] = await db.query(
            'SELECT * FROM Colaboradores'
        );
        // Status: OK
        return res.status(200).json(rows);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

const QueryConsultaIdSchema = z.object({
    id: z.string({
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" })
        .regex(/^\d+$/, { message: "Id tem que ser numérico" })

})

app.get('/colaborador/consultar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaIdSchema.safeParse(req.query)
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id } = req.query;
        const [row] = await db.query(
            'SELECT nome, email, departamento FROM Colaboradores WHERE id = ?',
            [id]
        );
        if (row.length < 1) {                                                                                //se row(l 48) for menor que 1 , quer dizer que não recebeu nenhum id (comprimento de array vazio), ai entrara nesse erro
            return res.status(404).json(`Colaborador de id=${id} não encontrado.`);
        }

        // Status: OK
        return res.status(200).json(row[0]);                                                                 //usamos isso "row[0]" pois row retorna um objeto dentro de array([{}]), ai para tirar esse objeto de dentro de array fazemos isso "row[0]"
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

const BodyAtualizarColaboradorSchema = z.object({
    nome: z.string({
        invalid_type_error: "O nome precisa ser do tipo string"

    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" })
        .optional(),
    email: z.string({ required_error: "Campo obrigatório" }).email({ message: "Endereço de email inválido" })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" })
        .optional(),
    departamento: z.enum(departamentos, { message: "Departamento inválido" })
        .optional()

})

app.put('/colaborador/atualizar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaIdSchema.safeParse(req.query)
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id } = req.query;
        const verificacaoBody = BodyAtualizarColaboradorSchema.safeParse(req.body)
        if (verificacaoBody.success == false) return res.status(422).json({ error: verificacaoBody.error.format() });
        const { nome, email, departamento } = req.body;
        const [row] = await db.query("SELECT * FROM Colaboradores WHERE id=?", [id]);
        if (row.length < 1) {
            return res.status(404).json(`Colaborador de id=${id} não encontrado.`)
        }
        const [result] = await db.query(
            "UPDATE Colaboradores SET nome = ?, email = ?, departamento = ? WHERE id = ?",
            [nome ?? row[0]?.nome, email ?? row[0]?.email, departamento ?? row[0]?.departamento, id]          //aqui esta verificando se veio valor em nome(l 76), se veio blz ai passara o valor para a atualização, caso não venha ,pegara o valor que ja estava no "row l 77" (row[0]?.nome) . E esse "?" que vem entre row e .nome , é para o caso de "row.nome" estiver sem valor , ai passara para o update o valor de null em vez de undefined , pq se passar undefined ira dar erro 
        );
        // Status: OK
        return res.json(`Colaborador de id=${id} atualizado com sucesso!`);
    }
    catch (e) {
        // Status: Internal Server Error                                                              
        return res.status(500).json(e);
    }
})

app.delete('/colaborador/deletar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaIdSchema.safeParse(req.query)
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id } = req.query;
        const [result] = await db.query("DELETE FROM Colaboradores WHERE id=?", [id]);
        // Status: OK
        if (result.affectedRows > 0) {                                                                        //conferindo em result(l 87) se teve linha afetada, pois se tiver é pq foi deletado com sucesso
            return res.status(200).json(`Colaborador de id=${id} deletado com sucesso!`);
        }
        return res.status(404).json(`Colaborador de id=${id} não encontrado`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
})

const BodyCadastroProjetoSchema = z.object({
    nome: z.string({
        invalid_type_error: "O nome precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" }),
    data_inicio: z.string({ message: "Campo obrigatório" })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida" }),
    data_termino: z.string({ message: "Campo obrigatório" })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida" }),
    descricao: z.string({
        invalid_type_error: "Descrição precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" }),

})

app.post('/projeto/cadastrar', async (req, res) => {
    try {
        const verificacaoBody = BodyCadastroProjetoSchema.safeParse(req.body)
        if (verificacaoBody.success == false) return res.status(422).json({ error: verificacaoBody.error.format() });
        const { nome, data_inicio, data_termino, descricao } = req.body;
        if (nome && data_inicio && data_termino && descricao) {
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
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

app.get('/projeto/listar', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM Projetos'
        );
        // Status: OK
        return res.status(200).json(rows);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

app.get('/projeto/consultar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaIdSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id } = req.query;
        const [row] = await db.query(
            'SELECT nome, data_inicio, data_termino, descricao FROM Projetos WHERE id = ?',
            [id]
        );
        if (row.length < 1) {
            return res.status(404).json(`Projeto de id ${id} não encontrado`);
        }
        // Status: OK
        return res.status(200).json(row[0]);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

const BodyAtualizarProjetoSchema = z.object({
    nome: z.string({
        invalid_type_error: "O nome precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" })
        .optional(),
    data_inicio: z.string({ message: "Campo obrigatório" })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida" })
        .optional(),
    data_termino: z.string({ message: "Campo obrigatório" })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida" })
        .optional(),
    descricao: z.string({
        invalid_type_error: "Descrição precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" })
        .optional()

})

app.put('/projeto/atualizar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaIdSchema.safeParse(req.query)
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id } = req.query;
        const verificacaoBody = BodyAtualizarProjetoSchema.safeParse(req.body);
        if (verificacaoBody.success == false) return res.status(422).json({ error: verificacaoBody.error.format() });
        const { nome, data_inicio, data_termino, descricao } = req.body;
        const [row] = await db.query("SELECT * FROM Projetos WHERE id=?", [id]);
        if (row.length < 1) {
            // Status: Not Found
            return res.status(404).json(`Projeto de id=${id} não encontrado.`);
        }
        const [result] = await db.query(
            "UPDATE Projetos SET nome = ?, data_inicio = ?, data_termino = ?, descricao = ? WHERE id = ?",
            [
                nome ?? row[0]?.nome,
                data_inicio ?? row[0]?.data_inicio,
                data_termino ?? row[0]?.data_termino,
                descricao ?? row[0]?.descricao,
                id]
        );
        // Status: OK
        return res.json(`Projeto de id=${id} atualizado com sucesso!`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
})

app.delete('/projeto/deletar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaIdSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id } = req.query;
        const [result] = await db.query("DELETE FROM Projetos WHERE id=?", [id]);
        if (result.affectedRows > 0) {
            // Status: OK
            return res.status(200).json(`Projeto de id=${id} deletado com sucesso!`);
        }
        // Status: Not Found
        return res.status(404).json(`Projeto de id=${id} não encontrado.`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
})


const BodyCadastroEquipeSchema = z.object({
    nome: z.string({
        invalid_type_error: "O nome precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" }),
    descricao: z.string({
        invalid_type_error: "Descrição precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" }),

})

app.post('/equipe/cadastrar', async (req, res) => {
    try {
        const verificacaoBody = BodyCadastroEquipeSchema.safeParse(req.body);
        if (verificacaoBody.success == false) return res.status(422).json({ error: verificacaoBody.error.format() });
        const { nome, descricao } = req.body;
        if (nome && descricao) {
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
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

app.get('/equipe/listar', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM Equipes'
        );
        // Status: OK
        return res.status(200).json(rows);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

app.get('/equipe/consultar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaIdSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id } = req.query;
        const [row] = await db.query(
            'SELECT nome, descricao FROM Equipes WHERE id = ?',
            [id]
        );
        if (row.length < 1) {
            return res.status(404).json(`Equipe de id=${id} não encontrada`);
        }
        // Status: OK
        return res.status(200).json(row[0]);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

const BodyAtualizarEquipeSchema = z.object({
    nome: z.string({
        invalid_type_error: "O nome precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" })
        .optional(),
    descricao: z.string({
        invalid_type_error: "Descrição precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" })
        .optional(),

})

app.put('/equipe/atualizar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaIdSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id } = req.query;
        const verificacaoBody = BodyAtualizarEquipeSchema.safeParse(req.body);
        if (verificacaoBody.success == false) return res.status(422).json({ error: verificacaoBody.error.format() });
        const { nome, descricao } = req.body;
        const [row] = await db.query("SELECT * FROM Equipes WHERE id=?", [id]);
        if (row.length < 1) {
            // Status: Not Found
            return res.status(404).json(`Equipe de id=${id} não encontrada.`);
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
        return res.status(200).json(`Equipe de id=${id} atualizada com sucesso!`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
})

app.delete('/equipe/deletar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaIdSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id } = req.query;
        const [result] = await db.query("DELETE FROM Equipes WHERE id=?", [id]);
        if (result.affectedRows > 0) {
            // Status: OK
            return res.status(200).json(`Equipe de id=${id} deletada com sucesso!`);
        }
        // Status: Not Found
        return res.status(404).json(`Equipe de id=${id} não encontrada.`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
})

const BodyCadastroTarefaSchema = z.object({
    id_projeto: z.number({
        invalid_type_error: "Id precisa ser de tipo numérico",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" }),
    id_colaborador: z.number({
        invalid_type_error: "Id precisa ser de tipo numérico",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" }),
    titulo: z.string({
        invalid_type_error: "Titulo precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" }),
    status: z.string({
        invalid_type_error: "Status precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" })
        .optional(),
    prioridade: z.string({
        invalid_type_error: "Prioridade precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" })
        .optional(),
    data_termino: z.string({ message: "Campo obrigatório" })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida" }),
    descricao: z.string({
        invalid_type_error: "Descrição precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" }),

})

app.post('/tarefa/cadastrar', async (req, res) => {
    try {
        const verificacaoBody = BodyCadastroTarefaSchema.safeParse(req.body);
        if (verificacaoBody.success == false) return res.status(422).json({ error: verificacaoBody.error.format() });
        const { id_projeto, id_colaborador, titulo, status, prioridade, data_termino, descricao } = req.body;
        const [row] = await db.query(
            "select Alocacoes.id_equipe from Membros  inner join Equipes on Equipes.id = Membros.id_equipe inner join Alocacoes on Equipes.id = Alocacoes.id_equipe where id_projeto= ? and id_colaborador= ?;"
            , [id_projeto, id_colaborador]
        );
        if (row.length < 1) {
            // Status: Not Found
            return res.status(404).json(`Colaborador não pertence a este projeto.`);
        }
        if (id_projeto && id_colaborador && titulo && data_termino && descricao) {
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
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

app.get('/tarefa/listar', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM Tarefas'
        );
        // Status: OK
        return res.status(200).json(rows);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

app.get('/tarefa/consultar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaIdSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id } = req.query;
        const [row] = await db.query(
            'SELECT id_projeto, id_colaborador, titulo, status, prioridade, data_termino, descricao FROM Tarefas WHERE id = ?',
            [id]
        );
        if (row.length < 1) {
            // Status: Not Found
            return res.status(404).json(`Tarefa de id=${id} não encontrada`);
        }
        // Status: OK
        return res.status(200).json(row[0]);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

const BodyAtualizarTarefaSchema = z.object({
    id_projeto: z.number({
        invalid_type_error: "Id precisa ser de tipo numérico",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" })
        .optional(),
    id_colaborador: z.number({
        invalid_type_error: "Id precisa ser de tipo numérico",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" })
        .optional(),
    titulo: z.string({
        invalid_type_error: "Titulo precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" })
        .optional(),
    status: z.string({
        invalid_type_error: "Status precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" })
        .optional(),
    prioridade: z.string({
        invalid_type_error: "Prioridade precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" })
        .optional(),
    data_termino: z.string({ message: "Campo obrigatório" })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida" })
        .optional(),
    descricao: z.string({
        invalid_type_error: "Descrição precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" })
        .optional(),

})

app.put('/tarefa/atualizar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaIdSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id } = req.query;
        const verificacaoBody = BodyAtualizarTarefaSchema.safeParse(req.body);
        if (verificacaoBody.success == false) return res.status(422).json({ error: verificacaoBody.error.format() });
        const { id_projeto, id_colaborador, titulo, status, prioridade, data_termino, descricao } = req.body;
        const [row] = await db.query("SELECT * FROM Tarefas WHERE id=?", [id]);
        if (row.length < 1) {
            // Status: Not Found
            return res.status(404).json(`Tarefa de id=${id} não encontrada.`);
        }
        const [result] = await db.query(
            "UPDATE Tarefas SET id_projeto = ?, id_colaborador = ?, titulo = ?, status = ?, prioridade = ?, data_termino = ?, descricao = ? WHERE id = ?",
            [
                id_projeto ?? row[0]?.id_projeto,
                id_colaborador ?? row[0]?.id_colaborador,
                titulo ?? row[0]?.titulo,
                status ?? row[0]?.status,
                prioridade ?? row[0]?.prioridade,
                data_termino ?? row[0]?.data_termino,
                descricao ?? row[0]?.descricao,
                id
            ]
        );
        console.log(result)
        // Status: OK
        return res.status(200).json(`Tarefa de id=${id} atualizada com sucesso!`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
})

app.delete('/tarefa/deletar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaIdSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id } = req.query;
        const [result] = await db.query("DELETE FROM Tarefas WHERE id=?", [id]);
        if (result.affectedRows > 0) {
            // Status: OK
            return res.status(200).json(`Tarefa de id=${id} deletada com sucesso!`);
        }
        // Status: Not Found
        return res.status(404).json(`Tarefa de id=${id} não encontrada.`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
})

const BodyCadastroMembroSchema = z.object({
    id_colaborador: z.number({
        invalid_type_error: "Id precisa ser de tipo numérico",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" }),
    id_equipe: z.number({
        invalid_type_error: "Id precisa ser de tipo numérico",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" }),
    cargo: z.string({
        invalid_type_error: "Cargo precisa ser do tipo string",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Não pode ter menos de 1 caractere" })
        .max(20, { message: "Não pode ter mais de 20 caracteres" }),
})

app.post('/colaborador/equipe/cadastrar', async (req, res) => {
    try {
        const verificacaoBody = BodyCadastroMembroSchema.safeParse(req.body);
        if (verificacaoBody.success == false) return res.status(422).json({ error: verificacaoBody.error.format() });
        const { id_colaborador, id_equipe, cargo } = req.body;
        if (id_colaborador && id_equipe && cargo) {
            const [result] = await db.query(
                'INSERT INTO Membros (id_colaborador, id_equipe, cargo) VALUES (?, ?, ?)',
                [id_colaborador, id_equipe, cargo]
            );
            // Status: OK
            return res.status(200).json({
                message: `Colaborador cadastrado a equipe`,
            });
        }
    }
    catch (e) {
        if (e.errno == 1062) return res.status(409).json({ mens: "Colaborador já pertence a esta equipe" });
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

app.get('/colaborador/equipe/listar', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT Membros.id_equipe as "id equipe", Equipes.nome as "equipe", Membros.id_colaborador as "id colaborador", Colaboradores.nome as "colaborador" , cargo FROM Membros inner join Colaboradores on Colaboradores.id = Membros.id_colaborador inner join Equipes on Equipes.id = Membros.id_equipe  '
        );
        // Status: OK
        return res.status(200).json(rows);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

const QueryConsultaMembroSchema = z.object({
    id_colaborador: z.string()
        .regex(/^\d+$/, { message: "Id tem que ser numérico" })
        .optional(),
    id_equipe: z.string()
        .regex(/^\d+$/, { message: "Id tem que ser numérico" })
        .optional()

})

//o endpoint abaixo ira consultar tanto colaborador vinculado as equipes, quanto equipes e seus colaboradores. Basta passar o id da cosulta desejada
app.get('/colaborador_equipe/equipe_colaborador/consultar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaMembroSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id_colaborador, id_equipe } = req.query;
        if (id_colaborador == undefined && id_equipe == undefined) {
            // Status: Bad Request
            return res.status(400).json("Precisa informar id colaborador ou id equipe.");
        }
        else if (id_colaborador != undefined && id_equipe != undefined) {
            const [row] = await db.query(
                'SELECT Membros.id_equipe as "id equipe", Equipes.nome as "equipe", Membros.id_colaborador as "id colaborador", Colaboradores.nome as "colaborador" , cargo FROM Membros inner join Colaboradores on Colaboradores.id = Membros.id_colaborador inner join Equipes on Equipes.id = Membros.id_equipe  WHERE id_colaborador = ? and id_equipe= ?',
                [id_colaborador, id_equipe]
            );
            if (row.length < 1) {
                // Status: Not Found
                return res.status(404).json(`Colaborador de id= ${id_colaborador} não é membro da equipe de id= ${id_equipe}`);
            }
            // Status: OK
            return res.status(200).json(row);
        }
        else if (id_equipe != undefined) {
            const [row] = await db.query(
                'SELECT Membros.id_equipe as "id equipe", Equipes.nome as "equipe", Membros.id_colaborador as "id colaborador", Colaboradores.nome as "colaborador" , cargo FROM Membros inner join Colaboradores on Colaboradores.id = Membros.id_colaborador inner join Equipes on Equipes.id = Membros.id_equipe  WHERE id_equipe= ?',
                [id_equipe]
            );
            if (row.length < 1) {
                // Status: Not Found
                return res.status(404).json(`Equipe de id= ${id_equipe} não tem nenhum colaborador`);
            }
            // Status: OK
            return res.status(200).json(row);
        }
        else {
            const [row] = await db.query(
                'SELECT Membros.id_equipe as "id equipe", Equipes.nome as "equipe", Membros.id_colaborador as "id colaborador", Colaboradores.nome as "colaborador" , cargo FROM Membros inner join Colaboradores on Colaboradores.id = Membros.id_colaborador inner join Equipes on Equipes.id = Membros.id_equipe  WHERE id_colaborador = ?',
                [id_colaborador]
            );
            if (row.length < 1) {
                // Status: Not Found
                return res.status(404).json(`Colaborador de id= ${id_colaborador} não pertence a nenhuma equipe`);
            }
            // Status: OK
            return res.status(200).json(row);
        }
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

const QueryMembroIdSchema = z.object({
    id_colaborador: z.string({
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" })
        .regex(/^\d+$/, { message: "Id tem que ser numérico" }),
    id_equipe: z.string({
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" })
        .regex(/^\d+$/, { message: "Id tem que ser numérico" })

})

const BodyAtualizarMembroSchema = z.object({
    id_colaborador: z.number({
        invalid_type_error: "Id precisa ser de tipo numérico",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" })
        .optional(),
    id_equipe: z.number({
        invalid_type_error: "Id precisa ser de tipo numérico",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" })
        .optional(),
    cargo: z.string({
        invalid_type_error: "Cargo precisa ser do tipo string"
    })
        .max(20, { message: "Não pode ter mais de 20 caracteres" })
        .optional()
})

app.put('/colaborador/equipe/atualizar', async (req, res) => {
    try {
        const verificacaoQuery = QueryMembroIdSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id_colaborador, id_equipe } = req.query;
        const verificacaoBody = BodyAtualizarMembroSchema.safeParse(req.body);
        if (verificacaoBody.success == false) return res.status(422).json({ error: verificacaoBody.error.format() });
        const { cargo } = req.body;
        const [row] = await db.query("SELECT * FROM Membros WHERE id_colaborador=? and id_equipe=?", [id_colaborador, id_equipe]);
        if (row.length < 1) {
            // Status: Not Found
            return res.status(404).json(`Colaborador de id=${id_colaborador} não pertence a equipe de id= ${id_equipe}.`);
        }
        const [result] = await db.query(
            "UPDATE Membros SET cargo = ? WHERE id_colaborador=? and id_equipe=? ",
            [
                cargo ?? row[0]?.cargo,
                id_colaborador,
                id_equipe
            ]
        );
        // Status: OK
        return res.status(200).json(`Cargo de colaborador de id=${id_colaborador} da equipe de id=${id_equipe} atualizado com sucesso!`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
})

app.delete('/colaborador/equipe/deletar', async (req, res) => {
    try {
        const verificacaoQuery = QueryMembroIdSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id_colaborador, id_equipe } = req.query;
        const [result] = await db.query(
            "DELETE FROM Membros WHERE id_colaborador=? and id_equipe=?", [id_colaborador, id_equipe]);
        if (result.affectedRows > 0) {
            // Status: OK
            return res.status(200).json(`Colaborador deletado da equipe com sucesso!`);
        }
        // Status: Not Found
        return res.status(404).json(`Colaborador não faz parte desta equipe.`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
})

const BodyCadastroAlocacaoSchema = z.object({
    id_equipe: z.number({
        invalid_type_error: "Id precisa ser de tipo numérico",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" }),
    id_projeto: z.number({
        invalid_type_error: "Id precisa ser de tipo numérico",
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" }),
})

app.post('/equipe/projeto/cadastrar', async (req, res) => {
    try {
        const verificacaoBody = BodyCadastroAlocacaoSchema.safeParse(req.body);
        if (verificacaoBody.success == false) return res.status(422).json({ error: verificacaoBody.error.format() });
        const { id_equipe, id_projeto } = req.body;
        if (id_equipe && id_projeto) {
            const [result] = await db.query(
                'INSERT INTO Alocacoes (id_equipe, id_projeto) VALUES (?, ?)',
                [id_equipe, id_projeto]
            );
            // Status: OK
            return res.status(200).json({
                message: `Equipe vinculada ao projeto`,
            });
        }
    }
    catch (e) {
        // Status: Internal Server Error
        if (e.errno == 1062) return res.status(409).json({ mens: "Equipe já esta vinculada a este projeto" });
        return res.status(500).json(e);
    }
});

app.get('/equipe/projeto/listar', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT Alocacoes.id_equipe as "id equipe" ,Equipes.nome as "equipes", Alocacoes.id_projeto as "id projeto" ,Projetos.nome as "projetos" FROM Alocacoes inner join Projetos on Projetos.id = Alocacoes.id_projeto inner join Equipes on Equipes.id = Alocacoes.id_equipe'
        );
        // Status: OK
        return res.status(200).json(rows);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

const QueryConsultaAlocacaoSchema = z.object({
    id_equipe: z.string()
        .regex(/^\d+$/, { message: "Id tem que ser numérico" })
        .optional(),
    id_projeto: z.string()
        .regex(/^\d+$/, { message: "Id tem que ser numérico" })
        .optional()

})

//o endpoint abaixo ira consultar tanto equipe vinculada as projetos, quanto projeto vinculado a equipes. Basta passar o id da consulta desejada
app.get('/equipe_projeto/projeto_equipe/consultar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaAlocacaoSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id_equipe, id_projeto } = req.query;
        if (id_equipe == undefined && id_projeto == undefined) {
            // Status: Bad Request
            return res.status(400).json("Precisa ser informado ID de equipe ou ID de projeto.");
        }
        else if (id_equipe != undefined && id_projeto != undefined) {
            const [row] = await db.query(
                'SELECT Alocacoes.id_equipe as "id equipe" ,Equipes.nome as "equipes", Alocacoes.id_projeto as "id projeto" ,Projetos.nome as "projetos" FROM Alocacoes inner join Projetos on Projetos.id = Alocacoes.id_projeto inner join Equipes on Equipes.id = Alocacoes.id_equipe WHERE id_equipe = ? and id_projeto= ?',
                [id_equipe, id_projeto]
            );
            if (row.length < 1) {
                // Status: Not Found
                return res.status(404).json(`Equipe de id= ${id_equipe} não é membro da projeto= ${id_projeto}`);
            }
            // Status: OK
            return res.status(200).json(row);
        }
        else if (id_projeto != undefined) {
            const [row] = await db.query(
                'SELECT Alocacoes.id_equipe as "id equipe" ,Equipes.nome as "equipes", Alocacoes.id_projeto as "id projeto" ,Projetos.nome as "projetos" FROM Alocacoes inner join Projetos on Projetos.id = Alocacoes.id_projeto inner join Equipes on Equipes.id = Alocacoes.id_equipe WHERE id_projeto= ?',
                [id_projeto]
            );
            if (row.length < 1) {
                // Status: Not Found
                return res.status(404).json(`Projeto de id= ${id_projeto} não tem nenhum equipe`);
            }
            // Status: OK
            return res.status(200).json(row);
        }
        else {
            const [row] = await db.query(
                'SELECT Alocacoes.id_equipe as "id equipe" ,Equipes.nome as "equipes", Alocacoes.id_projeto as "id projeto" ,Projetos.nome as "projetos" FROM Alocacoes inner join Projetos on Projetos.id = Alocacoes.id_projeto inner join Equipes on Equipes.id = Alocacoes.id_equipe WHERE id_equipe = ?',
                [id_equipe]
            );
            if (row.length < 1) {
                // Status: Not Found
                return res.status(404).json(`Equipe de id= ${id_equipe} não pertence a nenhuma projeto`);
            }
            // Status: OK
            return res.status(200).json(row);
        }
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

const QueryAlocacaoIdSchema = z.object({
    id_equipe: z.string({
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" })
        .regex(/^\d+$/, { message: "Id tem que ser numérico" }),
    id_projeto: z.string({
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" })
        .regex(/^\d+$/, { message: "Id tem que ser numérico" })

})

app.delete('/equipe/projeto/deletar', async (req, res) => {
    try {
        const verificacaoQuery = QueryAlocacaoIdSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id_equipe, id_projeto } = req.query;
        const [result] = await db.query(
            "DELETE FROM Alocacoes WHERE id_equipe=? and id_projeto=?", [id_equipe, id_projeto]);
        if (result.affectedRows > 0) {
            // Status: OK
            return res.status(200).json(`Equipe desvinculada do projeto`);
        }
        // Status: Not Found
        return res.status(404).json(`Equipe não é vinculada a este projeto.`);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
})

app.get('/projeto/tarefa/consultar', async (req, res) => {
    try {
        const verificacaoQuery = QueryConsultaIdSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id } = req.query;
        const [row] = await db.query(
            'select Tarefas.titulo as "Tarefas", Colaboradores.nome as "Colaboradores", Tarefas.status from Tarefas inner join Colaboradores on Colaboradores.id = Tarefas.id_colaborador where Tarefas.id_projeto = ?',
            [id]
        );
        if (row.length < 1) {
            // Status: Not Found
            return res.status(404).json(`Este projeto não tem nenhuma tarefa.`);
        }
        // Status: OK
        return res.status(200).json(row);
    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});

const QueryCargaHorariaSchema = z.object({
    id_colaborador: z.string({
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" })
        .regex(/^\d+$/, { message: "Id tem que ser numérico" }),
    id_projeto: z.string({
        required_error: "Campo obrigatório"
    })
        .min(1, { message: "Id tem que ter pelo menos 1 digito" })
        .regex(/^\d+$/, { message: "Id tem que ser numérico" })

})

app.get('/carga/trabalho/colaborador', async (req, res) => {
    try {
        const verificacaoQuery = QueryCargaHorariaSchema.safeParse(req.query);
        if (verificacaoQuery.success == false) return res.status(422).json({ error: verificacaoQuery.error.format() });
        const { id_colaborador, id_projeto } = req.query;
        const [row] = await db.query(
            'select CONCAT(convert(24 * (datediff(Tarefas.data_termino, Projetos.data_inicio )), CHAR), " horas")  as "Carga de Trabalho"  from Tarefas  inner join Projetos on Tarefas.id_projeto = Projetos.id  where id_colaborador = ? and id_projeto= ? ',
            [id_colaborador, id_projeto]
        );

        if (row.length < 1) {
            // Status: Not Found
            return res.status(404).json(`Colaborador não faz parte deste projeto.`);
        }

        // Status: OK
        return res.status(200).json(row[0]);

    }
    catch (e) {
        // Status: Internal Server Error
        return res.status(500).json(e);
    }
});


app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});



//1-Listar tarefas por projeto , colaborador e status.
//select Projetos.nome as "Projetos", Tarefas.titulo as "Tarefas", Colaboradores.nome as "Colaboradores", Tarefas.status from Projetos
//inner join Tarefas on Projetos.id = Tarefas.id_projeto 
//inner join Colaboradores on Colaboradores.id = Tarefas.id_colaborador where Projetos.id = ?;

//2-Atualizar status da tarefa (pedente, andamento, concluida)
//update Tarefas set status = "concluido" where id= {id_projeto};

//3-Não perimitir que uma tarefa seja criada para um colaborador que não faz parte do projeto.
//select Alocacoes.id_equipe from Membros 
//inner join Equipes on Equipes.id = Membros.id_equipe
//inner join Alocacoes on Equipes.id = Alocacoes.id_equipe
//where id_projeto= ? and id_colaborador= ?

//4-Visualizar carga de trabalho de um colaborador(tarefas atribuidas).
//select (24 * (datediff(curdate(), data_inicio ))) as 'Carga de Trabalho'  from Tarefas  
//inner join Projetos on Tarefas.id_projeto = Projetos.id  
//where id_colaborador = ? and id_projeto= ? ;
